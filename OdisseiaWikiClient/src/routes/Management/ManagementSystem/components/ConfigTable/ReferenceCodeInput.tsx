import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ReferenceHint, ReferenceSuggestion, ReferenceSuggestions } from './ConfigTable.style';

export interface ReferenceOption { value: string; label: string }

interface Props {
  value: string;
  label: string;
  options: ReferenceOption[];
  disabled: boolean;
  maxLength?: number;
  placeholder?: string;
  onChange: (value: string) => void;
}

export function ReferenceCodeInput({ value, label, options, disabled, maxLength, placeholder, onChange }: Props) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const committed = useRef(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  useEffect(() => { setDraft(value); }, [value]);
  const query = draft.trim().toLocaleLowerCase('pt-BR');
  const matches = options.filter((option) => !query ||
    `${option.value} ${option.label}`.toLocaleLowerCase('pt-BR').includes(query))
    .sort((left, right) => Number(right.value.toLocaleLowerCase('pt-BR') === query) -
      Number(left.value.toLocaleLowerCase('pt-BR') === query)).slice(0, 8);
  const updatePosition = useCallback(() => {
    const bounds = input.current?.getBoundingClientRect();
    if (!bounds) return;
    const width = Math.min(window.innerWidth - 16, Math.max(180, bounds.width));
    const left = Math.max(8, Math.min(bounds.left, window.innerWidth - width - 8));
    const top = window.innerHeight - bounds.bottom >= 200 ? bounds.bottom + 3 : Math.max(8, bounds.top - 223);
    setPosition({ top, left, width });
  }, []);
  useEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);
  const commit = (next: string) => {
    committed.current = true;
    setDraft(next);
    onChange(next);
    setOpen(false);
  };
  return <>
    <input ref={input} type="text" value={draft} disabled={disabled} aria-label={label}
      aria-autocomplete="list" aria-expanded={open && matches.length > 0}
      aria-controls={open && matches.length > 0 ? id : undefined}
      maxLength={maxLength} placeholder={placeholder}
      onFocus={() => { updatePosition(); setOpen(true); }}
      onChange={(event) => { committed.current = false; setDraft(event.target.value); updatePosition(); setOpen(true); }}
      onBlur={() => { setOpen(false); if (!committed.current) setDraft(value); committed.current = false; }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') { setDraft(value); setOpen(false); }
        if ((event.key === 'Enter' || event.key === 'Tab') && draft !== value) {
          if (event.key === 'Enter') event.preventDefault();
          commit(query && matches.length > 0 ? matches[0].value : draft.trim());
        }
      }} />
    {draft !== value && <ReferenceHint>Enter ou Tab para confirmar</ReferenceHint>}
    {open && matches.length > 0 && createPortal(<ReferenceSuggestions id={id} role="listbox"
      aria-label={`Sugestões para ${label}`} $top={position.top} $left={position.left} $width={position.width}>
      {matches.map((option) => <ReferenceSuggestion key={option.value} type="button" role="option"
        aria-selected={option.value === draft}
        onPointerDown={(event) => event.preventDefault()} onClick={() => commit(option.value)}
      >
        <strong>{option.value}</strong>{option.label !== option.value && ` · ${option.label}`}
      </ReferenceSuggestion>)}
    </ReferenceSuggestions>, document.body)}
  </>;
}
