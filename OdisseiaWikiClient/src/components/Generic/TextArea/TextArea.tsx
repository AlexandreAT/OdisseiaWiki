import { useState, useRef } from 'react';
import {
  ContentController,
  TextAreaLabel,
  TextAreaField,
  TextAreaLabelSpan,
  SpanError
} from './TextArea.style';

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

export const TextArea = ({
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
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleScroll = () => {
    if (!textAreaRef.current) return;
    setAtTop(textAreaRef.current.scrollTop === 0);
  };

  return (
    <ContentController width={width} height={height} fullWidth={fullWidth}>
      <TextAreaLabel width={width} height={height}>
        <TextAreaField
          ref={textAreaRef}
          theme={theme}
          neon={neon}
          value={value}
          onChange={onChange}
          onFocus={e => {
            setFocus(true);
            if (onFocus) onFocus(e);
          }}
          onBlur={() => setFocus(false)}
          onScroll={handleScroll}
          error={error}
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
          {label}
        </TextAreaLabelSpan>
      </TextAreaLabel>
      {error && errorMessage && <SpanError>{errorMessage}</SpanError>}
    </ContentController>
  );
};