import { type CSSProperties, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import styled from 'styled-components';
import { InventoryCard, OrganizedGridRoot } from './CharacterExplodedView.style';

export interface OrganizedInventoryEntry {
  id: string;
  name: string;
  image?: string;
  equipped?: boolean;
  accent?: string;
  gridPosition?: number;
}

export interface OrganizedInventoryGridProps<TEntry extends OrganizedInventoryEntry> {
  entries: TEntry[];
  onPositionsChange: (entries: TEntry[]) => void;
  onEntryClick?: (entry: TEntry) => void;
  ariaLabel?: string;
  emptyMessage?: string;
}

interface GridPlacement<TEntry extends OrganizedInventoryEntry> {
  entry?: TEntry;
  index: number;
}

interface DraggableEntryProps<TEntry extends OrganizedInventoryEntry> {
  entry: TEntry;
  slotIndex: number;
  onEntryClick?: (entry: TEntry) => void;
}

const DraggableCardContainer = styled.div<{ $dragging: boolean }>`
  min-width: 0;
  min-height: 0;
  height: 100%;
  opacity: ${({ $dragging }) => ($dragging ? .18 : 1)};
  position: relative;
  z-index: ${({ $dragging }) => ($dragging ? 2 : 1)};
  transition: opacity 150ms ease;

  > button {
    width: 100%;
    height: 100%;
    position: relative;
  }
`;

const OrganizedCard = styled(InventoryCard)`
  width: 100%;
  height: 100%;
  min-height: 0;
  position: relative;

  .entry-placeholder {
    width: 100%;
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, .48);
    color: var(--exploded-accent);
    font: 700 22px 'Michroma', sans-serif;
    text-transform: uppercase;
  }
`;

const OrganizedGridSlot = styled.div<{ $isOver: boolean; $occupied: boolean }>`
  min-width: 0;
  min-height: 0;
  height: 104px;
  position: relative;
  border: 1px solid ${({ $isOver }) => $isOver
    ? 'color-mix(in srgb, var(--exploded-accent) 92%, white)'
    : 'color-mix(in srgb, var(--exploded-accent) 24%, transparent)'};
  background:
    linear-gradient(135deg, ${({ $isOver }) => $isOver
      ? 'color-mix(in srgb, var(--exploded-accent) 20%, transparent)'
      : 'color-mix(in srgb, var(--exploded-accent) 4%, transparent)'}, transparent 55%),
    rgba(0, 4, 12, .38);
  box-shadow: ${({ $isOver, $occupied }) => $isOver
    ? 'inset 0 0 18px color-mix(in srgb, var(--exploded-accent) 42%, transparent), 0 0 14px color-mix(in srgb, var(--exploded-accent) 22%, transparent)'
    : $occupied
      ? 'inset 0 0 12px rgba(0, 0, 0, .28)'
      : 'inset 0 0 8px rgba(0, 0, 0, .2)'};
  transform: ${({ $isOver }) => ($isOver ? 'scale(1.025)' : 'scale(1)')};
  transition: border-color 130ms ease, background 130ms ease, box-shadow 130ms ease, transform 130ms ease;
`;

const DragOverlayCard = styled(OrganizedCard)`
  pointer-events: none;
  cursor: grabbing;
  box-shadow: 0 14px 30px rgba(0, 0, 0, .55), 0 0 16px color-mix(in srgb, var(--exploded-accent) 42%, transparent);
  transform: rotate(1.5deg) scale(1.03);
`;

const EmptyOrganizedGrid = styled.div`
  position: absolute;
  inset: 50% auto auto 50%;
  z-index: 2;
  width: min(26rem, calc(100% - 3rem));
  display: grid;
  place-items: center;
  padding: 14px 18px;
  color: var(--grey);
  background: rgba(0, 5, 14, .78);
  border: 1px solid color-mix(in srgb, var(--exploded-accent) 36%, transparent);
  text-align: center;
  font: 11px 'Michroma', sans-serif;
  pointer-events: none;
  transform: translate(-50%, -50%);
`;

const renderEntryContent = (entry: OrganizedInventoryEntry) => {
  const { name, image } = entry;
  return (
    <>
      {image ? (
        <img src={image} alt="" draggable={false} />
      ) : (
        <div className="entry-placeholder" aria-hidden="true">
          {name.trim().charAt(0) || '?'}
        </div>
      )}
      <span>{name}</span>
    </>
  );
};

function DraggableEntry<TEntry extends OrganizedInventoryEntry>({
  entry,
  slotIndex,
  onEntryClick,
}: DraggableEntryProps<TEntry>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({
    id: entry.id,
    data: { slotIndex },
  });

  const { name, equipped } = entry;
  return (
    <DraggableCardContainer
      ref={setNodeRef}
      $dragging={isDragging}
    >
      <OrganizedCard
        type="button"
        $equipped={equipped}
        $accent={entry.accent}
        {...attributes}
        {...listeners}
        aria-label={`${name}. Arraste para reorganizar${equipped ? '. Item equipado' : ''}.`}
        aria-pressed={equipped || undefined}
        title={equipped ? `${name} (equipado)` : name}
        onClick={() => onEntryClick?.(entry)}
      >
        {renderEntryContent(entry)}
      </OrganizedCard>
    </DraggableCardContainer>
  );
}

function GridSlot<TEntry extends OrganizedInventoryEntry>({
  placement,
  onEntryClick,
}: {
  placement: GridPlacement<TEntry>;
  onEntryClick?: (entry: TEntry) => void;
}) {
  const { entry, index } = placement;
  const { setNodeRef, isOver } = useDroppable({
    id: `slot:${index}`,
    data: { slotIndex: index },
  });

  return (
    <OrganizedGridSlot
      ref={setNodeRef}
      $isOver={isOver}
      $occupied={Boolean(entry)}
      role="listitem"
      aria-label={entry ? `Posição ${index + 1}: ${entry.name}` : `Posição ${index + 1} vazia`}
    >
      {entry && (
        <DraggableEntry
          entry={entry}
          slotIndex={index}
          onEntryClick={onEntryClick}
        />
      )}
    </OrganizedGridSlot>
  );
}

const resolvePlacements = <TEntry extends OrganizedInventoryEntry>(
  entries: TEntry[],
  minimumSlots: number,
): GridPlacement<TEntry>[] => {
  const occupied = new Map<number, TEntry>();
  let nextAvailable = 0;

  entries.forEach((entry) => {
    const requestedPosition = Number.isInteger(entry.gridPosition) && (entry.gridPosition ?? -1) >= 0
      ? Number(entry.gridPosition)
      : nextAvailable;
    let position = requestedPosition;
    while (occupied.has(position)) position += 1;
    occupied.set(position, entry);
    nextAvailable = Math.max(nextAvailable, position + 1);
  });

  const totalSlots = Math.max(minimumSlots, entries.length, nextAvailable);
  return Array.from({ length: totalSlots }, (_, index) => ({
    index,
    entry: occupied.get(index),
  }));
};

export function OrganizedInventoryGrid<TEntry extends OrganizedInventoryEntry>({
  entries,
  onPositionsChange,
  onEntryClick,
  ariaLabel = 'Inventário organizado. Arraste os itens para alterar a posição na grade.',
  emptyMessage = 'Nenhum registro disponível nesta categoria.',
}: OrganizedInventoryGridProps<TEntry>) {
  const dndContextId = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [visibleSlots, setVisibleSlots] = useState(15);
  const [overlaySize, setOverlaySize] = useState<{ width: number; height: number } | undefined>();
  const [overlayTheme, setOverlayTheme] = useState<CSSProperties>();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const suppressClickUntilRef = useRef(0);
  const sensors = useSensors(
    // Waiting for a short hold keeps an ordinary vertical swipe available to
    // the sheet, but restores direct reorganization on touch devices.
    useSensor(MouseSensor, { activationConstraint: { distance: 7 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 260, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const placements = useMemo(() => resolvePlacements(entries, visibleSlots), [entries, visibleSlots]);
  const activeEntry = useMemo(
    () => entries.find(({ id }) => id === activeId),
    [activeId, entries],
  );

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return undefined;

    const updateVisibleSlots = () => {
      const styles = getComputedStyle(grid);
      const columnGap = Number.parseFloat(styles.columnGap) || 8;
      const rowGap = Number.parseFloat(styles.rowGap) || 8;
      const horizontalPadding = (Number.parseFloat(styles.paddingLeft) || 0)
        + (Number.parseFloat(styles.paddingRight) || 0);
      const verticalPadding = (Number.parseFloat(styles.paddingTop) || 0)
        + (Number.parseFloat(styles.paddingBottom) || 0);
      const availableWidth = Math.max(1, grid.clientWidth - horizontalPadding);
      const availableHeight = Math.max(1, grid.clientHeight - verticalPadding);
      const renderedColumns = styles.gridTemplateColumns.split(' ').filter(Boolean).length;
      const columns = Math.max(1, renderedColumns || Math.floor((availableWidth + columnGap) / (86 + columnGap)));
      const rows = Math.max(1, Math.floor((availableHeight + rowGap) / (104 + rowGap)));
      setVisibleSlots(columns * rows);
    };

    const observer = new ResizeObserver(updateVisibleSlots);
    observer.observe(grid);
    updateVisibleSlots();
    return () => observer.disconnect();
  }, []);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    suppressClickUntilRef.current = performance.now() + 250;
    setActiveId(null);
    setOverlaySize(undefined);
    setOverlayTheme(undefined);
    if (!over) return;

    const activeEntryIndex = entries.findIndex(({ id }) => id === active.id);
    const sourceSlot = Number(active.data.current?.slotIndex);
    const targetSlot = Number(over.data.current?.slotIndex);
    if (activeEntryIndex < 0 || !Number.isInteger(sourceSlot) || !Number.isInteger(targetSlot) || sourceSlot === targetSlot) return;

    const targetEntry = placements.find(({ index }) => index === targetSlot)?.entry;
    const currentPositions = new Map(
      placements.flatMap(({ entry, index }) => entry ? [[entry.id, index] as const] : []),
    );
    const nextEntries = entries.map((entry) => {
      if (entry.id === active.id) return { ...entry, gridPosition: targetSlot };
      if (targetEntry?.id === entry.id) return { ...entry, gridPosition: sourceSlot };
      // Persist the remaining legacy entries too, otherwise a new manual
      // position would make entries without metadata jump after reopening.
      return { ...entry, gridPosition: currentPositions.get(entry.id) ?? entry.gridPosition };
    });
    onPositionsChange(nextEntries);
  };

  const handleEntryClick = (entry: TEntry) => {
    if (performance.now() < suppressClickUntilRef.current) return;
    onEntryClick?.(entry);
  };

  return (
    <DndContext
      id={dndContextId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={({ active }) => {
        suppressClickUntilRef.current = Number.POSITIVE_INFINITY;
        const rect = active.rect.current.initial;
        const gridStyles = gridRef.current ? getComputedStyle(gridRef.current) : undefined;
        setOverlaySize(rect ? { width: rect.width, height: rect.height } : undefined);
        // The overlay is portalled to the document body, so explicitly carry
        // the theme variables that it would otherwise inherit from the view.
        setOverlayTheme({
          '--exploded-accent': gridStyles?.getPropertyValue('--exploded-accent').trim() || 'var(--clearneonBlue, #4deeea)',
          '--exploded-clear': gridStyles?.getPropertyValue('--exploded-clear').trim() || 'var(--clearneonBlue, #4deeea)',
        } as CSSProperties);
        setActiveId(String(active.id));
      }}
      onDragCancel={() => {
        suppressClickUntilRef.current = performance.now() + 250;
        setOverlaySize(undefined);
        setOverlayTheme(undefined);
        setActiveId(null);
      }}
      onDragEnd={handleDragEnd}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            'Pressione espaço para começar a reorganizar. Use as setas para mover o item e pressione espaço novamente para soltar.',
        },
      }}
    >
      <OrganizedGridRoot ref={gridRef} role="list" aria-label={ariaLabel}>
        {placements.map((placement) => (
          <GridSlot
            key={`slot-${placement.index}`}
            placement={placement}
            onEntryClick={handleEntryClick}
          />
        ))}
        {entries.length === 0 && <EmptyOrganizedGrid>{emptyMessage}</EmptyOrganizedGrid>}
      </OrganizedGridRoot>

      {createPortal(
        <DragOverlay
          dropAnimation={{ duration: 210, easing: 'cubic-bezier(.22, 1, .36, 1)' }}
          style={overlayTheme}
          zIndex={13001}
        >
          {activeEntry ? (
            <DragOverlayCard
              type="button"
              tabIndex={-1}
              $equipped={activeEntry.equipped}
              $accent={activeEntry.accent}
              aria-hidden="true"
              style={overlaySize}
            >
              {renderEntryContent(activeEntry)}
            </DragOverlayCard>
          ) : null}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  );
}

export default OrganizedInventoryGrid;
