import axios, { AxiosError } from 'axios';
import { readinessUrl } from '../axios/apiConfig';

export type ApiAvailabilityStatus = 'idle' | 'starting' | 'unavailable';
type StatusListener = (status: ApiAvailabilityStatus) => void;

interface ReadinessResponse {
  status?: unknown;
}

const READINESS_REQUEST_TIMEOUT_MS = 15_000;
const READINESS_RETRY_DELAY_MS = 3_000;
const SERVER_WAKE_WINDOW_MS = 140_000;

let currentStatus: ApiAvailabilityStatus = 'idle';
let activeWakeRequest: Promise<void> | null = null;
const listeners = new Set<StatusListener>();

const publishStatus = (status: ApiAvailabilityStatus) => {
  currentStatus = status;
  listeners.forEach((listener) => listener(status));
};

const wait = (milliseconds: number) => new Promise<void>((resolve) => {
  window.setTimeout(resolve, milliseconds);
});

const isHealthyReadinessResponse = (data: unknown): data is ReadinessResponse => {
  if (!data || typeof data !== 'object') return false;

  const { status } = data as ReadinessResponse;
  return typeof status === 'string' && status.toLowerCase() === 'healthy';
};

const checkApiReadiness = async (timeout: number) => {
  const response = await axios.get<ReadinessResponse>(readinessUrl, {
    timeout,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!isHealthyReadinessResponse(response.data)) {
    throw new Error('A API respondeu, mas o banco ainda não está pronto.');
  }
};

export const getApiAvailabilityStatus = () => currentStatus;

export const subscribeToApiAvailability = (listener: StatusListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const waitForActiveServerWakeup = async () => {
  if (!activeWakeRequest) return;

  try {
    await activeWakeRequest;
  } catch {
    // The original request still runs and reports its own controlled error.
  }
};

export const wakeApiServer = ({ announceDelayMs = 900 }: { announceDelayMs?: number } = {}) => {
  if (activeWakeRequest) return activeWakeRequest;

  activeWakeRequest = (async () => {
    const announceTimer = window.setTimeout(
      () => publishStatus('starting'),
      Math.max(0, announceDelayMs),
    );

    try {
      let lastError: unknown;
      const wakeDeadline = Date.now() + SERVER_WAKE_WINDOW_MS;

      while (Date.now() < wakeDeadline) {
        try {
          const remainingTime = wakeDeadline - Date.now();
          const requestTimeout = Math.max(
            1,
            Math.min(READINESS_REQUEST_TIMEOUT_MS, remainingTime),
          );
          await checkApiReadiness(requestTimeout);
          publishStatus('idle');
          return;
        } catch (error) {
          lastError = error;

          const remainingTime = wakeDeadline - Date.now();
          if (remainingTime > 0) {
            await wait(Math.min(READINESS_RETRY_DELAY_MS, remainingTime));
          }
        }
      }

      throw lastError ?? new Error('A API não ficou pronta dentro do tempo esperado.');
    } catch (error) {
      publishStatus('unavailable');
      throw error;
    } finally {
      window.clearTimeout(announceTimer);
      activeWakeRequest = null;
    }
  })();

  return activeWakeRequest;
};

export const isTransientApiError = (error: AxiosError) => {
  if (error.code === 'ERR_CANCELED') return false;
  if (!error.response) return true;
  return [502, 503, 504].includes(error.response.status);
};
