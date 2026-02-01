import { useState, forwardRef, useCallback } from 'react';
import { ContentController, LoginLabel, LoginInput, LoginLabelSpan, SpanError } from './InputText.style';

interface Props {
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
    label: string;
    type?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
    error?: boolean;
    errorMessage?: string;
    required?: boolean;
    typeStyle?: 'primary' | 'secondary';
    width?: string;
    height?: string;
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
    height
  }, ref) => {
    const [focus, setFocus] = useState(false);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setFocus(true);
      onFocus?.(e);
    }, [onFocus]);

    const handleBlur = useCallback(() => {
      setFocus(false);
    }, []);

    return (
      <ContentController width={width}>
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
          />
          <LoginLabelSpan active={focus || !!value}>{label}</LoginLabelSpan>
        </LoginLabel>
        {error && errorMessage && <SpanError>{errorMessage}</SpanError>}
      </ContentController>
    );
  }
);

InputText.displayName = 'InputText';