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
