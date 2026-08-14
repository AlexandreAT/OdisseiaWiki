import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styled from 'styled-components';
import {
  InventoryCard,
  OrganizedGridRoot,
} from './CharacterExplodedView.style';

export interface OrganizedInventoryEntry {
  id: string;
  name: string;
  image?: string;
  equipped?: boolean;
  accent?: string;
}

export interface OrganizedInventoryGridProps<TEntry extends OrganizedInventoryEntry> {
  entries: TEntry[];
  onReorder: (entries: TEntry[]) => void;
  onEntryClick?: (entry: TEntry) => void;
  ariaLabel?: string;
  emptyMessage?: string;
}

interface SortableEntryProps<TEntry extends OrganizedInventoryEntry> {
  entry: TEntry;
  onEntryClick?: (entry: TEntry) => void;
}

const SortableCardContainer = styled.div<{ $dragging: boolean }>`
  min-width: 0;
  opacity: ${({ $dragging }) => ($dragging ? 0.28 : 1)};
  position: relative;
  z-index: ${({ $dragging }) => ($dragging ? 2 : 1)};

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
    background: rgba(0, 0, 0, 0.48);
    color: var(--exploded-accent);
    font: 700 22px 'Michroma', sans-serif;
    text-transform: uppercase;
  }
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

const EmptyGridCell = styled.div`
  min-width: 0;
  min-height: 0;
  border: 1px solid color-mix(in srgb, var(--exploded-accent) 24%, transparent);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--exploded-accent) 4%, transparent), transparent 55%),
    rgba(0, 4, 12, .38);
  box-shadow: inset 0 0 12px rgba(0, 0, 0, .28);
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

function SortableEntry<TEntry extends OrganizedInventoryEntry>({
  entry,
  onEntryClick,
}: SortableEntryProps<TEntry>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id });

  const { name, equipped } = entry;

  return (
    <SortableCardContainer
      ref={setNodeRef}
      $dragging={isDragging}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
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
    </SortableCardContainer>
  );
}

export function OrganizedInventoryGrid<TEntry extends OrganizedInventoryEntry>({
  entries,
  onReorder,
  onEntryClick,
  ariaLabel = 'Inventário organizado. Arraste os itens para alterar a ordem.',
  emptyMessage = 'Nenhum registro disponível nesta categoria.',
}: OrganizedInventoryGridProps<TEntry>) {
  const dndContextId = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [visibleSlots, setVisibleSlots] = useState(15);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const suppressClickUntilRef = useRef(0);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const entryIds = useMemo(() => entries.map(({ id }) => id), [entries]);
  const activeEntry = useMemo(
    () => entries.find(({ id }) => id === activeId),
    [activeId, entries],
  );
  const totalSlots = Math.max(visibleSlots, entries.length);
  const emptySlotCount = Math.max(0, totalSlots - entries.length);

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
    if (!over || active.id === over.id) return;

    const previousIndex = entries.findIndex(({ id }) => id === active.id);
    const nextIndex = entries.findIndex(({ id }) => id === over.id);
    if (previousIndex < 0 || nextIndex < 0) return;

    onReorder(arrayMove(entries, previousIndex, nextIndex));
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
        setActiveId(String(active.id));
      }}
      onDragCancel={() => {
        suppressClickUntilRef.current = performance.now() + 250;
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
      <SortableContext items={entryIds} strategy={rectSortingStrategy}>
        <OrganizedGridRoot ref={gridRef} role="list" aria-label={ariaLabel}>
          {entries.map((entry) => (
            <div role="listitem" key={entry.id}>
              <SortableEntry entry={entry} onEntryClick={handleEntryClick} />
            </div>
          ))}
          {Array.from({ length: emptySlotCount }, (_, index) => (
            <EmptyGridCell key={`empty-slot-${index}`} aria-hidden="true" />
          ))}
          {entries.length === 0 && <EmptyOrganizedGrid>{emptyMessage}</EmptyOrganizedGrid>}
        </OrganizedGridRoot>
      </SortableContext>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
        {activeEntry ? (
          <OrganizedCard
            type="button"
            tabIndex={-1}
            $equipped={activeEntry.equipped}
            $accent={activeEntry.accent}
            aria-hidden="true"
          >
            {renderEntryContent(activeEntry)}
          </OrganizedCard>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default OrganizedInventoryGrid;
