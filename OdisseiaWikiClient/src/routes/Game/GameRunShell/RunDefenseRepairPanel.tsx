import { useState } from 'react';
import type { GameRunDto } from '../../../models/GameRun';
import { CyberButton } from '../../../components/Generic/HighlightButton/HighlightButton';
import { LoadingIndicator } from '../../../components/Generic/LoadingIndicator';
import { GameNotice } from '../GameShared.style';
import { parseRunInventoryEntries } from './runInventoryEntries';
import { runEngineerRepair } from './runEngineerRepair';
import { RunInventoryCard } from './RunInventoryCard';
import { RunInventoryActionDialog } from './RunInventoryActionDialog';
import { RunEconomyItemDetails } from './RunEconomyDialog/RunEconomyItemDetails';
import { EconomyActions, EconomyCard, EconomyCards, EconomyDetails } from './RunEconomyDialog/RunEconomyDialog.style';

export function RunDefenseRepairPanel({ run, theme, neon, busy, error, onRepair }: {
  run: GameRunDto; theme: 'dark' | 'light'; neon: 'on' | 'off'; busy: boolean; error: string | null;
  onRepair: (itemId: string) => Promise<boolean>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState(false);
  const price = run.mapa.nodes.find(node => node.id === run.noAtualId)?.payload?.repairPricePer10Percent;
  const damaged = [...parseRunInventoryEntries(run.estadoAtual.inventario, 'ITEM'), ...parseRunInventoryEntries(run.estadoAtual.implantes, 'PROTESE')]
    .filter(entry => runEngineerRepair(entry).eligible);
  const selected = damaged.find(entry => entry.idInstancia === selectedId);
  const quote = selected ? runEngineerRepair(selected, price) : null;
  const balance = run.estadoAtual.economy?.balance ?? 0;
  return <>
    <GameNotice>{price == null ? 'Este Engenheiro não tem preço de conserto configurado nesta versão.'
      : `${price.toLocaleString('pt-BR')} moedas por bloco de 10% da proteção e escudo faltantes do item. Exemplo: 25% custa 3 blocos.`}</GameNotice>
    {notice && <GameNotice role="status">Defesas do equipamento restauradas!</GameNotice>}
    <EconomyCards role="tabpanel" aria-label="Equipamentos para consertar">
      {damaged.map(entry => <EconomyCard key={`${entry.tipo}:${entry.idInstancia}`}>
        <RunInventoryCard entry={entry} selected={false} equipped={entry.defenseEquipped} neon={neon === 'on'} onSelect={() => { setNotice(false); setSelectedId(entry.idInstancia); }} />
        <small>Proteção {entry.defenseRemaining.protecao}/{entry.defense.protecao} · Escudo {entry.defenseRemaining.escudo}/{entry.defense.escudo}</small>
      </EconomyCard>)}
      {!damaged.length && <GameNotice>Nenhum equipamento precisa de conserto.</GameNotice>}
    </EconomyCards>
    {selected && quote && <RunInventoryActionDialog entry={selected} neon={neon === 'on'} onClose={() => { if (!busy) setSelectedId(null); }}>
      {error && <GameNotice $danger role="alert">{error}</GameNotice>}
      {busy && <LoadingIndicator compact label="Consertando" />}
      <EconomyDetails><RunEconomyItemDetails entry={selected} />
        {selected.defense.protecao > 0 && <p>Proteção: {selected.defenseRemaining.protecao} → {selected.defense.protecao}</p>}
        {selected.defense.escudo > 0 && <p>Escudo: {selected.defenseRemaining.escudo} → {selected.defense.escudo}</p>}
        <p>Recuperar {quote.percent.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}% · {quote.blocks} blocos de 10%</p>
        <p>Preço: <strong>{quote.cost == null ? 'Não configurado' : `${quote.cost.toLocaleString('pt-BR')} moedas`}</strong></p>
        {quote.cost != null && quote.cost > balance && <p>Saldo insuficiente.</p>}
      </EconomyDetails>
      <EconomyActions>
        <CyberButton text="Voltar" colorType="secondary" width="100%" theme={theme} neon={neon} disabled={busy} onClick={() => setSelectedId(null)} />
        <CyberButton text="Consertar" width="100%" theme={theme} neon={neon} loading={busy}
          disabled={busy || quote.cost == null || quote.cost > balance || run.status !== 'Ativa'}
          onClick={() => void onRepair(selected.idInstancia).then(done => { if (done) { setSelectedId(null); setNotice(true); } })} />
      </EconomyActions>
    </RunInventoryActionDialog>}
  </>;
}
