export type MotionPreference = 'full' | 'reduced' | 'system';

export const MOTION_STORAGE_KEY = 'odisseia:motion';
const listeners = new Set<() => void>();
let preference: MotionPreference = 'full';
let systemQuery: MediaQueryList | undefined;
let initialized = false;

const readPreference = (): MotionPreference => {
  try {
    const saved = window.localStorage.getItem(MOTION_STORAGE_KEY);
    if (saved === 'reduced' || saved === 'system') return saved;
  } catch { /* A escolha também funciona sem armazenamento disponível. */ }
  return 'full';
};

export const isMotionReduced = () => preference === 'reduced'
  || (preference === 'system' && !!systemQuery?.matches);
export const getMotionPreference = () => preference;

const publish = () => {
  // A raiz inclui os portais de modais e popovers, além das páginas.
  document.documentElement.dataset.motion = isMotionReduced() ? 'reduced' : 'full';
  listeners.forEach((listener) => listener());
};

export const initializeMotionPreference = () => {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  preference = readPreference();
  systemQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  systemQuery?.addEventListener('change', publish);
  window.addEventListener('storage', (event) => {
    if (event.key !== MOTION_STORAGE_KEY && event.key !== null) return;
    preference = readPreference();
    publish();
  });
  publish();
};

export const setMotionPreference = (value: MotionPreference) => {
  initializeMotionPreference();
  preference = value;
  try { window.localStorage.setItem(MOTION_STORAGE_KEY, value); } catch { /* Apenas nesta aba. */ }
  publish();
};

export const subscribeMotionPreference = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
