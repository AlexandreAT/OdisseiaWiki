import { useEffect, useLayoutEffect, useRef } from 'react';

interface Option { value: string | number; label: string; description?: string }
const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Form builders often recreate equivalent option arrays on each keystroke.
 * Compare their public values, preserving real label/value/help changes.
 */
export function useStableOptions<T extends Option>(options: T[]): T[] {
  const previous = useRef(options);
  const equivalent = previous.current.length === options.length && previous.current.every((option, index) =>
    option.value === options[index].value && option.label === options[index].label &&
    option.description === options[index].description);
  const stable = equivalent ? previous.current : options;
  useBrowserLayoutEffect(() => { previous.current = stable; }, [stable]);
  return stable;
}
