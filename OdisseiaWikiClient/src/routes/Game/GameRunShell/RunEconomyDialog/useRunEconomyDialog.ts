import { useMemo, useState } from 'react';
import type { GameRunDto } from '../../../../models/GameRun';
import { parseRunInventoryEntries, parseRunStoredItems, stackRunConsumables, type RunInventoryEntry } from '../runInventoryEntries';
import { RUN_DEPOSIT_ENABLED } from '../runEconomy';

export function useRunEconomyDialog(run: GameRunDto, vendor: boolean) {
  const [tab, setCurrentTab] = useState<'offers' | 'stash' | 'inventory' | 'sell'>(vendor ? 'offers' : 'stash');
  const [selected, setSelected] = useState<RunInventoryEntry | null>(null);
  const [saleQuantity, setSaleQuantity] = useState('1');
  const [saleFromStash, setSaleOrigin] = useState(false);
  const setSaleFromStash = (value: boolean) => { if (!value || RUN_DEPOSIT_ENABLED) setSaleOrigin(value); };
  const setTab = (value: typeof tab) => {
    if (value === 'stash' && !RUN_DEPOSIT_ENABLED) return;
    setSelected(null); setCurrentTab(value);
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
    const entry = parseRunInventoryEntries([{ ...offer.snapshot, id: offer.itemId, quantidade: 1 }],
      offer.snapshot.tipo === 'implante' ? 'PROTESE' : 'ITEM')[0];
    return entry ? [{ ...offer, entry }] : [];
  });
  const saleEntries = useMemo(() => stackRunConsumables(saleFromStash ? stash : inventory),
    [inventory, stash, saleFromStash]);
  return { node, tab, setTab, selected, setSelected, inventory, stash, offers,
    saleEntries, selectSale, saleQuantity, setSaleQuantity, saleFromStash, setSaleFromStash };
}
