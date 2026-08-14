import {
  Bodies,
  Body,
  Composite,
  Engine,
  Runner,
  type IBodyDefinition,
} from 'matter-js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MdAdd, MdCenterFocusStrong, MdRemove } from 'react-icons/md';
import styled, { css, keyframes } from 'styled-components';
import { normalizeImagePath } from '../../routes/Wiki/utils/imagePathHelper';
import { getEntryKey, getExplodedMeta } from './characterExplodedView.utils';

export interface FreeInventoryPosition {
  /** Horizontal position of the card centre, as a percentage of the canvas. */
  x: number;
  /** Vertical position of the card centre, as a percentage of the canvas. */
  y: number;
  /** Card rotation in degrees. */
  rotation?: number;
}

export interface FreeInventoryEntry {
  id?: string;
  nome?: string;
  name?: string;
  imagem?: string;
  image?: string;
  eyebrow?: string;
  equipped?: boolean;
  position?: FreeInventoryPosition;
  accent?: string;
  tipo?: string;
  atributos?: Record<string, unknown>;
}

export interface FreeInventoryCanvasProps<TEntry extends FreeInventoryEntry> {
  entries: TEntry[];
  theme?: 'dark' | 'light';
  neon?: 'on' | 'off';
  emptyMessage?: string;
  className?: string;
  accent?: string;
  clearAccent?: string;
  onEntryClick?: (entry: TEntry) => void;
  onPositionChange?: (key: string, position: FreeInventoryPosition) => void;
  onPositionsChange?: (positions: Record<string, FreeInventoryPosition>) => void;
}

type CardNodeMap = Map<string, HTMLButtonElement>;

const DEFAULT_ACCENT = 'var(--clearneonBlue, #4deeea)';
const WALL_THICKNESS = 120;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

const fallbackPosition = (index: number): FreeInventoryPosition => ({
  x: 12 + ((index * 29) % 76),
  y: 15 + ((index * 37) % 70),
  rotation: ((index * 7) % 13) - 6,
});

const entryName = (entry: FreeInventoryEntry) => entry.name ?? entry.nome ?? 'Registro sem nome';
const entryImage = (entry: FreeInventoryEntry) => {
  const image = entry.image ?? entry.imagem;
  return image ? normalizeImagePath(image) : undefined;
};
const entryPosition = (entry: FreeInventoryEntry) => entry.position ?? getExplodedMeta(entry).position;
const entryEquipped = (entry: FreeInventoryEntry) => Boolean(
  entry.equipped || getExplodedMeta(entry).equippedSlot,
);
const entryKey = (entry: FreeInventoryEntry, index: number) => getEntryKey(
  { id: entry.id, nome: entry.name ?? entry.nome },
  index,
);

const toRadians = (degrees = 0) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

const equippedTrace = keyframes`
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: -100; }
`;

const Viewport = styled.section<{ $theme: 'dark' | 'light' }>`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: clamp(24rem, 52vh, 42rem);
  overflow: hidden;
  isolation: isolate;
  border: 1px solid color-mix(in srgb, var(--exploded-accent) 32%, transparent);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--exploded-accent) 4%, transparent), transparent 42%),
    ${({ $theme }) => ($theme === 'dark' ? 'rgba(1, 8, 18, 0.72)' : 'rgba(235, 245, 250, 0.78)')};
  touch-action: none;
  user-select: none;

  @media (max-width: 720px) {
    min-height: 31rem;
  }
`;

const World = styled.div<{ $rows: number }>`
  position: absolute;
  left: 0;
  top: 0;
  width: max(100%, 66rem);
  height: max(100%, ${({ $rows }) => Math.max(46, 8 + $rows * 9)}rem);
  transform-origin: 0 0;
  will-change: transform;
  background:
    linear-gradient(color-mix(in srgb, var(--exploded-accent) 5%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--exploded-accent) 5%, transparent) 1px, transparent 1px);
  background-size: 4rem 4rem;

  @media (max-width: 720px) {
    width: max(100%, 52rem);
    height: max(100%, ${({ $rows }) => Math.max(40, 7 + $rows * 8)}rem);
  }
`;

const MapControls = styled.div`
  position: absolute;
  z-index: 8;
  right: 10px;
  bottom: 10px;
  display: flex;
  gap: 5px;

  button {
    width: 34px;
    height: 34px;
    padding: 0;
    display: grid;
    place-items: center;
    color: var(--exploded-accent);
    border: 1px solid var(--exploded-accent);
    background: rgba(0, 5, 14, .9);
    cursor: pointer;
    transition: .18s ease;

    &:hover { box-shadow: 0 0 8px var(--exploded-clear); }
  }
`;

const Card = styled.button<{
  $accent: string;
  $equipped: boolean;
  $neon: 'on' | 'off';
  $theme: 'dark' | 'light';
}>`
  position: absolute;
  top: 0;
  left: 0;
  width: clamp(4.9rem, 6.2vw, 6.2rem);
  height: clamp(6.05rem, 7.7vw, 7.65rem);
  padding: 0;
  overflow: hidden;
  cursor: grab;
  border: 1px solid ${({ $accent }) => $accent};
  color: ${({ $accent }) => $accent};
  border-radius: 0.25rem;
  background: ${({ $theme }) => ($theme === 'dark' ? 'rgba(3, 9, 18, 0.94)' : 'rgba(239, 246, 250, 0.96)')};
  box-shadow: ${({ $neon, $accent }) => (
    $neon === 'on' ? `0 0 0.7rem color-mix(in srgb, ${$accent} 34%, transparent)` : 'none'
  )};
  transform-origin: center;
  will-change: transform;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;

  ${({ $equipped }) => $equipped && css`
    border-color: transparent;
  `}

  &:active {
    cursor: grabbing;
  }

  &:focus-visible {
    outline: 2px solid ${({ $accent }) => $accent};
    outline-offset: 3px;
  }

  @media (max-width: 720px) {
    width: 4.75rem;
    height: 6rem;
  }
`;

const EquippedTrace = styled.svg<{ $accent: string; $neon: 'on' | 'off' }>`
  position: absolute;
  inset: 0;
  z-index: 3;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;

  rect {
    fill: none;
    stroke: ${({ $accent }) => $accent};
    stroke-width: ${({ $neon }) => $neon === 'on' ? 1.8 : 1.2};
    stroke-linecap: round;
    stroke-dasharray: 28 22;
    vector-effect: non-scaling-stroke;
    animation: ${equippedTrace} 2.5s linear infinite;
    filter: ${({ $neon, $accent }) => $neon === 'on'
    ? `drop-shadow(0 0 3px ${$accent})`
    : 'none'};
  }

  @media (prefers-reduced-motion: reduce) {
    rect { animation: none; stroke-dasharray: none; }
  }
`;

const CardImage = styled.img`
  display: block;
  width: 100%;
  height: calc(100% - 2.15rem);
  object-fit: contain;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.32);
`;

const MissingImage = styled.span`
  display: grid;
  place-items: center;
  width: 100%;
  height: calc(100% - 2.15rem);
  font-family: 'Orbitron', sans-serif;
  font-size: 1.45rem;
  color: currentColor;
  background: rgba(0, 0, 0, 0.32);
  pointer-events: none;
`;

const CardCaption = styled.span`
  display: flex;
  min-width: 0;
  height: 2.15rem;
  padding: 0.28rem 0.38rem;
  flex-direction: column;
  justify-content: center;
  text-align: left;
  pointer-events: none;
`;

const CardName = styled.span`
  overflow: hidden;
  color: var(--whitesmoke, #f5f5f5);
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1.05;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const Eyebrow = styled.span<{ $accent: string }>`
  overflow: hidden;
  color: ${({ $accent }) => $accent};
  font-family: 'Orbitron', sans-serif;
  font-size: 0.5rem;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const EmptyState = styled.p`
  position: absolute;
  inset: 50% auto auto 50%;
  z-index: 4;
  width: min(30rem, calc(100% - 3rem));
  color: var(--lightGrey, #bdbdbd);
  font-size: 0.9rem;
  line-height: 1.45;
  text-align: center;
  pointer-events: none;
  transform: translate(-50%, -50%);
`;

/**
 * A DOM inventory surface whose card movement is driven by Matter.js. Matter
 * owns only the physical bodies; images, captions, focus and clicks remain
 * regular accessible React elements.
 */
export const FreeInventoryCanvas = <TEntry extends FreeInventoryEntry>({
  entries,
  theme = 'dark',
  neon = 'off',
  emptyMessage = 'Nenhum registro disponível nesta seção.',
  className,
  accent = 'var(--neonBlue)',
  clearAccent = 'var(--clearneonBlue)',
  onEntryClick,
  onPositionChange,
  onPositionsChange,
}: FreeInventoryCanvasProps<TEntry>) => {
  const viewportRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const cardNodesRef = useRef<CardNodeMap>(new Map());
  const bodiesByKeyRef = useRef(new Map<string, Body>());
  const schedulePersistRef = useRef<(key: string) => void>(() => undefined);
  const callbacksRef = useRef({ onEntryClick, onPositionChange, onPositionsChange });
  const suppressClickUntilRef = useRef(0);
  const draggedRef = useRef<{
    key: string;
    startX: number;
    startY: number;
    startBodyX: number;
    startBodyY: number;
    pointerId: number;
    moved: boolean;
  } | null>(null);
  const panRef = useRef<{ pointerId: number; startX: number; startY: number; viewX: number; viewY: number } | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
  const viewRef = useRef(view);

  callbacksRef.current = { onEntryClick, onPositionChange, onPositionsChange };
  viewRef.current = view;

  const clampView = useCallback((candidate: { x: number; y: number; zoom: number }) => {
    const viewport = viewportRef.current;
    const world = canvasRef.current;
    if (!viewport || !world) return candidate;
    const horizontalRemainder = viewport.clientWidth - world.clientWidth * candidate.zoom;
    const verticalRemainder = viewport.clientHeight - world.clientHeight * candidate.zoom;
    return {
      ...candidate,
      x: horizontalRemainder >= 0
        ? horizontalRemainder / 2
        : clamp(candidate.x, horizontalRemainder, 0),
      y: verticalRemainder >= 0
        ? verticalRemainder / 2
        : clamp(candidate.y, verticalRemainder, 0),
    };
  }, []);

  const changeZoom = useCallback((nextZoom: number, anchor?: { x: number; y: number }) => {
    setView((current) => {
      const viewport = viewportRef.current;
      const zoom = clamp(nextZoom, .45, 1.65);
      if (!viewport) return { ...current, zoom };
      const rect = viewport.getBoundingClientRect();
      const localX = (anchor?.x ?? rect.left + viewport.clientWidth / 2) - rect.left;
      const localY = (anchor?.y ?? rect.top + viewport.clientHeight / 2) - rect.top;
      const worldX = (localX - current.x) / current.zoom;
      const worldY = (localY - current.y) / current.zoom;
      return clampView({ zoom, x: localX - worldX * zoom, y: localY - worldY * zoom });
    });
  }, [clampView]);

  const centerMap = useCallback(() => {
    const viewport = viewportRef.current;
    const world = canvasRef.current;
    if (!viewport || !world) return;
    const zoom = Math.min(1, viewport.clientWidth / world.clientWidth, viewport.clientHeight / world.clientHeight);
    setView(clampView({
      zoom,
      x: Math.min(0, (viewport.clientWidth - world.clientWidth * zoom) / 2),
      y: Math.min(0, (viewport.clientHeight - world.clientHeight * zoom) / 2),
    }));
  }, [clampView]);

  const entrySignature = useMemo(
    () => entries.map((entry, index) => {
      return entryKey(entry, index);
    }).join('|'),
    [entries],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const viewport = viewportRef.current;
    if (!canvas || !viewport || entries.length === 0) return undefined;

    let disposed = false;
    let animationFrame = 0;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    const engine = Engine.create({
      gravity: { x: 0, y: 0, scale: 0 },
      enableSleeping: true,
    });
    const runner = Runner.create({
      delta: 1000 / 60,
    });
    const bodiesByKey = new Map<string, Body>();
    let walls: Body[] = [];

    const dimensions = () => ({
      width: Math.max(canvas.clientWidth, 1),
      height: Math.max(canvas.clientHeight, 1),
    });

    const replaceWalls = () => {
      const { width, height } = dimensions();
      if (walls.length) Composite.remove(engine.world, walls);

      const wallOptions = {
        isStatic: true,
        restitution: 0.05,
        friction: 0.9,
        label: 'inventory-boundary',
      } satisfies IBodyDefinition;
      walls = [
        Bodies.rectangle(width / 2, -WALL_THICKNESS / 2, width + WALL_THICKNESS * 2, WALL_THICKNESS, wallOptions),
        Bodies.rectangle(width / 2, height + WALL_THICKNESS / 2, width + WALL_THICKNESS * 2, WALL_THICKNESS, wallOptions),
        Bodies.rectangle(-WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height + WALL_THICKNESS * 2, wallOptions),
        Bodies.rectangle(width + WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height + WALL_THICKNESS * 2, wallOptions),
      ];
      Composite.add(engine.world, walls);

      bodiesByKey.forEach((body) => {
        const card = cardNodesRef.current.get(String(body.plugin.entryKey));
        const halfWidth = (card?.offsetWidth ?? 104) / 2;
        const halfHeight = (card?.offsetHeight ?? 132) / 2;
        Body.setPosition(body, {
          x: clamp(body.position.x, halfWidth, width - halfWidth),
          y: clamp(body.position.y, halfHeight, height - halfHeight),
        });
      });
    };

    const { width, height } = dimensions();
    entries.forEach((entry, index) => {
      const key = entryKey(entry, index);
      const node = cardNodesRef.current.get(key);
      const cardWidth = node?.offsetWidth ?? 104;
      const cardHeight = node?.offsetHeight ?? 132;
      const persisted = entryPosition(entry);
      const columns = Math.max(1, Math.floor((width - 48) / (cardWidth + 28)));
      const column = index % columns;
      const row = Math.floor(index / columns);
      const stagger = row % 2 === 0 ? 0 : Math.min(36, cardWidth * .35);
      const fallback = fallbackPosition(index);
      const x = persisted
        ? clamp((persisted.x / 100) * width, cardWidth / 2, width - cardWidth / 2)
        : clamp(34 + cardWidth / 2 + column * (cardWidth + 28) + stagger, cardWidth / 2, width - cardWidth / 2);
      const y = persisted
        ? clamp((persisted.y / 100) * height, cardHeight / 2, height - cardHeight / 2)
        : clamp(46 + cardHeight / 2 + row * (cardHeight + 30), cardHeight / 2, height - cardHeight / 2);
      const body = Bodies.rectangle(x, y, cardWidth, cardHeight, {
        angle: toRadians(persisted?.rotation ?? fallback.rotation),
        restitution: 0.08,
        friction: 0.72,
        frictionAir: 0.15,
        density: 0.008,
        sleepThreshold: 28,
        chamfer: { radius: 4 },
        label: `inventory-card:${key}`,
      });
      body.plugin.entryKey = key;
      bodiesByKey.set(key, body);
      Composite.add(engine.world, body);
    });
    bodiesByKeyRef.current = bodiesByKey;
    replaceWalls();

    const syncCards = () => {
      if (disposed) return;
      bodiesByKey.forEach((body, key) => {
        const node = cardNodesRef.current.get(key);
        if (!node) return;
        node.style.transform = `translate3d(${body.position.x - node.offsetWidth / 2}px, ${body.position.y - node.offsetHeight / 2}px, 0) rotate(${body.angle}rad)`;
      });
      animationFrame = requestAnimationFrame(syncCards);
    };

    const persistPositions = (key: string) => {
      if (disposed) return;
      const currentCanvas = canvasRef.current;
      if (!currentCanvas) return;
      const positions = Object.fromEntries([...bodiesByKey].map(([bodyKey, currentBody]) => [
        bodyKey,
        {
          x: Number(((currentBody.position.x / Math.max(currentCanvas.clientWidth, 1)) * 100).toFixed(2)),
          y: Number(((currentBody.position.y / Math.max(currentCanvas.clientHeight, 1)) * 100).toFixed(2)),
          rotation: Number(toDegrees(currentBody.angle).toFixed(2)),
        },
      ]));
      if (callbacksRef.current.onPositionsChange) {
        callbacksRef.current.onPositionsChange(positions);
      } else {
        callbacksRef.current.onPositionChange?.(key, positions[key]);
      }
    };

    schedulePersistRef.current = (key: string) => {
      // Persist the drop synchronously so closing the modal or switching modes
      // cannot discard the user's last movement. The trailing snapshot keeps
      // the final position produced by the collision solver as well.
      persistPositions(key);
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        persistPositions(key);
      // Give the collision solver enough frames to separate adjacent cards
      // before persisting the whole map.
      }, 260);
    };

    const cardNodes = cardNodesRef.current;
    const resizeObserver = new ResizeObserver(() => {
      replaceWalls();
      setView((current) => clampView(current));
    });
    resizeObserver.observe(canvas);
    resizeObserver.observe(viewport);
    Runner.run(runner, engine);
    animationFrame = requestAnimationFrame(syncCards);

    return () => {
      disposed = true;
      if (settleTimer) clearTimeout(settleTimer);
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      schedulePersistRef.current = () => undefined;
      bodiesByKeyRef.current = new Map();
      Runner.stop(runner);
      Composite.clear(engine.world, false, true);
      Engine.clear(engine);
      cardNodes.forEach((node) => {
        node.style.transform = '';
      });
    };
  // Persisted coordinates deliberately do not rebuild the physics world. A
  // rebuild is needed only when the set/order of cards itself changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampView, entrySignature, entries.length]);

  const finishActiveCardDrag = useCallback((pointerId?: number) => {
    const drag = draggedRef.current;
    if (!drag || (pointerId !== undefined && drag.pointerId !== pointerId)) return;

    const body = bodiesByKeyRef.current.get(drag.key);
    const card = cardNodesRef.current.get(drag.key);
    const moved = drag.moved;
    draggedRef.current = null;

    if (card?.hasPointerCapture(drag.pointerId)) {
      card.releasePointerCapture(drag.pointerId);
    }
    if (body) {
      Body.setVelocity(body, { x: 0, y: 0 });
      Body.setAngularVelocity(body, body.angularVelocity * 0.08);
    }
    if (moved) {
      suppressClickUntilRef.current = performance.now() + 250;
      schedulePersistRef.current(drag.key);
    }
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>, key: string) => {
    if (!event.isPrimary || event.button !== 0) return;
    const body = bodiesByKeyRef.current.get(key);
    if (!body) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    draggedRef.current = {
      key,
      startX: event.clientX,
      startY: event.clientY,
      startBodyX: body.position.x,
      startBodyY: body.position.y,
      pointerId: event.pointerId,
      moved: false,
    };
    Body.setVelocity(body, { x: 0, y: 0 });
    Body.setAngularVelocity(body, 0);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>, key: string) => {
    const drag = draggedRef.current;
    const body = bodiesByKeyRef.current.get(key);
    const canvas = canvasRef.current;
    if (!drag || drag.key !== key || drag.pointerId !== event.pointerId || !body || !canvas) return;
    if ((event.buttons & 1) === 0) {
      finishActiveCardDrag(event.pointerId);
      return;
    }

    const viewportBounds = viewportRef.current?.getBoundingClientRect();
    if (viewportBounds && (
      event.clientX < viewportBounds.left
      || event.clientX > viewportBounds.right
      || event.clientY < viewportBounds.top
      || event.clientY > viewportBounds.bottom
    )) {
      finishActiveCardDrag(event.pointerId);
      return;
    }

    const deltaX = (event.clientX - drag.startX) / viewRef.current.zoom;
    const deltaY = (event.clientY - drag.startY) / viewRef.current.zoom;
    if (!drag.moved && Math.hypot(deltaX, deltaY) > 6) drag.moved = true;
    if (!drag.moved) return;
    event.preventDefault();
    const halfWidth = event.currentTarget.offsetWidth / 2;
    const halfHeight = event.currentTarget.offsetHeight / 2;
    Body.setPosition(body, {
      x: clamp(drag.startBodyX + deltaX, halfWidth, canvas.clientWidth - halfWidth),
      y: clamp(drag.startBodyY + deltaY, halfHeight, canvas.clientHeight - halfHeight),
    });
    Body.setVelocity(body, { x: 0, y: 0 });
  };

  const finishPointerDrag = (event: React.PointerEvent<HTMLButtonElement>, key: string) => {
    const drag = draggedRef.current;
    if (!drag || drag.key !== key || drag.pointerId !== event.pointerId) return;
    finishActiveCardDrag(event.pointerId);
  };

  const handleCardClick = (_key: string, entry: TEntry) => {
    if (performance.now() < suppressClickUntilRef.current) return;
    callbacksRef.current.onEntryClick?.(entry);
  };

  const startPan = (event: React.PointerEvent<HTMLElement>) => {
    if (!event.isPrimary || event.button !== 0 || (event.target as HTMLElement).closest('button')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    panRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      viewX: viewRef.current.x,
      viewY: viewRef.current.y,
    };
  };

  const movePan = (event: React.PointerEvent<HTMLElement>) => {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;
    event.preventDefault();
    setView(clampView({
      ...viewRef.current,
      x: pan.viewX + event.clientX - pan.startX,
      y: pan.viewY + event.clientY - pan.startY,
    }));
  };

  const finishPan = (event: React.PointerEvent<HTMLElement>) => {
    if (panRef.current?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    panRef.current = null;
  };

  return (
    <Viewport
      ref={viewportRef}
      className={className}
      $theme={theme}
      style={{ '--exploded-accent': accent, '--exploded-clear': clearAccent } as React.CSSProperties}
      aria-label="Inventário em disposição livre"
      onPointerDown={startPan}
      onPointerMove={movePan}
      onPointerUp={finishPan}
      onPointerCancel={finishPan}
      onPointerLeave={(event) => {
        finishActiveCardDrag(event.pointerId);
        if (panRef.current?.pointerId === event.pointerId) finishPan(event);
      }}
      onWheel={(event) => {
        event.preventDefault();
        changeZoom(viewRef.current.zoom + (event.deltaY < 0 ? .12 : -.12), { x: event.clientX, y: event.clientY });
      }}
    >
      {entries.length === 0 && <EmptyState>{emptyMessage}</EmptyState>}

      <World
        ref={canvasRef}
        $rows={Math.max(1, Math.ceil(entries.length / 7))}
        style={{ transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.zoom})` }}
      >
      {entries.map((entry, index) => {
        const key = entryKey(entry, index);
        const name = entryName(entry);
        const image = entryImage(entry);
        const equipped = entryEquipped(entry);
        const baseEntryAccent = entry.accent || accent || DEFAULT_ACCENT;
        const entryAccent = equipped && neon === 'on'
          ? (clearAccent || baseEntryAccent)
          : baseEntryAccent;
        const initials = name.trim().slice(0, 2).toLocaleUpperCase('pt-BR') || '—';
        return (
          <Card
            key={key}
            ref={(node) => {
              if (node) cardNodesRef.current.set(key, node);
              else cardNodesRef.current.delete(key);
            }}
            type="button"
            $accent={entryAccent}
            $equipped={equipped}
            $neon={neon}
            $theme={theme}
            aria-label={`${name}${equipped ? ', equipado' : ''}`}
            title={name}
            onPointerDown={(event) => handlePointerDown(event, key)}
            onPointerMove={(event) => handlePointerMove(event, key)}
            onPointerUp={(event) => finishPointerDrag(event, key)}
            onPointerCancel={(event) => finishPointerDrag(event, key)}
            onClick={() => handleCardClick(key, entry)}
          >
            {equipped && (
              <EquippedTrace
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                $accent={entryAccent}
                $neon={neon}
                aria-hidden="true"
              >
                <rect x="1" y="1" width="98" height="98" rx="3" pathLength="100" />
              </EquippedTrace>
            )}
            {image ? (
              <CardImage src={image} alt="" draggable={false} />
            ) : (
              <MissingImage aria-hidden="true">{initials}</MissingImage>
            )}
            <CardCaption>
              {(entry.eyebrow || entry.tipo) && <Eyebrow $accent={entryAccent}>{entry.eyebrow || entry.tipo}</Eyebrow>}
              <CardName>{name}</CardName>
            </CardCaption>
          </Card>
        );
      })}
      </World>
      <MapControls aria-label="Controles do mapa do inventário">
        <button type="button" onClick={() => changeZoom(view.zoom + .12)} aria-label="Aumentar zoom"><MdAdd /></button>
        <button type="button" onClick={() => changeZoom(view.zoom - .12)} aria-label="Diminuir zoom"><MdRemove /></button>
        <button type="button" onClick={centerMap} aria-label="Centralizar inventário"><MdCenterFocusStrong /></button>
      </MapControls>
    </Viewport>
  );
};

export default FreeInventoryCanvas;
