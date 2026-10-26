import { useEffect, useState } from 'react';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import type { GameRunDto, GameRunProtectedDeposit, ProtectedDepositAction } from '../../../../models/GameRun';
import { getGameRunProtectedDeposit } from '../../../../services/gameRunService';
import { getApiErrorMessage } from '../../../../utils/apiError';
import { CyberButton } from '../../../../components/Generic/HighlightButton/HighlightButton';
import { LoadingIndicator } from '../../../../components/Generic/LoadingIndicator';
import { GameNotice } from '../../GameShared.style';
import { RunInventoryCard } from '../RunInventoryCard';
import { RunInventoryActionDialog } from '../RunInventoryActionDialog';
import { parseRunStoredItems } from '../runInventoryEntries';
import { canAccessRunStash } from '../runEconomy';
import { RunEconomyItemDetails } from './RunEconomyItemDetails';
import { EconomyActions, EconomyCard, EconomyCards, EconomyDetails } from './RunEconomyDialog.style';

interface Props {
  run: GameRunDto; theme: 'dark' | 'light'; neon: 'on' | 'off'; busy: boolean;
  onProtect: (itemId: string, action: ProtectedDepositAction) => Promise<boolean>;
}

export function RunProtectedDeposit({ run, theme, neon, busy, onProtect }: Props) {
  const [data, setData] = useState<GameRunProtectedDeposit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void getGameRunProtectedDeposit(run.idGameRun, controller.signal).then(value => {
      if (!controller.signal.aborted) { setData(value); setError(null); setLoadedKey(`${run.idGameRun}:${run.revisao}`); }
    }).catch(reason => {
      if (!controller.signal.aborted) setError(getApiErrorMessage(reason, 'Não foi possível carregar os itens protegidos.'));
    });
    return () => controller.abort();
  }, [run.idGameRun, run.revisao, attempt]);
  if (error) return <GameNotice $danger role="alert">{error}
    <CyberButton theme={theme} neon={neon} text="Tentar novamente" onClick={() => { setError(null); setAttempt(value => value + 1); }} />
  </GameNotice>;
  if (!data || loadedKey !== `${run.idGameRun}:${run.revisao}`) return <LoadingIndicator compact label="Consultando itens protegidos" />;
  const entries = data.items.flatMap(item => parseRunStoredItems([item.snapshot]).map(entry => ({ entry, item })));
  const selected = entries.find(({ item }) => item.itemId === selectedId);
  const change = (id: string, action: ProtectedDepositAction) => {
    void onProtect(id, action).then(done => { if (done) setSelectedId(null); });
  };
  const actions = (item: GameRunProtectedDeposit['items'][number]) => <EconomyActions>
    <CyberButton theme={theme} neon={neon} text="Levar" width="100%" disabled={busy || !item.compatible || !canAccessRunStash(run)}
      onClick={() => change(item.itemId, 'TAKE')} />
    <CyberButton theme={theme} neon={neon} text="Liberar" colorType="secondary" width="100%"
      disabled={busy || !item.compatible || !canAccessRunStash(run)} onClick={() => change(item.itemId, 'RELEASE')} />
  </EconomyActions>;
  return <>
    <EconomyDetails><p><LockOutlinedIcon fontSize="small" /> <strong>{data.items.length} / {data.slots} vagas</strong></p>
      <p>Estes itens ficam salvos para as próximas runs deste personagem e jogo, mesmo após derrota ou abandono.</p>
      <p>Levar devolve à mochila e remove a proteção. Liberar mantém no depósito comum, que termina com a run.</p>
      {data.slots === 0 && <p>Novas proteções estão desabilitadas neste jogo. Seus itens já protegidos continuam preservados.</p>}
    </EconomyDetails>
    <EconomyCards aria-label="Itens protegidos">
      {entries.length === 0 && <GameNotice>Nenhum item protegido. Guarde um item no depósito comum e escolha Proteger.</GameNotice>}
      {entries.map(({ entry, item }) => <EconomyCard key={item.itemId}>
        <RunInventoryCard entry={entry} selected={false} neon={neon === 'on'} onSelect={() => setSelectedId(item.itemId)} />
        <small><LockOutlinedIcon fontSize="inherit" /> Protegido · {entry.quantity} un.</small>
        {!item.compatible && <small>Preservado em outra versão do Sistema. A retirada exige uma versão compatível.</small>}
        {actions(item)}
      </EconomyCard>)}
    </EconomyCards>
    {selected && <RunInventoryActionDialog entry={selected.entry} neon={neon === 'on'} aboveModal
      onClose={() => { if (!busy) setSelectedId(null); }}>
      <EconomyDetails><RunEconomyItemDetails entry={selected.entry} />
        <p>Item protegido entre runs. Mantém as propriedades e defesas gastas, sem reparo ao transferir.</p></EconomyDetails>
      {actions(selected.item)}
    </RunInventoryActionDialog>}
  </>;
}
