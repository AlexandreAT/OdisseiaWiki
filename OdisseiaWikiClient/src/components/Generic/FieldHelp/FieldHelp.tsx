import { memo, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BiInfoCircle } from 'react-icons/bi';
import { useFieldHelpContext } from './FieldHelpContext';
import { HelpAnchor, HelpButton, HelpPopover, HelpPopoverScroll } from './FieldHelp.style';
import { FieldHelpBody } from './FieldHelpBody';
import type { FieldHelpProps } from './FieldHelp.types';
import { getFieldHelpPosition } from './fieldHelpPosition';
import { trackFieldHelpLabel } from './fieldHelpLabelLayout';

const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export const FieldHelp = memo(({ label, help, helpKey, theme, neon, inline, presentation, size }: FieldHelpProps) => {
  const context = useFieldHelpContext();
  const content = useMemo(() => help ?? context?.resolve(helpKey ?? label), [help, context, helpKey, label]);
  const hasContent = Boolean(content);
  const dark = (theme ?? context?.theme ?? 'dark') === 'dark';
  const glowing = (neon ?? context?.neon ?? 'off') === 'on';
  const appearance = { ...content?.presentation, ...presentation };
  const preferredWidth = appearance.density === 'compact' ? 360 : 390;
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 350, height: 400, below: true, arrowLeft: 320 });
  const button = useRef<HTMLSpanElement>(null);
  const anchor = useRef<HTMLSpanElement>(null);
  const popover = useRef<HTMLElement>(null);
  const id = useId();

  useBrowserLayoutEffect(() => {
    if (!hasContent || inline || !anchor.current?.parentElement) return;
    return trackFieldHelpLabel(anchor.current.parentElement);
  }, [hasContent, inline]);

  const place = useCallback(() => {
    if (!button.current) return;
    const rect = button.current.getBoundingClientRect();
    setPosition(getFieldHelpPosition(rect, { width: window.innerWidth, height: window.innerHeight },
      popover.current?.scrollHeight, preferredWidth));
  }, [preferredWidth]);

  useBrowserLayoutEffect(() => { if (mounted) place(); }, [mounted, content, place, position.width, appearance.density, appearance.listStyle]);
  useEffect(() => {
    if (open) { setMounted(true); return; }
    if (!mounted) return;
    const timeout = window.setTimeout(() => setMounted(false), 130);
    return () => window.clearTimeout(timeout);
  }, [open, mounted]);
  useEffect(() => {
    if (!mounted) return;
    const outside = (event: PointerEvent) => {
      if (!button.current?.contains(event.target as Node) && !popover.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !open) return;
      event.stopPropagation();
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape, true);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape, true);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [mounted, open, place]);

  if (!content) return null;
  return <HelpAnchor ref={anchor} $inline={inline} data-field-help={content.id}>
    <HelpButton ref={button} role="button" tabIndex={0} $dark={dark} $neon={glowing} $inline={inline} $small={size === 'small'}
      aria-label={`Ajuda: ${label}`} aria-expanded={open} aria-haspopup="dialog" aria-controls={mounted ? id : undefined}
      onClick={(event) => { event.preventDefault(); event.stopPropagation(); setOpen((value) => !value); }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault(); event.stopPropagation(); setOpen((value) => !value);
      }}>
      <BiInfoCircle aria-hidden="true" />
    </HelpButton>
    {mounted && createPortal(<HelpPopover ref={popover} id={id} role="dialog" aria-label={content.title}
      $dark={dark} $neon={glowing} $top={position.top} $left={position.left}
      $width={position.width} $height={position.height} $open={open}
      $below={position.below} $arrowLeft={position.arrowLeft} $compact={appearance.density === 'compact'}>
      <HelpPopoverScroll $height={position.height}>
        <FieldHelpBody content={content} accent={appearance.accent} listStyle={appearance.listStyle} />
      </HelpPopoverScroll>
    </HelpPopover>, document.body)}
  </HelpAnchor>;
});
