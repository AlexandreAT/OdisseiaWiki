const VALIDATION_ERROR_SELECTOR = '[data-validation-error="true"]';

let scheduledFrame: number | null = null;

const findFocusableElement = (container: Element): HTMLElement | null => {
  if (container instanceof HTMLElement && container.matches('input, textarea, select, button, [contenteditable="true"]')) {
    return container;
  }

  const explicitTarget = container.querySelector<HTMLElement>('[data-validation-focus="true"]');
  if (explicitTarget) return explicitTarget;

  return container.querySelector<HTMLElement>(
    'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [contenteditable="true"]',
  );
};

/**
 * Centraliza o feedback de validação: revela e foca sempre o primeiro erro do
 * formulário, mesmo quando várias validações são atualizadas no mesmo render.
 */
export const revealFirstValidationError = (origin?: Element | null) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  if (scheduledFrame !== null) window.cancelAnimationFrame(scheduledFrame);
  scheduledFrame = window.requestAnimationFrame(() => {
    scheduledFrame = null;
    const scope = origin?.closest('form') ?? document;
    const firstError = scope.querySelector<HTMLElement>(VALIDATION_ERROR_SELECTOR);
    if (!firstError) return;

    firstError.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    window.setTimeout(() => findFocusableElement(firstError)?.focus({ preventScroll: true }), 280);
  });
};
