import { useState, forwardRef, useEffect } from 'react';
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
    },
    ref
  ) => {
    const [focus, setFocus] = useState(false);

    useEffect(() => {
      if (value) setFocus(true);
    }, [value]);

    return (
      <ContentController width={width}>
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
            onFocus={e => {
              setFocus(true);
              if (onFocus) onFocus(e);
            }}
            onBlur={() => setFocus(!!value)}
            disabled={disabled}
          >
            <option value="" disabled hidden></option>
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