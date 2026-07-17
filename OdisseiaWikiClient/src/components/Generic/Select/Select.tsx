import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
}, forwardedRef) => {
  const [focus, setFocus] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const controllerRef = useRef<HTMLDivElement>(null);
  const nativeSelectRef = useRef<HTMLSelectElement | null>(null);

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

  useEffect(() => {
    if (!error) return;
    controllerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [error]);

  useEffect(() => {
    if (!open) return;

    const handleOutsideInteraction = (event: MouseEvent | TouchEvent) => {
      if (!controllerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setFocus(hasValue);
      }
    };

    document.addEventListener('mousedown', handleOutsideInteraction);
    document.addEventListener('touchstart', handleOutsideInteraction);
    return () => {
      document.removeEventListener('mousedown', handleOutsideInteraction);
      document.removeEventListener('touchstart', handleOutsideInteraction);
    };
  }, [hasValue, open]);

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
    setOpen((current) => {
      const next = !current;
      if (next) setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
      return next;
    });
  }, [disabled, notifyFocus, selectedIndex]);

  const selectOption = useCallback((option: Option) => {
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
  }, [onChange]);

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

  return (
    <ContentController ref={controllerRef} width={width}>
      <Label width={width} height={height}>
        <NativeSelect
          ref={setSelectRef}
          value={value}
          required={required}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          onChange={() => undefined}
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
          error={error}
          typeStyle={typeStyle}
          height={height}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-required={required}
          onClick={toggleOpen}
          onFocus={notifyFocus}
          onBlur={() => !open && setFocus(hasValue)}
          onKeyDown={handleKeyDown}
        >
          <SelectValue>{selectedOption?.label ?? ''}</SelectValue>
          <SelectArrow $open={open} aria-hidden="true" />
        </SelectControl>

        <LabelSpan active={focus || hasValue}>{label}</LabelSpan>

        {open && (
          <SelectDropdown role="listbox" aria-label={label}>
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
        )}
      </Label>
      {error && errorMessage && <SpanError>{errorMessage}</SpanError>}
    </ContentController>
  );
});

Select.displayName = 'Select';
