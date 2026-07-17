import { useSyncExternalStore } from 'react';

let activeRequests = 0;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

export const beginApiRequest = () => {
  activeRequests += 1;
  emit();
};

export const finishApiRequest = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  emit();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => activeRequests > 0;

export const useApiRequestActivity = () => (
  useSyncExternalStore(subscribe, getSnapshot, () => false)
);
