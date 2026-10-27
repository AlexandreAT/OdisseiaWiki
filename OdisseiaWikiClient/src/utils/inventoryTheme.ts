import type { CSSProperties } from 'react';

/** Shared by the character's exploded inventory and the run inventory. */
export const INVENTORY_CATEGORY_THEME = {
  items: { color: 'var(--neonBlue)', clearColor: 'var(--clearneonBlue)' },
  prostheses: { color: 'var(--neonPurple)', clearColor: 'var(--clearneonPurple)' },
  skills: { color: 'var(--neonCyan)', clearColor: 'color-mix(in srgb, var(--neonCyan) 45%, white)' },
  spells: { color: 'var(--neonLilac)', clearColor: 'var(--clearneonLilac)' },
} as const;

const categoryByKind = { ITEM: 'items', PROTESE: 'prostheses', SKILL: 'skills', MAGIA: 'spells' } as const;

export function inventoryThemeColor(kind: keyof typeof categoryByKind, neon: boolean): string {
  const palette = INVENTORY_CATEGORY_THEME[categoryByKind[kind]];
  return neon ? palette.clearColor : palette.color;
}

export function inventoryThemeStyle(kind: keyof typeof categoryByKind, neon: boolean): CSSProperties {
  const palette = INVENTORY_CATEGORY_THEME[categoryByKind[kind]];
  return {
    '--inventory-color': palette.color,
    '--inventory-clear': palette.clearColor,
    '--inventory-accent': inventoryThemeColor(kind, neon),
    '--inventory-glow': neon ? palette.clearColor : 'transparent',
    '--inventory-card-tint': 'color-mix(in srgb, var(--inventory-accent) 16%, rgba(1, 10, 22, .96))',
    '--inventory-equipped-tint': 'color-mix(in srgb, var(--inventory-accent) 22%, rgba(1, 16, 30, .98))',
    '--inventory-selected-tint': 'color-mix(in srgb, var(--inventory-accent) 26%, rgba(1, 16, 29, .98))',
    '--control-primary-neon': palette.color,
    '--control-primary-clear': palette.clearColor,
  } as CSSProperties;
}
