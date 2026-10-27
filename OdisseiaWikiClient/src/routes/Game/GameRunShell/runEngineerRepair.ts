import type { RunInventoryEntry } from './runInventoryEntries';

export function runEngineerRepair(entry: RunInventoryEntry, pricePer10Percent?: number | null) {
  const maximum = entry.defense.protecao + entry.defense.escudo;
  const missing = Math.max(0, entry.defense.protecao - entry.defenseRemaining.protecao) + Math.max(0, entry.defense.escudo - entry.defenseRemaining.escudo);
  const eligible = (entry.tipo === 'PROTESE' || ['traje', 'outro'].includes(entry.subtype)) && missing > 0 && maximum > 0;
  const blocks = eligible ? Math.ceil(missing * 10 / maximum) : 0;
  const validPrice = pricePer10Percent != null && Number.isInteger(pricePer10Percent) && pricePer10Percent >= 0 && pricePer10Percent <= 1_000_000_000;
  return { eligible, percent: maximum ? missing / maximum * 100 : 0, blocks, cost: validPrice ? blocks * pricePer10Percent : null };
}
