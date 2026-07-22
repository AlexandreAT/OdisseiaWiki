import { useState, useRef, useEffect, ReactNode, memo, useCallback, useMemo, CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import {
  ContentController,
  SearchLabel,
  SearchField,
  SearchLabelSpan,
  SpanError,
  IconWrapper,
  SuggestionsList
} from './Search.style';
import { getRankedSuggestions, getSuggestionDisplayLabel } from '../../../utils/searchSuggestions';
import { FormLabelText } from '../FormLabelText';
import { revealFirstValidationError } from '../../../utils/formValidationFeedback';

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
  portal?: boolean;
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
  loading = false,
  portal = false
}: Props) => {
  const [focus, setFocus] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [nativeError, setNativeError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const [anchorRect, setAnchorRect] = useState<{
    top: number;
    bottom: number;
    left: number;
    width: number;
  } | null>(null);
  const [suggestionsTop, setSuggestionsTop] = useState<number | null>(null);
  const hasError = Boolean(error || nativeError);
  const rankedSuggestions = useMemo(() => (
    getRankedSuggestions(suggestions, value ?? '', 5, getSuggestionDisplayLabel)
  ), [suggestions, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (suggestionsRef.current?.contains(target)) return;
      setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateSuggestionsPosition = useCallback(() => {
    const element = containerRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    setAnchorRect({
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
    });
    setSuggestionsTop(rect.bottom + 4);
  }, []);

  const hasSuggestions = showSuggestions && !disabled && (loading || rankedSuggestions.length > 0);

  useEffect(() => {
    if (!hasSuggestions || !portal) return;

    updateSuggestionsPosition();
    window.addEventListener('resize', updateSuggestionsPosition);
    window.addEventListener('scroll', updateSuggestionsPosition, true);
    return () => {
      window.removeEventListener('resize', updateSuggestionsPosition);
      window.removeEventListener('scroll', updateSuggestionsPosition, true);
    };
  }, [hasSuggestions, portal, updateSuggestionsPosition]);

  useEffect(() => {
    if (!hasSuggestions || !portal || !anchorRect) return;

    const animationFrame = window.requestAnimationFrame(() => {
      const suggestions = suggestionsRef.current;
      if (!suggestions) return;

      const safeMargin = 12;
      const gap = 4;
      const suggestionsHeight = suggestions.offsetHeight;
      const spaceBelow = window.innerHeight - anchorRect.bottom - safeMargin;
      const fitsAbove = anchorRect.top - safeMargin >= suggestionsHeight + gap;

      setSuggestionsTop(
        spaceBelow < suggestionsHeight && fitsAbove
          ? Math.max(safeMargin, anchorRect.top - suggestionsHeight - gap)
          : anchorRect.bottom + gap,
      );
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [anchorRect, hasSuggestions, portal]);

  useEffect(() => {
    if (hasError) revealFirstValidationError(containerRef.current);
  }, [hasError]);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setFocus(true);
    if (portal) updateSuggestionsPosition();
    setShowSuggestions(true);
    onFocus?.(e);
  }, [onFocus, portal, updateSuggestionsPosition]);

  const handleBlur = useCallback(() => {
    setFocus(false);
  }, []);

  const handleSelectSuggestion = useCallback((s: string) => {
    onSelectSuggestion?.(s);
    setShowSuggestions(false);
  }, [onSelectSuggestion]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (nativeError) setNativeError('');
    onChange?.(event);
  }, [nativeError, onChange]);

  const handleInvalid = useCallback((event: React.InvalidEvent<HTMLInputElement>) => {
    event.preventDefault();
    setNativeError(errorMessage || 'Este campo é obrigatório.');
  }, [errorMessage]);

  const renderSuggestions = (style?: CSSProperties) => (
    <SuggestionsList ref={suggestionsRef} theme={theme} neon={neon} style={style}>
      {loading && <li>Buscando...</li>}
      {!loading && rankedSuggestions.map((suggestion, index) => (
        <li
          key={`${suggestion}-${index}`}
          onClick={() => handleSelectSuggestion(suggestion)}
        >
          {getSuggestionDisplayLabel(suggestion)}
        </li>
      ))}
    </SuggestionsList>
  );

  const portalSuggestions = (() => {
    if (!hasSuggestions || !portal || !anchorRect || typeof document === 'undefined') return null;

    const safeMargin = 12;
    const dropdownWidth = Math.min(anchorRect.width, window.innerWidth - safeMargin * 2);
    const safeLeft = Math.min(
      Math.max(anchorRect.left, safeMargin),
      Math.max(safeMargin, window.innerWidth - dropdownWidth - safeMargin),
    );

    return createPortal(renderSuggestions({
      position: 'fixed',
      top: suggestionsTop ?? anchorRect.bottom + 4,
      left: safeLeft,
      width: dropdownWidth,
      maxWidth: `calc(100vw - ${safeMargin * 2}px)`,
      margin: 0,
      zIndex: 99999,
    }), document.body);
  })();

  return (
    <ContentController
      ref={containerRef}
      width={width}
      height={height}
      data-validation-error={hasError || undefined}
    >
      <SearchLabel width={width} height={height}>
        <SearchField
          theme={theme}
          neon={neon}
          onFocus={handleFocus}
          onBlur={handleBlur}
          value={value}
          onChange={handleChange}
          onInvalid={handleInvalid}
          error={hasError}
          aria-invalid={hasError}
          required={required}
          typeStyle={typeStyle}
          width={width}
          height={height}
          hasIcon={!!icon}
          iconSize={iconSize}
          disabled={disabled}
        />
        <SearchLabelSpan active={focus || !!value}>
          <FormLabelText label={label} required={required} />
        </SearchLabelSpan>
        {icon && (
          <IconWrapper theme={theme} neon={neon} active={focus || !!value} size={iconSize}>
            {icon}
          </IconWrapper>
        )}
      </SearchLabel>

      {hasSuggestions && !portal && renderSuggestions()}
      {portalSuggestions}

      {hasError && <SpanError>{errorMessage || nativeError}</SpanError>}
    </ContentController>
  );
};

export const Search = memo(SearchComponent);
