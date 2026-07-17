import { useState, forwardRef, useCallback, useEffect, useRef } from 'react';
import { ContentController, LoginLabel, LoginInput, LoginLabelSpan, SpanError } from './InputText.style';

interface Props {
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
    label: string;
    type?: string;
    value?: string | number;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
    error?: boolean;
    errorMessage?: string;
    required?: boolean;
    typeStyle?: 'primary' | 'secondary';
    width?: string;
    height?: string;
    name?: string;
    autoComplete?: string;
}

export const InputText = forwardRef<HTMLInputElement, Props>(
  ({
    theme,
    neon,
    label,
    type = "text",
    value,
    onChange,
    onFocus,
    error,
    errorMessage,
    required,
    typeStyle = "primary",
    width,
    height,
    name,
    autoComplete,
  }, ref) => {
    const [focus, setFocus] = useState(false);
    const controllerRef = useRef<HTMLDivElement>(null);
    const hasValue = value !== '' && value !== null && value !== undefined;

    useEffect(() => {
      if (!error) return;

      controllerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [error]);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setFocus(true);
      onFocus?.(e);
    }, [onFocus]);

    const handleBlur = useCallback(() => {
      setFocus(false);
    }, []);

    return (
      <ContentController ref={controllerRef} width={width}>
        <LoginLabel width={width} height={height}>
          <LoginInput
              theme={theme}
              neon={neon}
              onFocus={handleFocus}
              onBlur={handleBlur}
              value={value}
              onChange={onChange}
              type={type}
              error={error}
              required={required}
              typeStyle={typeStyle}
              ref={ref}
              width={width}
              height={height}
              name={name}
              autoComplete={autoComplete}
          />
          <LoginLabelSpan active={focus || hasValue}>{label}</LoginLabelSpan>
        </LoginLabel>
        {error && errorMessage && <SpanError>{errorMessage}</SpanError>}
      </ContentController>
    );
  }
);

InputText.displayName = 'InputText';
