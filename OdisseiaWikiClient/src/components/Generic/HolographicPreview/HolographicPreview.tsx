import { createContext, forwardRef, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import CloseIcon from '@mui/icons-material/Close';
import { useMotionReduced } from '../../../hooks/useMotionPreference';
import { hologramGeometry } from './hologramGeometry';
import { Projection, ProjectionContent, ProjectionDescription, ProjectionImage, ProjectionPanel } from './HolographicPreview.style';
import type { HolographicPreviewAppearance, HolographicPreviewMedia, HolographicPreviewProps, HolographicPreviewProviderProps, HolographicPreviewTriggerProps } from './HolographicPreview.types';

interface Preview { media: HolographicPreviewMedia; anchor: HTMLButtonElement; pinned: boolean; appearance?: HolographicPreviewAppearance; }
interface Controls {
  id: string; preview: Preview | null;
  show: (anchor: HTMLButtonElement, media: HolographicPreviewMedia, pinned?: boolean, appearance?: HolographicPreviewAppearance) => void;
  hideSoon: () => void;
}
const PreviewContext = createContext<Controls | null>(null);

/** One projection per surface, including images in scrollable lists and nested dialogs. */
export function HolographicPreviewProvider({ children, neon = false, color, size = 360, background, textColor,
  imageFit = 'contain', hoverCloseDelay = 350, onOpenChange }: HolographicPreviewProviderProps) {
  const id = useId();
  const reduced = useMotionReduced();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [geometry, setGeometry] = useState<ReturnType<typeof hologramGeometry> | null>(null);
  const [closing, setClosing] = useState(false);
  const current = useRef(preview); current.current = closing ? null : preview;
  const notice = useRef(onOpenChange); notice.current = onOpenChange;
  const notifiedOpen = useRef(false);
  const announce = useCallback((open: boolean) => {
    if (notifiedOpen.current === open) return;
    notifiedOpen.current = open; notice.current?.(open);
  }, []);
  const closeRef = useRef<HTMLButtonElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const appearance = {
    neon: preview?.appearance?.neon ?? neon, color: preview?.appearance?.color ?? color,
    size: preview?.appearance?.size ?? size, background: preview?.appearance?.background ?? background,
    textColor: preview?.appearance?.textColor ?? textColor, imageFit: preview?.appearance?.imageFit ?? imageFit,
  };
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const exitTimer = useRef<ReturnType<typeof setTimeout>>();
  const suppressFocus = useRef(false);
  const cancelHide = useCallback(() => { clearTimeout(timer.current); }, []);
  const close = useCallback(() => {
    const previous = current.current;
    if (!previous) return;
    cancelHide();
    current.current = null;
    clearTimeout(exitTimer.current);
    const finish = () => { setPreview(null); setGeometry(null); setClosing(false); };
    if (reduced) finish();
    else { setClosing(true); exitTimer.current = setTimeout(finish, 140); }
    announce(false);
    if (previous.anchor.isConnected && (previous.pinned || document.activeElement?.closest?.('[data-holographic-preview]'))) {
      suppressFocus.current = true;
      previous.anchor.focus({ preventScroll: true });
      queueMicrotask(() => { suppressFocus.current = false; });
    }
  }, [cancelHide, announce, reduced]);
  const show = useCallback((anchor: HTMLButtonElement, media: HolographicPreviewMedia, pinned = false, override?: HolographicPreviewAppearance) => {
    if (suppressFocus.current) return;
    cancelHide();
    if (current.current?.pinned && !pinned) return;
    clearTimeout(exitTimer.current); setClosing(false);
    if (pinned && current.current?.anchor === anchor && current.current.pinned) { close(); return; }
    setGeometry(hologramGeometry(anchor.getBoundingClientRect(), window.innerWidth, window.innerHeight, override?.size ?? size));
    setPreview({ media, anchor, pinned, appearance: override });
    announce(true);
  }, [cancelHide, close, announce, size]);
  const hideSoon = useCallback(() => {
    cancelHide();
    timer.current = setTimeout(() => { if (!current.current?.pinned) close(); },
      Number.isFinite(hoverCloseDelay) && hoverCloseDelay >= 0 ? hoverCloseDelay : 350);
  }, [cancelHide, close, hoverCloseDelay]);
  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(exitTimer.current); announce(false); }, [announce]);
  useEffect(() => {
    if (!preview || closing) return;
    let frame: number | undefined;
    const measure = () => {
      frame = undefined;
      if (!preview.anchor.isConnected) { close(); return; }
      setGeometry(hologramGeometry(preview.anchor.getBoundingClientRect(), window.innerWidth, window.innerHeight, appearance.size));
    };
    const schedule = () => { if (frame === undefined) frame = requestAnimationFrame(measure); };
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
      if (event.key === 'Tab' && preview.pinned) {
        event.preventDefault();
        const targets = [closeRef.current, contentRef.current, descriptionRef.current].filter((node): node is HTMLButtonElement | HTMLParagraphElement | HTMLDivElement => !!node);
        const index = targets.findIndex(node => node === document.activeElement);
        const next = index < 0 ? event.shiftKey ? targets.length - 1 : 0
          : (index + (event.shiftKey ? targets.length - 1 : 1)) % targets.length;
        targets[next]?.focus();
      }
    };
    window.addEventListener('scroll', schedule, true); window.addEventListener('resize', schedule);
    window.addEventListener('keydown', keydown, true);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    observer?.observe(preview.anchor);
    measure();
    if (preview.pinned) closeRef.current?.focus();
    return () => {
      window.removeEventListener('scroll', schedule, true); window.removeEventListener('resize', schedule);
      window.removeEventListener('keydown', keydown, true); observer?.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [preview, closing, close, appearance.size]);
  const controls = useMemo(() => ({ id, preview: closing ? null : preview, show, hideSoon }), [id, preview, closing, show, hideSoon]);
  return <PreviewContext.Provider value={controls}>{children}
    {preview && geometry && typeof document !== 'undefined' && createPortal(
      <Projection $pinned={preview.pinned} $reduced={reduced} $neon={appearance.neon} $closing={closing} data-holographic-preview
        style={appearance.color ? {
          '--hologram-accent': appearance.color,
          '--hologram-scan-lines': `color-mix(in srgb, ${appearance.color} 3.5%, transparent)`,
          '--hologram-scan': `color-mix(in srgb, ${appearance.color} 13%, transparent)`,
          '--hologram-image-glow': `color-mix(in srgb, ${appearance.color} 9%, transparent)`,
        } as CSSProperties : undefined}
        onPointerDown={event => { if (event.target === event.currentTarget) close(); }}>
        <svg viewBox={`0 0 ${geometry.width} ${geometry.height}`} aria-hidden="true">
          <circle className="projection-origin" cx={geometry.x} cy={geometry.y} r="3" />
          <path className="projection-line" d={geometry.connector} pathLength="1" />
          <path className="projection-line projection-frame" d={geometry.frame} pathLength="1" />
        </svg>
        <ProjectionPanel neon={appearance.neon} color={appearance.color} $reduced={reduced} $hasDescription={Boolean(preview.media.description)}
          id={id} role={preview.pinned ? 'dialog' : 'tooltip'}
          aria-modal={preview.pinned || undefined} aria-labelledby={`${id}-title`}
          aria-describedby={preview.media.description ? `${id}-description` : undefined}
          style={{ left: geometry.left, top: geometry.top, width: geometry.size, height: geometry.size,
            background: appearance.background, color: appearance.textColor }}
          onMouseEnter={cancelHide} onMouseLeave={hideSoon}>
          <header><h3 id={`${id}-title`}>{preview.media.name}</h3>
            <button ref={closeRef} type="button" tabIndex={preview.pinned ? 0 : -1} aria-label={preview.media.content != null ? 'Fechar informações' : 'Fechar imagem'} onClick={close}><CloseIcon /></button></header>
          {preview.media.content != null ? <ProjectionContent ref={contentRef} tabIndex={preview.pinned ? 0 : -1}
            role="region" aria-label={`Informações de ${preview.media.name}`}>{preview.media.content}</ProjectionContent>
            : <ProjectionImage src={preview.media.src} alt={preview.media.name} fallbackIcon={preview.media.icon}
              style={{ '--hologram-image-fit': appearance.imageFit } as CSSProperties} />}
          {preview.media.description && <ProjectionDescription ref={descriptionRef} id={`${id}-description`}
            tabIndex={preview.pinned ? 0 : -1}>{preview.media.description}</ProjectionDescription>}
        </ProjectionPanel>
      </Projection>, preview.anchor.closest?.('[role="dialog"]') ?? document.body)}
  </PreviewContext.Provider>;
}

export const HolographicPreviewTrigger = forwardRef<HTMLButtonElement, HolographicPreviewTriggerProps>(function HolographicPreviewTrigger({
  media, children, appearance, activation = 'hover-click', disabled, onMouseEnter, onMouseLeave, onFocus, onBlur, onClick, ...props
}, forwardedRef) {
  const controls = useContext(PreviewContext);
  const anchor = useRef<HTMLButtonElement | null>(null);
  const setAnchor = useCallback((node: HTMLButtonElement | null) => {
    anchor.current = node;
    if (typeof forwardedRef === 'function') forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  }, [forwardedRef]);
  const open = controls?.preview?.anchor === anchor.current;
  return <button type="button" aria-label={`Ampliar imagem de ${media.name}`} {...props} ref={setAnchor} disabled={disabled}
    aria-haspopup="dialog" aria-expanded={Boolean(open)} aria-controls={open ? controls?.id : undefined}
    onMouseEnter={event => { onMouseEnter?.(event); if (!event.defaultPrevented && !disabled && activation !== 'click') controls?.show(event.currentTarget, media, false, appearance); }}
    onMouseLeave={event => { onMouseLeave?.(event); if (!event.defaultPrevented) controls?.hideSoon(); }}
    onFocus={event => { onFocus?.(event); if (!event.defaultPrevented && !disabled && activation !== 'click') controls?.show(event.currentTarget, media, false, appearance); }}
    onBlur={event => { onBlur?.(event); if (!event.defaultPrevented) controls?.hideSoon(); }}
    onClick={event => { onClick?.(event); if (!event.defaultPrevented && !disabled) controls?.show(event.currentTarget, media, true, appearance); }}>{children}</button>;
});

export const HolographicPreview = forwardRef<HTMLButtonElement, HolographicPreviewProps>(function HolographicPreview({
  appearance, hoverCloseDelay, onOpenChange, ...triggerProps
}, ref) {
  return <HolographicPreviewProvider {...appearance} hoverCloseDelay={hoverCloseDelay} onOpenChange={onOpenChange}>
    <HolographicPreviewTrigger {...triggerProps} ref={ref} />
  </HolographicPreviewProvider>;
});
