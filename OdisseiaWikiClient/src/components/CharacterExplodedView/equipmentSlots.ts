export type EquipmentMode = 'items' | 'prostheses';

export interface EquipmentSlotDefinition {
  id: string;
  label: string;
  x: number;
  y: number;
  region: string;
  side?: 'left' | 'right' | 'center';
}

export const BODY_SLOTS: readonly EquipmentSlotDefinition[] = [
  { id: 'head-top', label: 'Topo da cabeça', x: 50, y: 6, region: 'head', side: 'center' },
  { id: 'head-left', label: 'Lado esquerdo da cabeça', x: 30, y: 14, region: 'head', side: 'left' },
  { id: 'head-right', label: 'Lado direito da cabeça', x: 70, y: 14, region: 'head', side: 'right' },
  { id: 'shoulder-left', label: 'Ombro esquerdo', x: 29, y: 27, region: 'shoulder', side: 'left' },
  { id: 'shoulder-right', label: 'Ombro direito', x: 71, y: 27, region: 'shoulder', side: 'right' },
  { id: 'forearm-left', label: 'Antebraço esquerdo', x: 29, y: 41, region: 'forearm', side: 'left' },
  { id: 'forearm-right', label: 'Antebraço direito', x: 71, y: 41, region: 'forearm', side: 'right' },
  { id: 'hand-left', label: 'Mão esquerda', x: 30, y: 54, region: 'hand', side: 'left' },
  { id: 'hand-right', label: 'Mão direita', x: 70, y: 54, region: 'hand', side: 'right' },
  { id: 'thigh-left', label: 'Coxa esquerda', x: 30, y: 66, region: 'thigh', side: 'left' },
  { id: 'thigh-right', label: 'Coxa direita', x: 70, y: 66, region: 'thigh', side: 'right' },
  { id: 'lower-leg-left', label: 'Perna inferior esquerda', x: 30, y: 78, region: 'lower-leg', side: 'left' },
  { id: 'lower-leg-right', label: 'Perna inferior direita', x: 70, y: 78, region: 'lower-leg', side: 'right' },
  { id: 'foot-left', label: 'Pé esquerdo', x: 30, y: 90, region: 'foot', side: 'left' },
  { id: 'foot-right', label: 'Pé direito', x: 70, y: 90, region: 'foot', side: 'right' },
  { id: 'torso-extra-1', label: 'Slot corporal adicional 1', x: 76, y: 35, region: 'torso', side: 'right' },
  { id: 'torso-extra-2', label: 'Slot corporal adicional 2', x: 76, y: 50, region: 'torso', side: 'right' },
  { id: 'torso-extra-3', label: 'Slot corporal adicional 3', x: 76, y: 65, region: 'torso', side: 'right' },
] as const;

export const getEquipmentSlotLabel = (slotId: string) => {
  const normalizedSlot = slotId.replace(/^implant-/, '');
  return BODY_SLOTS.find(({ id }) => id === normalizedSlot)?.label ?? 'Slot corporal';
};
