import { useEffect, useRef } from 'react';
import { UseScrollRevealOptions } from './useScrollReveal.types';

const DEFAULT_ENTER_CLASS = 'sr-entered';
const DEFAULT_EXIT_CLASS = 'sr-exited';
const INITIAL_VISIBLE_CLASS = 'sr-initial-visible';
const DEFAULT_THRESHOLD = 0.4;

const normalizeThresholds = (threshold: number | number[]) => {
  const values = Array.isArray(threshold) ? threshold : [threshold];
  return [...new Set([0, ...values])].sort((first, second) => first - second);
};

const getEnterThreshold = (thresholds: number[]) => (
  thresholds.find((value) => value > 0) ?? DEFAULT_THRESHOLD
);

export const useScrollReveal = <T extends HTMLElement = HTMLElement>({
  rootMargin = '0px',
  threshold = DEFAULT_THRESHOLD,
  enterClass = DEFAULT_ENTER_CLASS,
  exitClass = DEFAULT_EXIT_CLASS,
}: UseScrollRevealOptions = {}) => {
  const elementRef = useRef<T>(null);
  const hasEnteredRef = useRef(false);
  const thresholdKey = JSON.stringify(threshold);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const configuredThresholds = normalizeThresholds(
      JSON.parse(thresholdKey) as number | number[],
    );
    const requestedThreshold = getEnterThreshold(configuredThresholds);
    const elementHeight = Math.max(element.getBoundingClientRect().height, 1);
    const maximumVisibleRatio = Math.min(1, window.innerHeight / elementHeight);
    const enterThreshold = Math.min(requestedThreshold, maximumVisibleRatio * 0.9);
    const observerThresholds = normalizeThresholds([
      ...configuredThresholds,
      enterThreshold,
    ]);

    const showWithoutAnimation = () => {
      element.classList.remove(exitClass);
      element.classList.add(enterClass);
      hasEnteredRef.current = true;
    };

    if (
      typeof IntersectionObserver === 'undefined'
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      showWithoutAnimation();
      return;
    }

    const initialRect = element.getBoundingClientRect();
    const initiallyVisibleHeight = Math.max(
      0,
      Math.min(initialRect.bottom, window.innerHeight) - Math.max(initialRect.top, 0),
    );
    const initialVisibleRatio = initiallyVisibleHeight / elementHeight;

    if (initialVisibleRatio >= enterThreshold) {
      element.classList.add(INITIAL_VISIBLE_CLASS);
      showWithoutAnimation();
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= enterThreshold) {
        element.classList.remove(exitClass);
        element.classList.add(enterClass);
        hasEnteredRef.current = true;
        return;
      }

      if (!entry.isIntersecting && hasEnteredRef.current) {
        element.classList.remove(INITIAL_VISIBLE_CLASS);
        element.classList.remove(enterClass);
        element.classList.add(exitClass);
      }
    }, {
      rootMargin,
      threshold: observerThresholds,
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [enterClass, exitClass, rootMargin, thresholdKey]);

  return elementRef;
};
