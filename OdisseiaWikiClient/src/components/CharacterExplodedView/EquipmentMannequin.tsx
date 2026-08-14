import { useState, type CSSProperties } from 'react';
import { MdAdd } from 'react-icons/md';
import type { Item } from '../../models/Itens';
import { normalizeImagePath } from '../../routes/Wiki/utils/imagePathHelper';
import {
  EquipmentSlotButton,
  MannequinStage,
} from './CharacterExplodedView.style';
import { BODY_SLOTS, EquipmentMode, EquipmentSlotDefinition } from './equipmentSlots';

export interface EquipmentMannequinProps {
  mode: EquipmentMode;
  selectedSlot: string | null;
  equippedBySlot: ReadonlyMap<string, Item>;
  onSelectSlot: (slot: string) => void;
}

const prefixedSlotId = (id: string, mode: EquipmentMode) =>
  mode === 'prostheses' ? `implant-${id}` : id;

const positionStyle = (slot: EquipmentSlotDefinition): CSSProperties => ({
  left: `${slot.x}%`,
  top: `${slot.y}%`,
});

const lineTarget = ({ region, side, y }: EquipmentSlotDefinition) => {
  const left = side === 'left';
  if (region === 'head') return { x: left ? 45 : side === 'right' ? 55 : 50, y: 16 };
  if (region === 'shoulder') return { x: left ? 42 : 58, y: 29 };
  if (region === 'forearm') return { x: left ? 39 : 61, y: 43 };
  if (region === 'hand') return { x: left ? 37 : 63, y: 55 };
  if (region === 'thigh') return { x: left ? 45 : 55, y: 66 };
  if (region === 'lower-leg') return { x: left ? 46 : 54, y: 79 };
  if (region === 'foot') return { x: left ? 46 : 54, y: 90 };
  return { x: 61, y };
};

const MannequinSilhouette = () => (
  <svg className="mannequin-silhouette" viewBox="0 0 220 520" aria-hidden="true">
    <g fill="currentColor" fillOpacity=".035" stroke="currentColor" strokeWidth="2.3">
      <ellipse cx="110" cy="49" rx="30" ry="39" />
      <path d="M86 80c-5 17-15 23-36 30-20 7-29 23-31 47l-8 113c-1 14 7 27 19 32l18 7 7 169c1 20 13 32 29 30 13-2 22-13 22-29l4-147 4 147c0 16 9 27 22 29 16 2 28-10 29-30l7-169 18-7c12-5 20-18 19-32l-8-113c-2-24-11-40-31-47-21-7-31-13-36-30-14 8-34 8-48 0Z" />
      <path d="M50 112c15 24 24 54 22 91l-8 99M170 112c-15 24-24 54-22 91l8 99M73 214c10 14 24 21 37 21s27-7 37-21M79 301c10 6 20 9 31 9s21-3 31-9" fill="none" opacity=".62" />
      <path d="M110 310v168" fill="none" opacity=".62" />
    </g>
  </svg>
);

export const EquipmentMannequin = ({
  mode,
  selectedSlot,
  equippedBySlot,
  onSelectSlot,
}: EquipmentMannequinProps) => {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  const clearHoveredSlot = (slotId: string) => {
    setHoveredSlot((current) => current === slotId ? null : current);
  };

  return (
    <MannequinStage
      className="equipment-mannequin"
      data-mode={mode}
      role="group"
      aria-label={mode === 'prostheses' ? 'Encaixes de próteses' : 'Equipamentos do personagem'}
    >
      <MannequinSilhouette />

      <svg className="equipment-circuit-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {BODY_SLOTS.map((slot) => {
          const target = lineTarget(slot);
          return (
            <g key={slot.id}>
              <line
                className="equipment-line-hit"
                x1={slot.x}
                y1={slot.y}
                x2={target.x}
                y2={target.y}
                onPointerEnter={() => setHoveredSlot(slot.id)}
                onPointerLeave={() => clearHoveredSlot(slot.id)}
              />
              <line
                className="equipment-line"
                data-highlighted={hoveredSlot === slot.id}
                x1={slot.x}
                y1={slot.y}
                x2={target.x}
                y2={target.y}
              />
            </g>
          );
        })}
      </svg>

      {BODY_SLOTS.map((slot) => {
        const slotId = prefixedSlotId(slot.id, mode);
        const equippedItem = equippedBySlot.get(slotId);
        const selected = selectedSlot === slotId;
        const highlighted = hoveredSlot === slot.id;

        return (
          <EquipmentSlotButton
            key={slotId}
            type="button"
            className={`equipment-slot equipment-slot-${slot.region}`}
            style={positionStyle(slot)}
            $selected={selected}
            $filled={Boolean(equippedItem)}
            $highlighted={highlighted}
            data-slot={slotId}
            data-region={slot.region}
            data-side={slot.side}
            aria-label={`${slot.label}${equippedItem ? `: ${equippedItem.nome}` : ': vazio'}`}
            aria-pressed={selected}
            title={equippedItem ? `${slot.label} — ${equippedItem.nome}` : slot.label}
            onPointerEnter={() => setHoveredSlot(slot.id)}
            onPointerLeave={() => clearHoveredSlot(slot.id)}
            onClick={() => onSelectSlot(slotId)}
          >
            {equippedItem?.imagem ? (
              <img src={normalizeImagePath(equippedItem.imagem)} alt="" aria-hidden="true" />
            ) : (
              <MdAdd aria-hidden="true" />
            )}
          </EquipmentSlotButton>
        );
      })}
    </MannequinStage>
  );
};
