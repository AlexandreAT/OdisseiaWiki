import { UseScrollRevealOptions } from './useScrollReveal.types';
import { isMotionReduced, subscribeMotionPreference } from '../../utils/motionPreference';

const normalizeThresholds = (threshold: number | number[]) => {
  const values = Array.isArray(threshold) ? threshold : [threshold];
  return [...new Set([0, ...values])].sort((first, second) => first - second);
};

export const observeScrollReveal = (
  element: HTMLElement,
  {
    rootMargin = '0px',
    threshold = 0.4,
    enterClass = 'sr-entered',
    exitClass = 'sr-exited',
  }: UseScrollRevealOptions = {},
) => {
  const rect = element.getBoundingClientRect();
  const isInitiallyVisible = rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
  const reveal = (animate: boolean) => {
    element.classList.remove('sr-pending', exitClass);
    element.classList.add('sr-visible');
    if (animate) element.classList.add(enterClass);
    else element.classList.remove(enterClass);
  };

  if (typeof IntersectionObserver === 'undefined') {
    reveal(false);
    return;
  }

  const thresholds = normalizeThresholds(threshold);
  const requestedThreshold = thresholds.find((value) => value > 0) ?? 0.4;
  let disposed = false;
  let observer: IntersectionObserver;
  let entered = element.classList.contains(enterClass);
  const observe = () => {
    if (disposed) return;
    observer?.disconnect();
    const height = Math.max(element.getBoundingClientRect().height, 1);
    const maximumVisibleRatio = Math.min(1, window.innerHeight / height);
    const enterThreshold = Math.min(requestedThreshold, maximumVisibleRatio * 0.72);
    const currentObserver = new IntersectionObserver(([entry]) => {
      if (disposed || observer !== currentObserver || !entry || isMotionReduced()) return;
      if (entry.isIntersecting && entry.intersectionRatio >= enterThreshold) {
        reveal(true);
        entered = true;
      } else if (!entry.isIntersecting && entered) {
        // Recomeça apenas fora da tela; oscilar no limiar não faz o conteúdo piscar.
        element.classList.remove('sr-visible', enterClass);
        element.classList.add('sr-pending', exitClass);
        entered = false;
      }
    }, { rootMargin, threshold: normalizeThresholds([...thresholds, enterThreshold]) });
    observer = currentObserver;
    observer.observe(element);
  };

  const onMotionChange = () => {
    const currentRect = element.getBoundingClientRect();
    if (isMotionReduced()) {
      reveal(false);
      entered = false;
    } else if (currentRect.height > 0 && currentRect.bottom > 0 && currentRect.top < window.innerHeight) {
      reveal(true);
      entered = true;
    } else {
      element.classList.remove('sr-visible', enterClass);
      element.classList.add('sr-pending');
      entered = false;
    }
    observe();
  };
  const unsubscribe = subscribeMotionPreference(onMotionChange);
  // Imagens, fontes e mudanças de largura podem alterar a altura depois da montagem.
  const resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(observe);
  resizeObserver?.observe(element);
  window.addEventListener('resize', observe);
  const dispose = () => {
    disposed = true;
    observer.disconnect();
    resizeObserver?.disconnect();
    window.removeEventListener('resize', observe);
    unsubscribe();
    element.classList.remove('sr-pending');
  };

  // O layout effect arma a entrada antes da pintura, inclusive na primeira tela.
  if (isMotionReduced()) reveal(false);
  else if (isInitiallyVisible) { reveal(true); entered = true; }
  else element.classList.add('sr-pending');
  observe();
  return dispose;
};
