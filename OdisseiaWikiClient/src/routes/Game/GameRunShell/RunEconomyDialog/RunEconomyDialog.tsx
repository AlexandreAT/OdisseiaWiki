import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import type { GameRunDto } from '../../../../models/GameRun';
import { CyberButton } from '../../../../components/Generic/HighlightButton/HighlightButton';
import { LoadingIndicator } from '../../../../components/Generic/LoadingIndicator';
import { GameNotice, GameSectionTitle } from '../../GameShared.style';
import { RunTrainingDialog, RunTrainingPanel, RunHudTopline } from '../GameRunShell.style';
import { LoadoutEmpty } from '../RunLoadout.style';
import { RunInventoryCard } from '../RunInventoryCard';
import { RunInventoryActionDialog } from '../RunInventoryActionDialog';
import { normalizeImagePath } from '../../../Wiki/utils/imagePathHelper';
import { useRunEconomyDialog } from './useRunEconomyDialog';
import { RunProtectedDeposit } from './RunProtectedDeposit';
import { RunEconomyItemDetails } from './RunEconomyItemDetails';
import { RunSalePanel } from './RunSalePanel';
import { RunSaleHeader } from './RunSaleHeader';
import { canAccessRunStash, RUN_DEPOSIT_ENABLED, type RunSaleLine } from '../runEconomy';
import { EconomyActions, EconomyBalance, EconomyBody, EconomyCard, EconomyCards,
  EconomyDetails, EconomySectionTitle, EconomyTabs, EconomyTopline, MerchantIdentity, MerchantAvatar } from './RunEconomyDialog.style';

interface Props {
  run: GameRunDto; theme: 'dark' | 'light'; neon: 'on' | 'off'; vendor: boolean; busy: boolean;
  error: string | null;
  onBuy: (itemId: string, toStash: boolean) => Promise<boolean>;
  onTransfer: (itemId: string, toStash: boolean) => Promise<boolean>;
  onSell: (items: RunSaleLine[], fromStash: boolean) => Promise<boolean>;
  onProtect: (itemId: string, action: import('../../../../models/GameRun').ProtectedDepositAction) => Promise<boolean>;
  onClose: () => void;
}

export function RunEconomyDialog({ run, theme, neon, vendor, busy, error, onBuy, onTransfer, onSell, onProtect, onClose }: Props) {
  const state = useRunEconomyDialog(run, vendor);
  const protect = async (itemId: string, action: import('../../../../models/GameRun').ProtectedDepositAction) => {
    state.setProtectionNotice(null);
    const done = await onProtect(itemId, action);
    if (done) state.setProtectionNotice(action === 'PROTECT'
      ? 'Item protegido. Ele continuará guardado para as próximas runs deste personagem e jogo.'
      : action === 'TAKE' ? 'Item levado para a mochila. Para preservá-lo ao encerrar a run, guarde e proteja novamente.'
        : 'Proteção liberada. O item está no depósito comum e será perdido ao encerrar esta run.');
    return done;
  };
  const balance = run.estadoAtual.economy?.balance ?? 0;
  const selling = vendor && state.tab === 'sell';
  const entries = state.tab === 'stash' ? state.stash : state.inventory;
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
        <RunSaleHeader state={state} active={selling} busy={busy} theme={theme} neon={neon} canSell={run.status === 'Ativa'}
          onSell={onSell} onClose={onClose} closeLabel={vendor ? 'Sair do vendedor' : 'Fechar depósito'} />
      </RunHudTopline>
      <EconomyBody>
        <EconomyTopline>
          <EconomyBalance key={balance}>{balance.toLocaleString('pt-BR')} moedas</EconomyBalance>
          {busy ? <LoadingIndicator compact label="Atualizando" /> : <small>Itens no depósito não pesam na mochila. Acesso somente na Base ou no Mercador.</small>}
        </EconomyTopline>
        {error && <GameNotice $danger role="alert">{error}</GameNotice>}
        {state.protectionNotice && <GameNotice role="status">{state.protectionNotice}</GameNotice>}
        <EconomyTabs $neon={neon === 'on'} role="tablist" aria-label="Inventário e vendedor">
          {vendor && <button type="button" role="tab" aria-selected={state.tab === 'offers'}
            onClick={() => state.setTab('offers')}>Ofertas · {state.offers.length}</button>}
          {vendor && <button type="button" role="tab" aria-selected={selling}
            onClick={() => state.setTab('sell')}>Vender</button>}
          <button type="button" role="tab" aria-selected={state.tab === 'inventory'}
            onClick={() => state.setTab('inventory')}>Mochila · {state.inventory.length}</button>
          <button type="button" role="tab" aria-selected={state.tab === 'stash'}
            disabled={!RUN_DEPOSIT_ENABLED}
            onClick={() => state.setTab('stash')}>Depósito · {state.stash.length}</button>
          <button type="button" role="tab" aria-selected={state.tab === 'protected'}
            onClick={() => state.setTab('protected')}>Protegidos</button>
        </EconomyTabs>
        <EconomySectionTitle>{selling ? 'Escolha o que vender' : state.tab === 'protected' ? 'Entre jornadas' : state.tab === 'offers' ? 'Ofertas desta visita' : state.tab === 'stash' ? 'Itens guardados' : 'Itens carregados'}</EconomySectionTitle>
        {state.tab === 'stash' && (run.configuracaoModo.protectedDepositSlots ?? 0) > 0 &&
          <small className="economy-sale-hint">Proteger mantém a pilha entre runs e custa {run.configuracaoModo.protectedDepositCost ?? 0} moedas por instância. Apenas guardar não protege.</small>}
        {selling ? <RunSalePanel run={run} state={state} theme={theme} neon={neon} busy={busy} error={error} onSell={onSell} />
          : state.tab === 'protected' ? <RunProtectedDeposit run={run} theme={theme} neon={neon} busy={busy} onProtect={protect} /> : state.tab === 'offers' ? <EconomyCards role="tabpanel" aria-label="Ofertas">
          {state.offers.length === 0 && <LoadoutEmpty>Nenhuma oferta disponível.</LoadoutEmpty>}
          {state.offers.map((offer) => <EconomyCard key={offer.itemId}>
            <RunInventoryCard entry={offer.entry} selected={false} neon={neon === 'on'}
              onSelect={() => state.setSelected(offer.entry)} />
            <small data-empty={offer.stock === 0}>{offer.price.toLocaleString('pt-BR')} moedas ·
              {offer.stock === 0 ? ' esgotado' : ` ${offer.stock} em estoque`}
              {offer.stock > 0 && balance < offer.price ? ' · saldo insuficiente' : ''}</small>
          </EconomyCard>)}
        </EconomyCards> : <EconomyCards role="tabpanel" aria-label={state.tab === 'stash' ? 'Depósito' : 'Mochila'}>
          {entries.length === 0 && <LoadoutEmpty>{state.tab === 'stash' ? 'Seu depósito está vazio.' : 'Sua mochila está vazia.'}</LoadoutEmpty>}
          {entries.map((entry) => <EconomyCard key={`${entry.tipo}:${entry.idInstancia}`}>
            <RunInventoryCard entry={entry} selected={false} equipped={entry.defenseEquipped || run.acoesEquipadas?.some((action) =>
              action.tipo === entry.tipo && action.idInstancia === entry.idInstancia)}
              neon={neon === 'on'} onSelect={() => state.setSelected(entry)} />
            <small>{entry.quantity} un. · {entry.weight?.toLocaleString('pt-BR') ?? '—'} kg
              {RUN_DEPOSIT_ENABLED && state.tab === 'inventory' && entry.defenseEquipped ? ' · será desequipado ao guardar' : ''}</small>
            <EconomyActions><CyberButton theme={theme} neon={neon} colorType="secondary" width="100%"
              text={state.tab === 'stash' ? 'Levar' : 'Guardar'} disabled={busy || !canAccessRunStash(run)}
              onClick={() => { if (RUN_DEPOSIT_ENABLED) void onTransfer(entry.idInstancia, state.tab !== 'stash'); }} />
              {state.tab === 'stash' && (run.configuracaoModo.protectedDepositSlots ?? 0) > 0 &&
                <CyberButton theme={theme} neon={neon} text="Proteger" width="100%" disabled={busy || !canAccessRunStash(run)}
                  title={`Mantém a instância entre runs. Custo: ${run.configuracaoModo.protectedDepositCost ?? 0} moedas.`}
                  onClick={() => void protect(entry.idInstancia, 'PROTECT')} />}
              </EconomyActions>
          </EconomyCard>)}
        </EconomyCards>}
      </EconomyBody>
    </RunTrainingPanel>
    {!selling && state.selected && <RunInventoryActionDialog entry={state.selected} neon={neon === 'on'} onClose={() => { if (!busy) state.setSelected(null); }}>
      {selectedOffer && error && <GameNotice $danger role="alert">{error}</GameNotice>}
      {selectedOffer && busy && <LoadingIndicator compact label="Comprando" />}
      <EconomyDetails>
        {selectedOffer && <p><strong>{selectedOffer.price.toLocaleString('pt-BR')} moedas</strong>
          {' · '}{selectedOffer.stock === 0 ? 'Esgotado' : `${selectedOffer.stock} em estoque`}
          {balance < selectedOffer.price ? ' · saldo insuficiente' : ''}</p>}
        <RunEconomyItemDetails entry={state.selected} />
      </EconomyDetails>
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
