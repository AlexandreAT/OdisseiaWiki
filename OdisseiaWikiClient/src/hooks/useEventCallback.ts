import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Stable identity for memoized controls, always calling the latest committed handler.
 * Runs synchronously with the original event: no debounce, queue or stale event snapshot.
 */
export function useEventCallback<Args extends unknown[], Result>(callback?: (...args: Args) => Result) {
  const latest = useRef(callback);
  useBrowserLayoutEffect(() => { latest.current = callback; }, [callback]);
  return useCallback((...args: Args) => latest.current?.(...args), []);
}
