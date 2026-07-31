import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_REQUEST_TIMEOUT_MS, apiUrl } from './apiConfig';
import {
  isTransientApiError,
  waitForActiveServerWakeup,
  wakeApiServer,
} from '../services/apiAvailability';
import { beginApiRequest, finishApiRequest } from '../services/apiRequestActivity';
import {
  expireAuthSession,
  isAuthSessionExpirationInProgress,
  isTokenExpired,
} from '../services/authSession';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  __odisseiaRetryAttempted?: boolean;
  __odisseiaRequestTracked?: boolean;
}

const api = axios.create({
  baseURL: apiUrl,
  timeout: API_REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    await waitForActiveServerWakeup();

    const token = localStorage.getItem('token');
    if (token) {
      if (isTokenExpired(token)) {
        expireAuthSession();
        return new Promise<InternalAxiosRequestConfig>(() => undefined);
      }

      config.headers.Authorization = `Bearer ${token}`;
    }
    (config as RetryableRequestConfig).__odisseiaRequestTracked = true;
    beginApiRequest();
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    if ((response.config as RetryableRequestConfig).__odisseiaRequestTracked) finishApiRequest();
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as RetryableRequestConfig | undefined;
    if (config?.__odisseiaRequestTracked) finishApiRequest();

    if (
      error.response?.status === 401
      && (localStorage.getItem('token') || isAuthSessionExpirationInProgress())
    ) {
      if (!isAuthSessionExpirationInProgress()) expireAuthSession();
      return new Promise(() => undefined);
    }

    const isSafeGet = config?.method?.toLowerCase() === 'get';

    if (!config || !isTransientApiError(error)) {
      return Promise.reject(error);
    }

    if (!isSafeGet) {
      void wakeApiServer({ announceDelayMs: 0 }).catch(() => undefined);
      return Promise.reject(error);
    }

    if (config.__odisseiaRetryAttempted) return Promise.reject(error);

    config.__odisseiaRetryAttempted = true;

    try {
      await wakeApiServer({ announceDelayMs: 0 });
      return api.request(config);
    } catch {
      return Promise.reject(error);
    }
  },
);

export default api;
