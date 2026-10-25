import { useCallback, useEffect, useState } from 'react';
import type { SetStateAction } from 'react';

function readPreferences<T>(key: string, fallback: T, normalize: (value: unknown) => T): T {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : normalize(JSON.parse(value));
  } catch { return fallback; }
}

/** Browser preferences only: invalid/unavailable storage never blocks the screen. */
export function useStoredPreferences<T>(key: string, fallback: T, normalize: (value: unknown) => T) {
  const [stored, setStored] = useState(() => ({ key, value: readPreferences(key, fallback, normalize) }));
  const value = stored.key === key ? stored.value : readPreferences(key, fallback, normalize);
  useEffect(() => {
    if (stored.key !== key) {
      setStored(previous => previous.key === key ? previous : { key, value: readPreferences(key, fallback, normalize) });
      return;
    }
    try { localStorage.setItem(key, JSON.stringify(stored.value)); } catch { /* Storage may be disabled/full. */ }
  }, [key, stored, fallback, normalize]);
  const setValue = useCallback((update: SetStateAction<T>) => {
    setStored(previous => {
      const current = previous.key === key ? previous.value : readPreferences(key, fallback, normalize);
      return { key, value: normalize(typeof update === 'function' ? (update as (value: T) => T)(current) : update) };
    });
  }, [key, fallback, normalize]);
  return [value, setValue] as const;
}
