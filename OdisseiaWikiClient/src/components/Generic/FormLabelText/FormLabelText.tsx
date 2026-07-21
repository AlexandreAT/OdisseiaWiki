import React from 'react';
import { RequiredMark } from './FormLabelText.style';

interface FormLabelTextProps {
  label: React.ReactNode;
  required?: boolean;
}

/**
 * Mantém compatibilidade com labels antigas que já possuem `*` no texto e
 * também atende componentes que sinalizam obrigatoriedade pela prop required.
 */
export const FormLabelText = ({ label, required = false }: FormLabelTextProps) => {
  const stringLabel = typeof label === 'string' ? label : null;
  const hasLegacyMark = stringLabel !== null && /\s*\*\s*$/.test(stringLabel);
  const visibleLabel = hasLegacyMark ? stringLabel.replace(/\s*\*\s*$/, '') : label;

  return (
    <>
      {visibleLabel}
      {(required || hasLegacyMark) && <RequiredMark aria-hidden="true">*</RequiredMark>}
    </>
  );
};
