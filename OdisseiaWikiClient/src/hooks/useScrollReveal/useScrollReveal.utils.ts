import { UseScrollRevealOptions } from './useScrollReveal.types';

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
  // A revelação pertence ao elemento, não ao ciclo de efeitos do React.
  // Reflows, rolagem e StrictMode não devem apagar conteúdo já apresentado.
  if (element.classList.contains('sr-visible')) return;

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const rect = element.getBoundingClientRect();
  const isInitiallyVisible = rect.bottom > 0 && rect.top < window.innerHeight;
  const reveal = (animate: boolean) => {
    element.classList.remove('sr-pending', exitClass);
    element.classList.add('sr-visible');
    if (animate) element.classList.add(enterClass);
  };

  if (isInitiallyVisible || motionPreference.matches || typeof IntersectionObserver === 'undefined') {
    reveal(false);
    return;
  }

  const thresholds = normalizeThresholds(threshold);
  const requestedThreshold = thresholds.find((value) => value > 0) ?? 0.4;
  const maximumVisibleRatio = Math.min(1, window.innerHeight / Math.max(rect.height, 1));
  const enterThreshold = Math.min(requestedThreshold, maximumVisibleRatio * 0.72);
  let disposed = false;
  const observer = new IntersectionObserver(([entry]) => {
    if (disposed || !entry?.isIntersecting || entry.intersectionRatio < enterThreshold) return;
    reveal(true);
    dispose();
  }, { rootMargin, threshold: normalizeThresholds([...thresholds, enterThreshold]) });

  const onMotionChange = () => {
    if (!motionPreference.matches) return;
    reveal(false);
    dispose();
  };
  const dispose = () => {
    disposed = true;
    observer.disconnect();
    motionPreference.removeEventListener('change', onMotionChange);
    element.classList.remove('sr-pending');
  };

  // Só o conteúdo ainda fora da tela fica oculto, antes da primeira pintura.
  element.classList.add('sr-pending');
  observer.observe(element);
  motionPreference.addEventListener('change', onMotionChange);
  return dispose;
};
