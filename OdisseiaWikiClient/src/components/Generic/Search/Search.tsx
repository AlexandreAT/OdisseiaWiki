import { useState, useRef, useEffect, ReactNode, memo, useCallback } from 'react';
import {
  ContentController,
  SearchLabel,
  SearchField,
  SearchLabelSpan,
  SpanError,
  IconWrapper,
  SuggestionsList
} from './Search.style';

interface Props {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  label: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: boolean;
  errorMessage?: string;
  required?: boolean;
  typeStyle?: 'primary' | 'secondary';
  width?: string;
  height?: string;
  icon?: ReactNode;
  iconSize?: number;
  disabled?: boolean;
  suggestions?: string[];
  onSelectSuggestion?: (value: string) => void;
  loading?: boolean;
}

const SearchComponent = ({
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
  icon,
  iconSize = 20,
  disabled = false,
  suggestions = [],
  onSelectSuggestion,
  loading = false
}: Props) => {
  const [focus, setFocus] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setFocus(true);
    setShowSuggestions(true);
    onFocus?.(e);
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setFocus(false);
  }, []);

  const handleSelectSuggestion = useCallback((s: string) => {
    onSelectSuggestion?.(s);
    setShowSuggestions(false);
  }, [onSelectSuggestion]);

  return (
    <ContentController ref={containerRef} width={width} height={height}>
      <SearchLabel width={width} height={height}>
        <SearchField
          theme={theme}
          neon={neon}
          onFocus={handleFocus}
          onBlur={handleBlur}
          value={value}
          onChange={onChange}
          error={error}
          required={required}
          typeStyle={typeStyle}
          width={width}
          height={height}
          hasIcon={!!icon}
          iconSize={iconSize}
          disabled={disabled}
        />
        <SearchLabelSpan active={focus || !!value}>{label}</SearchLabelSpan>
        {icon && (
          <IconWrapper theme={theme} neon={neon} active={focus || !!value} size={iconSize}>
            {icon}
          </IconWrapper>
        )}
      </SearchLabel>

      {showSuggestions && !disabled && suggestions.length > 0 && (
        <SuggestionsList theme={theme} neon={neon}>
          {loading && <li>Buscando...</li>} {/* ✅ loading visual */}
          {!loading && suggestions.length > 0 && suggestions.map((s, i) => (
            <li
              key={i}
              onClick={() => handleSelectSuggestion(s)}
            >
              {s}
            </li>
          ))}
          {!loading && suggestions.length == 0 && (
            <li>Nenhum resultado encontrado</li>
          )}
        </SuggestionsList>
      )}

      {error && errorMessage && <SpanError>{errorMessage}</SpanError>}
    </ContentController>
  );
};

export const Search = memo(SearchComponent);