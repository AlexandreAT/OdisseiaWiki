import type React from 'react';

export const selectNumericInputValue = (input: HTMLInputElement) => {
  if (input.disabled || input.readOnly) return;

  const selectValue = () => {
    if (document.activeElement !== input) return;

    try {
      input.select();
    } catch {
      // Alguns navegadores não expõem a seleção visual de inputs numéricos.
    }
  };

  selectValue();

  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(selectValue);
  }
};

export const handleNumericInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
  selectNumericInputValue(event.currentTarget);
};

/** Event delegation also covers numeric fields outside the shared form components. */
export const installNumericInputSelection = () => {
  const selectTarget = (target: EventTarget | null) => {
    if (target instanceof HTMLInputElement &&
        (target.type === 'number' || target.inputMode === 'numeric' || target.inputMode === 'decimal')) {
      selectNumericInputValue(target);
    }
  };
  const onFocus = (event: FocusEvent) => selectTarget(event.target);
  const onPointerUp = (event: PointerEvent) => selectTarget(event.target);
  document.addEventListener('focusin', onFocus);
  document.addEventListener('pointerup', onPointerUp);
  return () => {
    document.removeEventListener('focusin', onFocus);
    document.removeEventListener('pointerup', onPointerUp);
  };
};
