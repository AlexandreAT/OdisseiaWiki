import type { GameRunDto } from '../../../../models/GameRun';
import { CyberButton } from '../../../../components/Generic/HighlightButton/HighlightButton';
import { InputText } from '../../../../components/Generic/InputText/InputText';
import { LoadingIndicator } from '../../../../components/Generic/LoadingIndicator';
import { GameNotice } from '../../GameShared.style';
import { RunInventoryCard } from '../RunInventoryCard';
import { RunInventoryActionDialog } from '../RunInventoryActionDialog';
import { RunEconomyItemDetails } from './RunEconomyItemDetails';
import { canAccessRunStash, createRunSaleLines, runSaleUnitPrice, type RunSaleLine } from '../runEconomy';
import type { useRunEconomyDialog } from './useRunEconomyDialog';
import { runInventoryKey } from '../runInventoryEntries';
import { EconomyActions, EconomyCard, EconomyCards, EconomyDetails, EconomyTabs } from './RunEconomyDialog.style';

/** Shared by merchants and engineers: same quantities, prices, details and sale command. */
export function RunSalePanel({ run, state, theme, neon, busy, error, onSell }: {
  run: GameRunDto; state: ReturnType<typeof useRunEconomyDialog>; theme: 'dark' | 'light'; neon: 'on' | 'off';
  busy: boolean; error: string | null; onSell: (items: RunSaleLine[], fromStash: boolean) => Promise<boolean>;
}) {
  const discount = run.configuracaoModo.saleDiscountPercent ?? 0;
  const selected = state.selected;
  const unitPrice = runSaleUnitPrice(selected?.value, discount);
  const lines = selected ? createRunSaleLines(selected, state.saleFromStash ? state.stash : state.inventory, Number(state.saleQuantity)) : [];
  return <>
    <EconomyTabs $neon={neon === 'on'} aria-label="Origem dos itens à venda">
      <button type="button" aria-pressed={!state.saleFromStash} disabled={busy} onClick={() => { state.setSelected(null); state.setSaleFromStash(false); }}>Mochila</button>
      <button type="button" aria-pressed={state.saleFromStash} disabled={busy || !canAccessRunStash(run)}
        title={!canAccessRunStash(run) ? 'Disponível somente na Base ou no Mercador.' : undefined}
        onClick={() => { if (canAccessRunStash(run)) { state.setSelected(null); state.setSaleFromStash(true); } }}>Depósito</button>
    </EconomyTabs>
    <small className="economy-sale-hint">Preço já inclui {discount}% de desconto de venda. Itens sem valor rendem 0 moedas.</small>
    {state.bulkSale.count > 0 && <GameNotice role="status">
      {state.bulkSale.count} {state.bulkSale.count === 1 ? 'item selecionado' : 'itens selecionados'} · {state.bulkSale.units} {state.bulkSale.units === 1 ? 'unidade' : 'unidades'} · você recebe {state.bulkSale.total.toLocaleString('pt-BR')} moedas.
      {' '}A seleção vende a pilha inteira, inclusive itens equipados. Para vender menos unidades, abra o item.
      {!state.bulkSale.valid && <span role="alert"> Selecione um lote menor: até 100 instâncias e 1.000.000 de unidades por pilha, sem ultrapassar o limite de moedas.</span>}
    </GameNotice>}
    <EconomyCards role="tabpanel" aria-label="Itens à venda">
      {state.saleEntries.length === 0 && <GameNotice>Nenhum item para vender nesta origem.</GameNotice>}
      {state.saleEntries.map(entry => <EconomyCard key={`${entry.tipo}:${entry.idInstancia}`}>
        <RunInventoryCard entry={entry} selected={state.saleSelection.has(runInventoryKey(entry))}
          selection={{ checked: state.saleSelection.has(runInventoryKey(entry)), disabled: busy,
            label: `Selecionar ${entry.name} para venda (${entry.quantity} unidades)`, onChange: checked => state.toggleSale(entry, checked) }}
          equipped={entry.defenseEquipped || run.acoesEquipadas?.some(action => action.tipo === entry.tipo && action.idInstancia === entry.idInstancia)}
          neon={neon === 'on'} onSelect={() => state.selectSale(entry)} />
        <small>{entry.quantity} un. · {entry.weight?.toLocaleString('pt-BR') ?? '—'} kg</small>
        <small>{runSaleUnitPrice(entry.value, discount).toLocaleString('pt-BR')} moedas por unidade</small>
      </EconomyCard>)}
    </EconomyCards>
    {selected && <RunInventoryActionDialog entry={selected} neon={neon === 'on'} onClose={() => { if (!busy) state.setSelected(null); }}>
      {error && <GameNotice $danger role="alert">{error}</GameNotice>}
      {busy && <LoadingIndicator compact label="Vendendo" />}
      <EconomyDetails><RunEconomyItemDetails entry={selected} /></EconomyDetails>
      {selected.quantity > 1 && <InputText label="Quantidade para vender" type="number" theme={theme} neon={neon}
        value={state.saleQuantity} min={1} max={Math.min(1_000_000, selected.quantity)} disabled={busy}
        onChange={event => state.setSaleQuantity(event.target.value)} />}
      <EconomyDetails aria-live="polite">
        <p>{unitPrice.toLocaleString('pt-BR')} moedas por unidade · {selected.quantity} disponíveis</p>
        <p>Você recebe <strong>{(lines.length ? unitPrice * Number(state.saleQuantity) : 0).toLocaleString('pt-BR')} moedas</strong></p>
        {!lines.length && <p role="alert">{Number.isInteger(Number(state.saleQuantity)) && Number(state.saleQuantity) >= 1 && Number(state.saleQuantity) <= Math.min(1_000_000, selected.quantity)
          ? 'Venda um lote menor por vez.' : `Escolha de 1 a ${Math.min(1_000_000, selected.quantity)} unidades.`}</p>}
        {unitPrice === 0 && <p>Este item será removido sem receber moedas.</p>}
        {selected.defenseEquipped || run.acoesEquipadas?.some(action => action.idInstancia === selected.idInstancia)
          ? <p>Ao vender todas as unidades, este item sai dos equipamentos e ações.</p> : null}
      </EconomyDetails>
      <EconomyActions>
        <CyberButton theme={theme} neon={neon} colorType="secondary" text="Cancelar" width="100%" disabled={busy} onClick={() => state.setSelected(null)} />
        <CyberButton theme={theme} neon={neon} text="Vender" width="100%" loading={busy} disabled={busy || !lines.length || run.status !== 'Ativa'}
          onClick={() => void onSell(lines, state.saleFromStash).then(done => { if (done) state.setSelected(null); })} />
      </EconomyActions>
    </RunInventoryActionDialog>}
  </>;
}
