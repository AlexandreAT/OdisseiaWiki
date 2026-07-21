import { useState, useRef, memo, useCallback, useEffect } from 'react';
import {
  ContentController,
  TextAreaLabel,
  TextAreaField,
  TextAreaLabelSpan,
  SpanError
} from './TextArea.style';
import { FormLabelText } from '../FormLabelText';
import { revealFirstValidationError } from '../../../utils/formValidationFeedback';

interface Props {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  label: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  error?: boolean;
  errorMessage?: string;
  required?: boolean;
  typeStyle?: 'primary' | 'secondary';
  width?: string;
  height?: string;
  rows?: number;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
  fullWidth?: boolean;
}

const TextAreaComponent = ({
  theme,
  neon,
  label,
  value,
  onChange,
  onFocus,
  error,
  errorMessage,
  required,
  typeStyle = 'primary',
  width,
  height,
  rows = 4,
  resize = 'vertical',
  fullWidth = false,
}: Props) => {
  const [focus, setFocus] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [nativeError, setNativeError] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const controllerRef = useRef<HTMLDivElement>(null);
  const hasError = Boolean(error || nativeError);

  useEffect(() => {
    if (hasError) revealFirstValidationError(controllerRef.current);
  }, [hasError]);
  
  const handleFocus = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    setFocus(true);
    onFocus?.(e);
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setFocus(false);
  }, []);

  const handleScroll = () => {
    if (!textAreaRef.current) return;
    setAtTop(textAreaRef.current.scrollTop === 0);
  };

  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (nativeError) setNativeError('');
    onChange?.(event);
  }, [nativeError, onChange]);

  const handleInvalid = useCallback((event: React.InvalidEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    setNativeError(errorMessage || 'Este campo é obrigatório.');
  }, [errorMessage]);

  return (
    <ContentController
      ref={controllerRef}
      width={width}
      height={height}
      fullWidth={fullWidth}
      data-validation-error={hasError || undefined}
    >
      <TextAreaLabel width={width} height={height}>
        <TextAreaField
          ref={textAreaRef}
          theme={theme}
          neon={neon}
          value={value}
          onChange={handleChange}
          onInvalid={handleInvalid}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onScroll={handleScroll}
          error={hasError}
          aria-invalid={hasError}
          required={required}
          typeStyle={typeStyle}
          width={width}
          height={height}
          rows={rows}
          resize={resize}
        />
        <TextAreaLabelSpan
          active={focus || !!value}
          style={{ opacity: atTop ? 1 : 0, transition: 'opacity 0.2s' }}
        >
          <FormLabelText label={label} required={required} />
        </TextAreaLabelSpan>
      </TextAreaLabel>
      {hasError && <SpanError>{errorMessage || nativeError}</SpanError>}
    </ContentController>
  );
};

export const TextArea = memo(TextAreaComponent);
