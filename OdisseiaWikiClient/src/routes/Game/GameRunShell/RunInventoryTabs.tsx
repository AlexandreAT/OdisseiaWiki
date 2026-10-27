import type { CSSProperties } from 'react';
import { inventoryThemeColor } from '../../../utils/inventoryTheme';
import { LoadoutTabs } from './RunLoadout.style';
import { runInventoryTabs, type RunInventoryKind } from './runInventoryEntries';

export function RunInventoryTabs({ value, neon, onChange }: {
  value: RunInventoryKind; neon: boolean; onChange: (value: RunInventoryKind) => void;
}) {
  return <LoadoutTabs role="tablist" aria-label="Tipo de inventário">
    {runInventoryTabs.map(({ type, label }) => <button key={type} type="button" role="tab"
      aria-selected={value === type} style={{ '--inventory-tab-accent': inventoryThemeColor(type, neon),
        '--inventory-tab-glow': neon ? inventoryThemeColor(type, neon) : 'transparent' } as CSSProperties}
      onClick={() => onChange(type)}>{label}</button>)}
  </LoadoutTabs>;
}
