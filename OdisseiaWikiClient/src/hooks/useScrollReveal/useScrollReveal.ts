import { useLayoutEffect, useRef } from 'react';
import { UseScrollRevealOptions } from './useScrollReveal.types';
import { observeScrollReveal } from './useScrollReveal.utils';

export const useScrollReveal = <T extends HTMLElement = HTMLElement>({
  rootMargin = '0px',
  threshold = 0.4,
  enterClass = 'sr-entered',
  exitClass = 'sr-exited',
}: UseScrollRevealOptions = {}) => {
  const elementRef = useRef<T>(null);
  const thresholdKey = JSON.stringify(threshold);

  useLayoutEffect(() => {
    if (!elementRef.current) return;

    return observeScrollReveal(elementRef.current, {
      rootMargin,
      threshold: JSON.parse(thresholdKey) as number | number[],
      enterClass,
      exitClass,
    });
  }, [enterClass, exitClass, rootMargin, thresholdKey]);

  return elementRef;
};
