import {
  CSSProperties,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  ContentController,
  Label,
  LabelSpan,
  NativeSelect,
  SelectArrow,
  SelectControl,
  SelectDropdown,
  SelectOption,
  SelectValue,
  SpanError,
} from './Select.style';
import { FormLabelText } from '../FormLabelText';
import { revealFirstValidationError } from '../../../utils/formValidationFeedback';

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
  portal?: boolean;
}

const valuesMatch = (left: number | string | undefined, right: number | string) => (
  String(left ?? '') === String(right)
);

export const Select = forwardRef<HTMLSelectElement, Props>(({
  theme,
  neon,
  label,
  value = '',
  onChange,
  onFocus,
  error,
  errorMessage,
  required,
  typeStyle = 'primary',
  width,
  height,
  options,
  disabled,
  allowEmptyOption = true,
  portal = false,
}, forwardedRef) => {
  const [focus, setFocus] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [nativeError, setNativeError] = useState('');
  const controllerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const nativeSelectRef = useRef<HTMLSelectElement | null>(null);
  const [anchorRect, setAnchorRect] = useState<{
    top: number;
    bottom: number;
    left: number;
    width: number;
  } | null>(null);
  const [dropdownTop, setDropdownTop] = useState<number | null>(null);

  const selectedIndex = useMemo(
    () => options.findIndex((option) => valuesMatch(value, option.value)),
    [options, value],
  );
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;
  const hasValue = value !== '' && value !== null && value !== undefined;

  const setSelectRef = useCallback((element: HTMLSelectElement | null) => {
    nativeSelectRef.current = element;
    if (typeof forwardedRef === 'function') forwardedRef(element);
    else if (forwardedRef) forwardedRef.current = element;
  }, [forwardedRef]);

  useEffect(() => {
    setFocus(hasValue);
  }, [hasValue]);

  const hasError = Boolean(error || nativeError);

  useEffect(() => {
    if (!hasError) return;
    revealFirstValidationError(controllerRef.current);
  }, [hasError]);

  const updateDropdownPosition = useCallback(() => {
    const element = controllerRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    setAnchorRect({
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
    });
    setDropdownTop(rect.bottom + 4);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleOutsideInteraction = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (controllerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
      setFocus(hasValue);
    };

    document.addEventListener('mousedown', handleOutsideInteraction);
    document.addEventListener('touchstart', handleOutsideInteraction);
    return () => {
      document.removeEventListener('mousedown', handleOutsideInteraction);
      document.removeEventListener('touchstart', handleOutsideInteraction);
    };
  }, [hasValue, open]);

  useEffect(() => {
    if (!open || !portal) return;

    updateDropdownPosition();
    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);
    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [open, portal, updateDropdownPosition]);

  useEffect(() => {
    if (!open || !portal || !anchorRect) return;

    const animationFrame = window.requestAnimationFrame(() => {
      const dropdown = dropdownRef.current;
      if (!dropdown) return;

      const safeMargin = 12;
      const gap = 4;
      const dropdownHeight = dropdown.offsetHeight;
      const spaceBelow = window.innerHeight - anchorRect.bottom - safeMargin;
      const fitsAbove = anchorRect.top - safeMargin >= dropdownHeight + gap;

      setDropdownTop(
        spaceBelow < dropdownHeight && fitsAbove
          ? Math.max(safeMargin, anchorRect.top - dropdownHeight - gap)
          : anchorRect.bottom + gap,
      );
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [anchorRect, open, portal]);

  const notifyFocus = useCallback(() => {
    setFocus(true);
    const element = nativeSelectRef.current;
    if (element) {
      onFocus?.({ target: element, currentTarget: element } as React.FocusEvent<HTMLSelectElement>);
    }
  }, [onFocus]);

  const toggleOpen = useCallback(() => {
    if (disabled) return;
    notifyFocus();
    if (!open && portal) updateDropdownPosition();
    setOpen((current) => {
      const next = !current;
      if (next) setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
      return next;
    });
  }, [disabled, notifyFocus, open, portal, selectedIndex, updateDropdownPosition]);

  const selectOption = useCallback((option: Option) => {
    if (nativeError) setNativeError('');
    const element = nativeSelectRef.current;
    if (element) {
      const target = Object.create(element) as HTMLSelectElement;
      Object.defineProperty(target, 'value', {
        configurable: true,
        value: String(option.value),
      });
      onChange?.({ target, currentTarget: target } as React.ChangeEvent<HTMLSelectElement>);
    }

    setOpen(false);
    setFocus(true);
  }, [nativeError, onChange]);

  const handleInvalid = useCallback((event: React.InvalidEvent<HTMLSelectElement>) => {
    event.preventDefault();
    setNativeError(errorMessage || 'Selecione uma op\u00e7\u00e3o.');
  }, [errorMessage]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (event.key === 'Escape') {
      setOpen(false);
      setFocus(hasValue);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      notifyFocus();
      setOpen(true);
      setActiveIndex((current) => {
        const start = current >= 0 ? current : selectedIndex;
        const offset = event.key === 'ArrowDown' ? 1 : -1;
        return Math.min(Math.max(start + offset, 0), Math.max(options.length - 1, 0));
      });
      return;
    }

    if ((event.key === 'Enter' || event.key === ' ') && open && activeIndex >= 0) {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) selectOption(option);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleOpen();
    }
  }, [activeIndex, disabled, hasValue, notifyFocus, open, options, selectOption, selectedIndex, toggleOpen]);

  const renderDropdown = (style?: CSSProperties) => (
    <SelectDropdown ref={dropdownRef} role="listbox" aria-label={label} style={style}>
      {options.map((option, index) => (
        <SelectOption
          type="button"
          role="option"
          key={option.value}
          $selected={valuesMatch(value, option.value)}
          $active={activeIndex === index}
          aria-selected={valuesMatch(value, option.value)}
          onMouseEnter={() => setActiveIndex(index)}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => selectOption(option)}
        >
          {option.label}
        </SelectOption>
      ))}
    </SelectDropdown>
  );

  const portalDropdown = (() => {
    if (!open || !portal || !anchorRect || typeof document === 'undefined') return null;

    const safeMargin = 12;
    const dropdownWidth = Math.min(anchorRect.width, window.innerWidth - safeMargin * 2);
    const safeLeft = Math.min(
      Math.max(anchorRect.left, safeMargin),
      Math.max(safeMargin, window.innerWidth - dropdownWidth - safeMargin),
    );

    return createPortal(renderDropdown({
      position: 'fixed',
      top: dropdownTop ?? anchorRect.bottom + 4,
      left: safeLeft,
      width: dropdownWidth,
      maxWidth: `calc(100vw - ${safeMargin * 2}px)`,
      zIndex: 99999,
    }), document.body);
  })();

  return (
    <ContentController ref={controllerRef} width={width} data-validation-error={hasError || undefined}>
      <Label width={width} height={height}>
        <NativeSelect
          ref={setSelectRef}
          value={value}
          required={required}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          onChange={() => undefined}
          onInvalid={handleInvalid}
        >
          {allowEmptyOption && <option value="" />}
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </NativeSelect>

        <SelectControl
          type="button"
          theme={theme}
          neon={neon}
          error={hasError}
          typeStyle={typeStyle}
          height={height}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-required={required}
          aria-invalid={hasError}
          data-validation-focus="true"
          onClick={toggleOpen}
          onFocus={notifyFocus}
          onBlur={() => !open && setFocus(hasValue)}
          onKeyDown={handleKeyDown}
        >
          <SelectValue>{selectedOption?.label ?? ''}</SelectValue>
          <SelectArrow $open={open} aria-hidden="true" />
        </SelectControl>

        <LabelSpan active={focus || hasValue}>
          <FormLabelText label={label} required={required} />
        </LabelSpan>

        {open && !portal && renderDropdown()}
      </Label>
      {portalDropdown}
      {hasError && <SpanError>{errorMessage || nativeError}</SpanError>}
    </ContentController>
  );
});

Select.displayName = 'Select';
