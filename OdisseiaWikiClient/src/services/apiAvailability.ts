import axios, { AxiosError } from 'axios';
import { healthUrl } from '../axios/apiConfig';

export type ApiAvailabilityStatus = 'idle' | 'starting' | 'unavailable';
type StatusListener = (status: ApiAvailabilityStatus) => void;

const HEALTH_TIMEOUT_MS = 35_000;
const HEALTH_RETRY_DELAY_MS = 4_000;
const HEALTH_ATTEMPTS = 3;

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

      for (let attempt = 1; attempt <= HEALTH_ATTEMPTS; attempt += 1) {
        try {
          await axios.get(healthUrl, { timeout: HEALTH_TIMEOUT_MS });
          publishStatus('idle');
          return;
        } catch (error) {
          lastError = error;
          if (attempt < HEALTH_ATTEMPTS) await wait(HEALTH_RETRY_DELAY_MS);
        }
      }

      throw lastError;
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
