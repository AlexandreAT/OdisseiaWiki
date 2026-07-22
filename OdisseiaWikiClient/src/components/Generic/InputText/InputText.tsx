import { useState, forwardRef, useCallback, useEffect, useRef } from 'react';
import { ContentController, LoginLabel, LoginInput, LoginLabelSpan, SpanError } from './InputText.style';
import { FormLabelText } from '../FormLabelText';
import { revealFirstValidationError } from '../../../utils/formValidationFeedback';
import { selectNumericInputValue } from '../../../utils/numericInput';

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
    const [nativeError, setNativeError] = useState('');
    const controllerRef = useRef<HTMLDivElement>(null);
    const hasValue = value !== '' && value !== null && value !== undefined;

    const hasError = Boolean(error || nativeError);

    useEffect(() => {
      if (!hasError) return;

      revealFirstValidationError(controllerRef.current);
    }, [hasError]);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setFocus(true);
      if (type === 'number') selectNumericInputValue(e.currentTarget);
      onFocus?.(e);
    }, [onFocus, type]);

    const handleBlur = useCallback(() => {
      setFocus(false);
    }, []);

    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      if (nativeError) setNativeError('');
      onChange?.(event);
    }, [nativeError, onChange]);

    const handleInvalid = useCallback((event: React.InvalidEvent<HTMLInputElement>) => {
      event.preventDefault();
      setNativeError(errorMessage || 'Este campo \u00e9 obrigat\u00f3rio.');
    }, [errorMessage]);

    return (
      <ContentController ref={controllerRef} width={width} data-validation-error={hasError || undefined}>
        <LoginLabel width={width} height={height}>
          <LoginInput
              theme={theme}
              neon={neon}
              onFocus={handleFocus}
              onBlur={handleBlur}
              value={value}
              onChange={handleChange}
              onInvalid={handleInvalid}
              type={type}
              error={hasError}
              required={required}
              typeStyle={typeStyle}
              ref={ref}
              width={width}
              height={height}
              name={name}
              aria-invalid={hasError}
              autoComplete={autoComplete}
          />
          <LoginLabelSpan active={focus || hasValue}>
            <FormLabelText label={label} required={required} />
          </LoginLabelSpan>
        </LoginLabel>
        {hasError && <SpanError>{errorMessage || nativeError}</SpanError>}
      </ContentController>
    );
  }
);

InputText.displayName = 'InputText';
