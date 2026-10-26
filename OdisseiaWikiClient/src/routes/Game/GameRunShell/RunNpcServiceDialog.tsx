import { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import type { GameRunDto } from '../../../models/GameRun';
import { CyberButton } from '../../../components/Generic/HighlightButton/HighlightButton';
import { LoadingIndicator } from '../../../components/Generic/LoadingIndicator';
import { GameNotice, GameSectionTitle } from '../GameShared.style';
import { RunTrainingDialog, RunTrainingPanel, RunHudTopline } from './GameRunShell.style';
import { RunInventoryCard } from './RunInventoryCard';
import { RunInventoryActionDialog } from './RunInventoryActionDialog';
import { parseRunInventoryEntries } from './runInventoryEntries';
import { normalizeImagePath } from '../../Wiki/utils/imagePathHelper';
import { EconomyActions, EconomyBalance, EconomyBody, EconomyCard, EconomyCards, EconomyDetails,
  EconomySectionTitle, EconomyTabs, EconomyTopline, MerchantIdentity, MerchantAvatar } from './RunEconomyDialog/RunEconomyDialog.style';
import { RunEconomyItemDetails } from './RunEconomyDialog/RunEconomyItemDetails';

interface Props {
  run: GameRunDto; theme: 'dark' | 'light'; neon: 'on' | 'off'; busy: boolean; error: string | null;
  onBuy: (id: string, toStash: boolean) => Promise<boolean>; onUpgrade: (id: string) => Promise<boolean>; onClose: () => void;
}

export function RunNpcServiceDialog({ run, theme, neon, busy, error, onBuy, onUpgrade, onClose }: Props) {
  const node = run.mapa.nodes.find(item => item.id === run.noAtualId);
  const sage = node?.payload?.npcType === 'SABIO';
  const [tab, setTab] = useState<'offers' | 'upgrade'>(sage ? 'offers' : 'upgrade');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const upgrade = node?.payload?.upgrade;
  const balance = run.estadoAtual.economy?.balance ?? 0;
  const level = run.estadoAtual.status?.nivel ?? 1;
  const learned = new Set(parseRunInventoryEntries(run.estadoAtual.magia, 'MAGIA').map(entry => entry.baseItemId));
  const image = normalizeImagePath(node?.image ?? undefined);
  const offers = (node?.payload?.offers ?? []).flatMap(offer => {
    if (!offer.snapshot) return [];
    const entry = parseRunInventoryEntries([{ ...offer.snapshot, id: offer.itemId, quantidade: 1 }], sage ? 'MAGIA' : 'PROTESE')[0];
    return entry ? [{ ...offer, entry }] : [];
  });
  const weapons = parseRunInventoryEntries(run.estadoAtual.inventario, 'ITEM').filter(entry =>
    ['arma', 'outro'].includes(entry.subtype) && Math.max(...Object.values(entry.damageByRange)) > 0);
  const offer = tab === 'offers' ? offers.find(item => item.itemId === selectedId) : undefined;
  const selected = tab === 'offers' ? offer?.entry : weapons.find(entry => entry.idInstancia === selectedId);
  const capped = (selected?.engineerUpgrades ?? 0) >= (upgrade?.maxUpgrades ?? 0);
  const finish = async () => {
    if (!selected) return;
    const done = tab === 'offers' ? await onBuy(selected.idInstancia, false) : await onUpgrade(selected.idInstancia);
    if (done) {
      setNotice(tab === 'offers' ? sage ? 'Magia aprendida! Equipe-a nas ações do inventário.' : 'Prótese recebida na mochila.' : 'Arma melhorada! O bônus já vale nas próximas batalhas.');
      setSelectedId(null);
    }
  };
  return <RunTrainingDialog open onClose={busy ? undefined : onClose} maxWidth="md" fullWidth aria-labelledby="npc-service-title">
    <RunTrainingPanel neon={neon === 'on'}><RunHudTopline>
      <MerchantIdentity><MerchantAvatar $neon={neon === 'on'}>{image ? <img src={image} alt="" /> : <AutoFixHighIcon aria-hidden />}</MerchantAvatar>
        <span><GameSectionTitle id="npc-service-title">{node?.name ?? (sage ? 'Sábio' : 'Engenheiro')}</GameSectionTitle><small>{sage ? 'Conhecimento para esta jornada' : 'Arsenal e próteses'}</small></span></MerchantIdentity>
      <button type="button" aria-label="Voltar ao mapa" disabled={busy} onClick={onClose}><CloseIcon /></button>
    </RunHudTopline><EconomyBody>
      <EconomyTopline><EconomyBalance key={balance}>{balance.toLocaleString('pt-BR')} moedas</EconomyBalance>
        {busy && <LoadingIndicator compact label="Aplicando serviço" />}</EconomyTopline>
      {error && <GameNotice $danger role="alert">{error}</GameNotice>}
      {notice && <GameNotice role="status">{notice}</GameNotice>}
      {!sage && <EconomyTabs aria-label="Serviços do Engenheiro">
        <button type="button" aria-pressed={tab === 'upgrade'} disabled={busy} onClick={() => { setTab('upgrade'); setSelectedId(null); }}>Melhorar arma</button>
        <button type="button" aria-pressed={tab === 'offers'} disabled={busy} onClick={() => { setTab('offers'); setSelectedId(null); }}>Próteses</button>
      </EconomyTabs>}
      <EconomySectionTitle>{tab === 'upgrade' ? 'Escolha sua arma' : sage ? 'Magias desta visita' : 'Próteses desta visita'}</EconomySectionTitle>
      {tab === 'upgrade' ? <>
        <GameNotice>{upgrade?.damage ? `+${upgrade.damage} dano por melhoria · ${upgrade.price} moedas · até ${upgrade.maxUpgrades} melhorias por arma.` : 'Este Engenheiro não oferece melhorias de arma.'}</GameNotice>
        <EconomyCards>{weapons.map(entry => <EconomyCard key={entry.idInstancia}>
          <RunInventoryCard entry={entry} selected={false} neon={neon === 'on'} onSelect={() => setSelectedId(entry.idInstancia)} />
          <small>{entry.engineerUpgrades ?? 0}/{upgrade?.maxUpgrades ?? 0} melhorias</small>
        </EconomyCard>)}</EconomyCards>
        {weapons.length === 0 && <GameNotice>Nenhuma arma para melhorar na mochila.</GameNotice>}
      </> : <EconomyCards>{offers.map(item => <EconomyCard key={item.itemId}>
        <RunInventoryCard entry={item.entry} selected={false} neon={neon === 'on'} onSelect={() => setSelectedId(item.itemId)} />
        <small>{item.price.toLocaleString('pt-BR')} moedas · {sage && learned.has(item.itemId) ? 'já aprendida' : item.stock === 0 ? 'esgotado' : sage ? `nível ${item.minLevel ?? 1}` : `${item.stock} em estoque`}</small>
      </EconomyCard>)}{offers.length === 0 && <GameNotice>Nenhuma oferta nesta visita.</GameNotice>}</EconomyCards>}
    </EconomyBody></RunTrainingPanel>
    {selected && <RunInventoryActionDialog entry={selected} neon={neon === 'on'} onClose={() => { if (!busy) setSelectedId(null); }}>
      {error && <GameNotice $danger role="alert">{error}</GameNotice>}
      {busy && <LoadingIndicator compact label="Aplicando serviço" />}
      <EconomyDetails><RunEconomyItemDetails entry={selected} /></EconomyDetails>
      <EconomyDetails><p>Preço: <strong>{(tab === 'upgrade' ? upgrade?.price ?? 0 : offer?.price ?? 0).toLocaleString('pt-BR')} moedas</strong></p>
        {sage && offer && <p>{learned.has(offer.itemId) ? 'Você já aprendeu esta magia.' : level < (offer.minLevel ?? 1)
          ? `Você precisa chegar ao nível ${offer.minLevel}.` : 'A magia ficará no inventário. Equipe-a nas suas ações quando sair deste NPC.'}</p>}
      </EconomyDetails>
      {tab === 'upgrade' && <EconomyDetails>
        {Object.entries(selected.damageByRange).filter(([range]) => range !== 'base' || !selected.ranged).map(([range, damage]) =>
          <p key={range}>{selected.ranged ? range === 'base' ? 'Base' : range : 'Dano'}: <strong>{damage} → {damage + (upgrade?.damage ?? 0)}</strong></p>)}
        <p>{capped ? 'Limite de melhorias atingido.' : `Melhoria ${(selected.engineerUpgrades ?? 0) + 1}/${upgrade?.maxUpgrades ?? 0}`}</p>
      </EconomyDetails>}
      <EconomyActions><CyberButton text="Voltar" colorType="secondary" theme={theme} neon={neon} width="100%" disabled={busy} onClick={() => setSelectedId(null)} />
        <CyberButton text={tab === 'upgrade' ? 'Melhorar' : sage ? 'Aprender' : 'Comprar'} theme={theme} neon={neon} width="100%" loading={busy}
          disabled={busy || (tab === 'upgrade' ? capped || !upgrade?.damage || balance < upgrade.price : !offer?.stock || balance < offer.price ||
            sage && (learned.has(offer.itemId) || level < (offer.minLevel ?? 1)))}
          onClick={() => void finish()} /></EconomyActions>
    </RunInventoryActionDialog>}
  </RunTrainingDialog>;
}
