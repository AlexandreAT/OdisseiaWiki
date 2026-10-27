import { useMemo, useState } from 'react';
import type { GameRunDto } from '../../../../models/GameRun';
import { parseRunInventoryEntries, parseRunStoredItems, runInventoryKey, stackRunConsumables, type RunInventoryEntry } from '../runInventoryEntries';
import { createRunBulkSale, RUN_DEPOSIT_ENABLED } from '../runEconomy';

export function useRunEconomyDialog(run: GameRunDto, vendor: boolean) {
  const [tab, setCurrentTab] = useState<'offers' | 'stash' | 'inventory' | 'sell' | 'protected'>(vendor ? 'offers' : 'stash');
  const [selected, setSelected] = useState<RunInventoryEntry | null>(null);
  const [saleQuantity, setSaleQuantity] = useState('1');
  const [protectionNotice, setProtectionNotice] = useState<string | null>(null);
  const [saleFromStash, setSaleOrigin] = useState(false);
  const [saleSelection, setSaleSelection] = useState<Set<string>>(new Set());
  const clearSaleSelection = () => setSaleSelection(new Set());
  const toggleSale = (entry: RunInventoryEntry, checked: boolean) => setSaleSelection(previous => {
    const next = new Set(previous), key = runInventoryKey(entry);
    if (checked) next.add(key); else next.delete(key);
    return next;
  });
  const setSaleFromStash = (value: boolean) => { if (!value || RUN_DEPOSIT_ENABLED) { clearSaleSelection(); setSaleOrigin(value); } };
  const setTab = (value: typeof tab) => {
    if (value === 'stash' && !RUN_DEPOSIT_ENABLED) return;
    setSelected(null); clearSaleSelection(); setCurrentTab(value);
  };
  const selectSale = (entry: RunInventoryEntry) => { setSaleQuantity('1'); setSelected(entry); };
  const node = run.mapa.nodes.find((entry) => entry.id === run.noAtualId);
  const inventory = useMemo(() => [
    ...parseRunInventoryEntries(run.estadoAtual.inventario, 'ITEM'),
    ...parseRunInventoryEntries(run.estadoAtual.implantes, 'PROTESE'),
  ], [run.estadoAtual.inventario, run.estadoAtual.implantes]);
  const stash = useMemo(() => parseRunStoredItems(run.estadoAtual.economy?.stash),
  [run.estadoAtual.economy?.stash]);
  const offers = (vendor ? node?.payload?.offers ?? [] : []).flatMap((offer) => {
    if (!offer.snapshot) return [];
    const entry = parseRunStoredItems([{ ...offer.snapshot, id: offer.itemId, quantidade: 1 }])[0];
    return entry ? [{ ...offer, entry }] : [];
  });
  const saleEntries = useMemo(() => stackRunConsumables(saleFromStash ? stash : inventory),
    [inventory, stash, saleFromStash]);
  const bulkEntries = saleEntries.filter(entry => saleSelection.has(runInventoryKey(entry)));
  const bulkSale = createRunBulkSale(bulkEntries, saleFromStash ? stash : inventory, run.configuracaoModo?.saleDiscountPercent ?? 0);
  return { node, tab, setTab, selected, setSelected, inventory, stash, offers,
    protectionNotice, setProtectionNotice,
    saleEntries, selectSale, saleQuantity, setSaleQuantity, saleFromStash, setSaleFromStash,
    saleSelection, toggleSale, clearSaleSelection, bulkSale };
}
