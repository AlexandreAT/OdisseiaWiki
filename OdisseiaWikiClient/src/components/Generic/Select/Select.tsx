import { useState, forwardRef, useEffect, useCallback, useRef } from 'react';
import {
  ContentController,
  Label,
  CustomSelect,
  LabelSpan,
  SpanError
} from './Select.style';

interface Option {
  value: number | string;
  label: string;
}

interface Props {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  label: string;
  value?: number | string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  error?: boolean;
  errorMessage?: string;
  required?: boolean;
  typeStyle?: 'primary' | 'secondary';
  width?: string;
  height?: string;
  options: Option[];
  disabled?: boolean;
  allowEmptyOption?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, Props>(
  (
    {
      theme,
      neon,
      label,
      value = '',
      onChange,
      onFocus,
      error,
      errorMessage,
      required,
      typeStyle = "primary",
      width,
      height,
      options,
      disabled,
      allowEmptyOption = true,
    },
    ref
  ) => {
    const [focus, setFocus] = useState(false);
    const controllerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (value) setFocus(true);
    }, [value]);

    useEffect(() => {
      if (!error) return;

      controllerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [error]);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLSelectElement>) => {
      setFocus(true);
      onFocus?.(e);
    }, [onFocus]);

    const handleBlur = useCallback(() => {
      setFocus(!!value);
    }, [value]);

    return (
      <ContentController ref={controllerRef} width={width}>
        <Label width={width} height={height}>
          <CustomSelect
            theme={theme}
            neon={neon}
            value={value}
            onChange={onChange}
            error={error}
            required={required}
            typeStyle={typeStyle}
            ref={ref}
            width={width}
            height={height}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
          >
            {allowEmptyOption && <option value="" disabled hidden></option>}
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </CustomSelect>
          <LabelSpan active={focus || !!value}>{label}</LabelSpan>
        </Label>
        {error && errorMessage && <SpanError>{errorMessage}</SpanError>}
      </ContentController>
    );
  }
);

Select.displayName = 'Select';
