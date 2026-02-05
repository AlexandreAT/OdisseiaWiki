import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { createPortal } from "react-dom";
import {
  ContentController,
  Label,
  LabelSpan,
  SpanError,
} from '../Select/Select.style';
import {
  CheckListContainer,
  CheckListDropdown,
  CheckDisplay
} from './CheckSelect.style';
import { CheckBox } from '../CheckBox/CheckBox';

interface Option {
  value: string;
  label: string;
}

interface CheckSelectProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  label: string;
  value?: string[];
  onChange?: (value: string[]) => void;
  error?: boolean;
  errorMessage?: string;
  required?: boolean;
  typeStyle?: 'primary' | 'secondary';
  width?: string;
  height?: string;
  options: Option[];
}

const CheckSelectComponent = ({
  theme,
  neon,
  label,
  value = [],
  onChange,
  error,
  errorMessage,
  required,
  typeStyle = 'primary',
  width,
  height,
  options
}: CheckSelectProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [focus, setFocus] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>(value || []);

  const [rect, setRect] = useState<{ top: number; bottom: number; left: number; width: number } | null>(null);

  const [finalTop, setFinalTop] = useState<number | null>(null);


  useEffect(() => {
    setSelectedValues(value || []);
    if ((value || []).length > 0) setFocus(true);
  }, [value]);


  const computeRect = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, bottom: r.bottom, left: r.left, width: r.width });
  
    setFinalTop(r.bottom);
  }, []);


  const toggleOpen = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!open) {
      computeRect();
      setOpen(true);
    } else {
      setOpen(false);
    
      if (selectedValues.length === 0) setFocus(false);
    }
    setFocus(true);
  }, [open, selectedValues.length, computeRect]);


  const toggleCheck = useCallback((val: string) => {
    const updated = selectedValues.includes(val)
      ? selectedValues.filter(v => v !== val)
      : [...selectedValues, val];
    setSelectedValues(updated);
    onChange?.(updated);
  }, [selectedValues, onChange]);


  useEffect(() => {
    if (!open) return;

    const onDocClick = (evt: MouseEvent) => {
      const target = evt.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
      if (selectedValues.length === 0) setFocus(false);
    };

    const onEsc = (evt: KeyboardEvent) => {
      if (evt.key === "Escape") {
        setOpen(false);
        if (selectedValues.length === 0) setFocus(false);
      }
    };

    const onScrollOrResize = () => {
      computeRect();
    };

    window.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onEsc);
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);

    return () => {
      window.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onEsc);
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  
  }, [open, selectedValues]);


  useEffect(() => {
    if (!open) return;

  
    const id = setTimeout(() => {
      const dd = dropdownRef.current;
      const r = rect;
      if (!dd || !r) return;
      const ddh = dd.offsetHeight;
      const spaceBelow = window.innerHeight - r.bottom;
    
      if (spaceBelow < ddh && r.top > ddh) {
        setFinalTop(Math.max(8, r.top - ddh));
      } else {
        setFinalTop(r.bottom);
      }
    }, 0);

    return () => clearTimeout(id);
  }, [open, rect]);



  const dropdownPortal = (() => {
    if (!open || !rect || typeof document === "undefined") return null;

    const style: React.CSSProperties = {
      position: 'fixed',
      top: finalTop !== null ? finalTop : rect.bottom,
      left: rect.left,
      minWidth: rect.width,
      width: 'auto',       
      zIndex: 99999,
      display: 'inline-block',
    };

    return createPortal(
      <CheckListDropdown
        ref={dropdownRef as any}
        theme={theme}
        neon={neon}
        style={style as any}
      >
        {options.map(opt => (
          <CheckListContainer key={opt.value}>
            <CheckBox
              neon={neon}
              label={opt.label}
              checked={selectedValues.includes(opt.value)}
              onChange={() => toggleCheck(opt.value)}
            />
          </CheckListContainer>
        ))}
      </CheckListDropdown>,
      document.body
    );
  })();

  return (
    <ContentController width={width} ref={containerRef}>
      <Label width={width} height={height} onClick={toggleOpen}>
        <CheckDisplay
          theme={theme}
          neon={neon}
          focus={focus}
          error={error}
          height={height}
        >
          {selectedValues.length > 0
            ? selectedValues
                .map(v => options.find(o => o.value === v)?.label)
                .filter(Boolean)
                .join(', ')
            : ''}
        </CheckDisplay>
        <LabelSpan active={focus || selectedValues.length > 0} typeStyle={typeStyle}>
          {label}
        </LabelSpan>
      </Label>

      {/* portal dropdown */}
      {dropdownPortal}

      {error && errorMessage && <SpanError>{errorMessage}</SpanError>}
    </ContentController>
  );
};

export const CheckSelect = memo(CheckSelectComponent);