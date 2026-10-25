import CloseIcon from '@mui/icons-material/Close';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import type { GameRunDto } from '../../../../models/GameRun';
import { CyberButton } from '../../../../components/Generic/HighlightButton/HighlightButton';
import { LoadingIndicator } from '../../../../components/Generic/LoadingIndicator';
import { InputText } from '../../../../components/Generic/InputText/InputText';
import { GameNotice, GameSectionTitle } from '../../GameShared.style';
import { RunTrainingDialog, RunTrainingPanel, RunHudTopline } from '../GameRunShell.style';
import { LoadoutEmpty } from '../RunLoadout.style';
import { RunInventoryCard } from '../RunInventoryCard';
import { RunInventoryActionDialog } from '../RunInventoryActionDialog';
import { normalizeImagePath } from '../../../Wiki/utils/imagePathHelper';
import { useRunEconomyDialog } from './useRunEconomyDialog';
import { canAccessRunStash, createRunSaleLines, runSaleUnitPrice, RUN_DEPOSIT_ENABLED, type RunSaleLine } from '../runEconomy';
import { EconomyActions, EconomyBalance, EconomyBody, EconomyCard, EconomyCards,
  EconomyDetails, EconomySectionTitle, EconomyTabs, EconomyTopline, MerchantIdentity, MerchantAvatar } from './RunEconomyDialog.style';

interface Props {
  run: GameRunDto; theme: 'dark' | 'light'; neon: 'on' | 'off'; vendor: boolean; busy: boolean;
  error: string | null;
  onBuy: (itemId: string, toStash: boolean) => Promise<boolean>;
  onTransfer: (itemId: string, toStash: boolean) => Promise<boolean>;
  onSell: (items: RunSaleLine[], fromStash: boolean) => Promise<boolean>;
  onClose: () => void;
}

export function RunEconomyDialog({ run, theme, neon, vendor, busy, error, onBuy, onTransfer, onSell, onClose }: Props) {
  const state = useRunEconomyDialog(run, vendor);
  const balance = run.estadoAtual.economy?.balance ?? 0;
  const selling = vendor && state.tab === 'sell';
  const entries = selling ? state.saleEntries : state.tab === 'stash' ? state.stash : state.inventory;
  const discount = run.configuracaoModo.saleDiscountPercent ?? 0;
  const saleUnitPrice = runSaleUnitPrice(state.selected?.value, discount);
  const saleLines = selling && state.selected ? createRunSaleLines(state.selected,
    state.saleFromStash ? state.stash : state.inventory, Number(state.saleQuantity)) : [];
  const selectEntry = selling ? state.selectSale : state.setSelected;
  const merchantImage = normalizeImagePath(state.node?.image ?? undefined);
  const selectedOffer = state.tab === 'offers'
    ? state.offers.find((offer) => offer.itemId === state.selected?.idInstancia) : undefined;
  return <RunTrainingDialog open onClose={busy ? undefined : onClose} aria-labelledby="economy-title" maxWidth="md" fullWidth>
    <RunTrainingPanel neon={neon === 'on'}>
      <RunHudTopline>
        {vendor ? <MerchantIdentity>
          <MerchantAvatar $neon={neon === 'on'}>{merchantImage ? <img src={merchantImage} alt="" /> : <StorefrontOutlinedIcon aria-hidden="true" />}</MerchantAvatar>
          <span><GameSectionTitle id="economy-title">{state.node?.name ?? 'Mercador'}</GameSectionTitle>
            {state.node?.areaName && <small>{state.node.areaName}</small>}</span>
        </MerchantIdentity> : <GameSectionTitle id="economy-title">Depósito</GameSectionTitle>}
        <button type="button" aria-label={vendor ? 'Sair do vendedor' : 'Fechar depósito'} disabled={busy}
          onClick={onClose}><CloseIcon /></button>
      </RunHudTopline>
      <EconomyBody>
        <EconomyTopline>
          <EconomyBalance key={balance}>{balance.toLocaleString('pt-BR')} moedas</EconomyBalance>
          {busy ? <LoadingIndicator compact label="Atualizando" /> : <small>Itens no depósito não pesam na mochila. Acesso somente na Base ou no Mercador.</small>}
        </EconomyTopline>
        {error && <GameNotice $danger role="alert">{error}</GameNotice>}
        <EconomyTabs role="tablist" aria-label="Inventário e vendedor">
          {vendor && <button type="button" role="tab" aria-selected={state.tab === 'offers'}
            onClick={() => state.setTab('offers')}>Ofertas · {state.offers.length}</button>}
          {vendor && <button type="button" role="tab" aria-selected={selling}
            onClick={() => state.setTab('sell')}>Vender</button>}
          <button type="button" role="tab" aria-selected={state.tab === 'inventory'}
            onClick={() => state.setTab('inventory')}>Mochila · {state.inventory.length}</button>
          <button type="button" role="tab" aria-selected={state.tab === 'stash'}
            disabled={!RUN_DEPOSIT_ENABLED}
            onClick={() => state.setTab('stash')}>Depósito · {state.stash.length}</button>
        </EconomyTabs>
        <EconomySectionTitle>{selling ? 'Escolha o que vender' : state.tab === 'offers' ? 'Ofertas desta visita' : state.tab === 'stash' ? 'Itens guardados' : 'Itens carregados'}</EconomySectionTitle>
        {selling && <>
          <EconomyTabs aria-label="Origem dos itens à venda">
            <button type="button" aria-pressed={!state.saleFromStash} disabled={busy} onClick={() => {
              state.setSelected(null); state.setSaleFromStash(false);
            }}>Mochila</button>
            <button type="button" aria-pressed={state.saleFromStash} disabled={busy || !RUN_DEPOSIT_ENABLED}
              onClick={() => {
              state.setSelected(null); state.setSaleFromStash(true);
            }}>Depósito</button>
          </EconomyTabs>
          <small className="economy-sale-hint">Preço já inclui {discount}% de desconto de venda. Itens sem valor rendem 0 moedas.</small>
        </>}
        {state.tab === 'offers' ? <EconomyCards role="tabpanel" aria-label="Ofertas">
          {state.offers.length === 0 && <LoadoutEmpty>Nenhuma oferta disponível.</LoadoutEmpty>}
          {state.offers.map((offer) => <EconomyCard key={offer.itemId}>
            <RunInventoryCard entry={offer.entry} selected={false} neon={neon === 'on'}
              onSelect={() => state.setSelected(offer.entry)} />
            <small data-empty={offer.stock === 0}>{offer.price.toLocaleString('pt-BR')} moedas ·
              {offer.stock === 0 ? ' esgotado' : ` ${offer.stock} em estoque`}
              {offer.stock > 0 && balance < offer.price ? ' · saldo insuficiente' : ''}</small>
          </EconomyCard>)}
        </EconomyCards> : <EconomyCards role="tabpanel" aria-label={selling ? 'Itens à venda' : state.tab === 'stash' ? 'Depósito' : 'Mochila'}>
          {entries.length === 0 && <LoadoutEmpty>{selling ? 'Nenhum item para vender nesta origem.' : state.tab === 'stash' ? 'Seu depósito está vazio.' : 'Sua mochila está vazia.'}</LoadoutEmpty>}
          {entries.map((entry) => <EconomyCard key={`${entry.tipo}:${entry.idInstancia}`}>
            <RunInventoryCard entry={entry} selected={false} equipped={entry.defenseEquipped || run.acoesEquipadas?.some((action) =>
              action.tipo === entry.tipo && action.idInstancia === entry.idInstancia)}
              neon={neon === 'on'} onSelect={() => selectEntry(entry)} />
            <small>{entry.quantity} un. · {entry.weight?.toLocaleString('pt-BR') ?? '—'} kg
              {RUN_DEPOSIT_ENABLED && state.tab === 'inventory' && entry.defenseEquipped ? ' · será desequipado ao guardar' : ''}</small>
            {selling ? <small>{runSaleUnitPrice(entry.value, discount).toLocaleString('pt-BR')} moedas por unidade</small>
              : <EconomyActions><CyberButton theme={theme} neon={neon} colorType="secondary" width="100%"
              text={state.tab === 'stash' ? 'Levar' : 'Guardar'} disabled={busy || !canAccessRunStash(run)}
              onClick={() => { if (RUN_DEPOSIT_ENABLED) void onTransfer(entry.idInstancia, state.tab !== 'stash'); }} /></EconomyActions>}
          </EconomyCard>)}
        </EconomyCards>}
      </EconomyBody>
    </RunTrainingPanel>
    {state.selected && <RunInventoryActionDialog entry={state.selected} neon={neon === 'on'} onClose={() => { if (!busy) state.setSelected(null); }}>
      {(selectedOffer || selling) && error && <GameNotice $danger role="alert">{error}</GameNotice>}
      {(selectedOffer || selling) && busy && <LoadingIndicator compact label={selling ? 'Vendendo' : 'Comprando'} />}
      <EconomyDetails>
        {selectedOffer && <p><strong>{selectedOffer.price.toLocaleString('pt-BR')} moedas</strong>
          {' · '}{selectedOffer.stock === 0 ? 'Esgotado' : `${selectedOffer.stock} em estoque`}
          {balance < selectedOffer.price ? ' · saldo insuficiente' : ''}</p>}
        {state.selected.damageByRange.base > 0 && <p>Dano base <strong>{state.selected.damageByRange.base}</strong></p>}
        {state.selected.ranged && <p>Dano por alcance: {state.selected.damageByRange.curta} / {state.selected.damageByRange.media} / {state.selected.damageByRange.longa}</p>}
        {state.selected.defense.protecao > 0 && <p>Proteção <strong>{state.selected.defenseRemaining.protecao} / {state.selected.defense.protecao}</strong></p>}
        {state.selected.defense.armadura > 0 && <p>Defesa <strong>{state.selected.defense.armadura}</strong></p>}
        {state.selected.defense.escudo > 0 && <p>Escudo <strong>{state.selected.defenseRemaining.escudo}</strong></p>}
        {state.selected.restore.vida > 0 && <p>Recupera <strong>{state.selected.restore.vida}</strong> de vida</p>}
        {state.selected.restore.mana > 0 && <p>Recupera <strong>{state.selected.restore.mana}</strong> de mana</p>}
        {state.selected.restore.estamina > 0 && <p>Recupera <strong>{state.selected.restore.estamina}</strong> de estamina</p>}
        {state.selected.conditions.length > 0 && <p>Condições: {state.selected.conditions.map((condition) => condition.name).join(', ')}</p>}
      </EconomyDetails>
      {selling && <>
        {state.selected.quantity > 1 && <InputText label="Quantidade para vender" type="number" theme={theme} neon={neon}
          value={state.saleQuantity} min={1} max={Math.min(1_000_000, state.selected.quantity)}
          disabled={busy} onChange={(event) => state.setSaleQuantity(event.target.value)} />}
        <EconomyDetails aria-live="polite">
          <p>{saleUnitPrice.toLocaleString('pt-BR')} moedas por unidade · {state.selected.quantity} disponíveis</p>
          <p>Você recebe <strong>{(saleLines.length ? saleUnitPrice * Number(state.saleQuantity) : 0).toLocaleString('pt-BR')} moedas</strong></p>
          {saleLines.length === 0 && <p role="alert">{Number.isInteger(Number(state.saleQuantity)) &&
            Number(state.saleQuantity) >= 1 && Number(state.saleQuantity) <= Math.min(1_000_000, state.selected.quantity)
            ? 'Venda um lote menor por vez.'
            : `Escolha de 1 a ${Math.min(1_000_000, state.selected.quantity)} unidades.`}</p>}
          {saleUnitPrice === 0 && <p>Este item será removido sem receber moedas.</p>}
          {state.selected.defenseEquipped || run.acoesEquipadas?.some(action => action.idInstancia === state.selected?.idInstancia)
            ? <p>Ao vender todas as unidades, este item sai dos equipamentos e ações.</p> : null}
        </EconomyDetails>
        <EconomyActions>
          <CyberButton theme={theme} neon={neon} text="Vender" width="100%" loading={busy}
            disabled={busy || saleLines.length === 0 || run.status !== 'Ativa'}
            onClick={() => void onSell(saleLines, state.saleFromStash).then(done => { if (done) state.setSelected(null); })} />
          <CyberButton theme={theme} neon={neon} colorType="secondary" text="Cancelar" width="100%"
            disabled={busy} onClick={() => state.setSelected(null)} />
        </EconomyActions>
      </>}
      {selectedOffer && <EconomyActions>
        <CyberButton theme={theme} neon={neon} text="Comprar" width="100%"
          disabled={busy || selectedOffer.stock <= 0 || balance < selectedOffer.price}
          onClick={() => void onBuy(selectedOffer.itemId, false).then((done) => { if (done) state.setSelected(null); })} />
        <CyberButton theme={theme} neon={neon} colorType="secondary" text="Ao depósito" width="100%"
          aria-label={`Comprar ${selectedOffer.entry.name} e enviar ao depósito`}
          disabled={busy || selectedOffer.stock <= 0 || balance < selectedOffer.price || !RUN_DEPOSIT_ENABLED}
          onClick={() => { if (RUN_DEPOSIT_ENABLED) void onBuy(selectedOffer.itemId, true)
            .then((done) => { if (done) state.setSelected(null); }); }} />
      </EconomyActions>}
    </RunInventoryActionDialog>}
  </RunTrainingDialog>;
}
