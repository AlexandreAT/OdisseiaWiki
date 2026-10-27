import type { RunInventoryEntry } from './runInventoryEntries';
import { LoadoutDefenseNote, LoadoutDefensePanel, LoadoutDefenseStats } from './RunLoadout.style';

/** Shared by inventory and purchase details, including passive prostheses and penalties. */
export function RunProsthesisBonuses({ entry }: { entry: RunInventoryEntry }) {
  const bonuses = Object.entries(entry.passiveBonuses ?? {}).filter(([, value]) => Number.isFinite(value) && value !== 0);
  if (entry.tipo !== 'PROTESE' || bonuses.length === 0) return null;
  return <LoadoutDefensePanel aria-label="Bônus da prótese">
    <strong>Bônus enquanto instalada</strong>
    <LoadoutDefenseStats>{bonuses.map(([code, value]) =>
      <span key={code}>{code}<b>{value > 0 ? '+' : ''}{value}</b></span>)}</LoadoutDefenseStats>
    <LoadoutDefenseNote>Os ajustes alteram limites e atributos, sem recuperar recursos. Retirar a prótese remove esses ajustes.</LoadoutDefenseNote>
  </LoadoutDefensePanel>;
}
