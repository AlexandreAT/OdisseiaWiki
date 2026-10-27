import type { GameRunDto, GameRunSaleLine } from '../../../models/GameRun';
import { runConsumableStackKey, type RunInventoryEntry } from './runInventoryEntries';

export type RunSaleLine = GameRunSaleLine;

export const RUN_DEPOSIT_ENABLED = true;
export const RUN_DEPOSIT_UNAVAILABLE = 'Depósito desabilitado fora da Base ou do Mercador.';

export const runSaleUnitPrice = (value: number | null | undefined, discountPercent = 0): number => {
  if (value == null || !Number.isFinite(value) || value < 0 || value > 1_000_000_000) return 0;
  const discount = Number.isFinite(discountPercent) ? Math.max(0, Math.min(100, Math.trunc(discountPercent))) : 0;
  // Match the server's decimal floor, without rounding a nearly whole coin upward.
  const [mantissa, exponent = '0'] = String(value).toLowerCase().split('e');
  const [whole, fraction = ''] = mantissa.split('.');
  const scale = fraction.length - Number(exponent);
  let numerator = BigInt(whole + fraction) * BigInt(100 - discount);
  let denominator = BigInt(100);
  if (scale >= 0) denominator *= BigInt(10) ** BigInt(scale);
  else numerator *= BigInt(10) ** BigInt(-scale);
  return Number(numerator / denominator);
};

/** Expand the visible stack into actual instance quantities; never send a client price. */
export function createRunSaleLines(entry: RunInventoryEntry, all: RunInventoryEntry[], quantity: number): RunSaleLine[] {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1_000_000) return [];
  const stackKey = runConsumableStackKey(entry);
  let remaining = quantity;
  const lines: RunSaleLine[] = [];
  const candidates = all.filter(item => stackKey === null
    ? item.idInstancia === entry.idInstancia && item.tipo === entry.tipo
    : runConsumableStackKey(item) === stackKey);
  // Keep the stack's representative (and any equipped action pointing to it) until the last unit.
  candidates.sort((a, b) => Number(a.idInstancia === entry.idInstancia) - Number(b.idInstancia === entry.idInstancia));
  for (const item of candidates) {
    const count = Math.min(item.quantity, remaining);
    if (count > 0) lines.push({ itemId: item.idInstancia, quantity: count });
    remaining -= count;
    if (remaining === 0) break;
  }
  return remaining === 0 && lines.length <= 100 ? lines : [];
}

/** A checked card sells its whole visible stack, atomically, within the command's limits. */
export function createRunBulkSale(entries: RunInventoryEntry[], all: RunInventoryEntry[], discountPercent: number) {
  const groups = entries.map(entry => createRunSaleLines(entry, all, entry.quantity));
  const lines = groups.flat();
  const complete = groups.every(group => group.length > 0);
  const unique = new Set(lines.map(line => line.itemId)).size === lines.length;
  const total = entries.reduce((sum, entry) => sum + runSaleUnitPrice(entry.value, discountPercent) * entry.quantity, 0);
  const units = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  const valid = entries.length > 0 && complete && unique && lines.length <= 100 && total <= 1_000_000_000;
  return { lines: valid ? lines : [], total, units, count: entries.length, valid };
}

export const canAccessRunStash = (run: GameRunDto): boolean => {
  if (!RUN_DEPOSIT_ENABLED) return false;
  if (run.status !== 'Ativa' && run.status !== 'Vitoria') return false;
  const current = run.noAtualId
    ? run.mapa.nodes.find((node) => node.id === run.noAtualId && node.state === 'SELECIONADO')
    : run.mapa.nodes.filter((node) => node.state === 'CONCLUIDO' && node.type !== 'INICIO')
      .sort((a, b) => b.layer - a.layer)[0];
  return current?.type === 'BASE' || current?.type === 'VENDEDOR' ||
    current?.type === 'NPC' && current.payload?.npcType === 'MERCADOR' && current.payload.npcServiceVisited === true;
};
