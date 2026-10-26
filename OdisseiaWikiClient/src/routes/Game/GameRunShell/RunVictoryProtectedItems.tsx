import { useEffect, useState } from 'react';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import type { GameRunDto, GameRunProtectedDeposit } from '../../../models/GameRun';
import { getGameRunProtectedDeposit } from '../../../services/gameRunService';
import { getApiErrorMessage } from '../../../utils/apiError';
import { LoadingIndicator } from '../../../components/Generic/LoadingIndicator';
import { CyberButton } from '../../../components/Generic/HighlightButton/HighlightButton';
import { normalizeImagePath } from '../../Wiki/utils/imagePathHelper';
import { parseRunStoredItems } from './runInventoryEntries';
import { VictoryDetail, VictoryItemPortrait, VictoryProtectedItems } from './RunVictoryScreen.style';

export function RunVictoryProtectedItems({ run, theme, neon }: {
  run: GameRunDto; theme: 'dark' | 'light'; neon: 'on' | 'off';
}) {
  const key = `${run.idGameRun}:${run.revisao}`;
  const [result, setResult] = useState<{ key: string; data?: GameRunProtectedDeposit; error?: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void getGameRunProtectedDeposit(run.idGameRun, controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ key, data });
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ key, error: getApiErrorMessage(error, 'Não foi possível consultar os itens protegidos.') });
    });
    return () => controller.abort();
  }, [key, run.idGameRun, attempt]);
  const current = result?.key === key ? result : null;
  const entries = current?.data?.items.flatMap(item => parseRunStoredItems([item.snapshot])
    .map(entry => ({ entry, id: item.itemId, compatible: item.compatible }))) ?? [];
  return <VictoryDetail neon={neon === 'on'} color="var(--clearneonPurple)" aria-label="Depósito protegido">
    <header><HomeOutlinedIcon aria-hidden="true" /><h3>Levados para casa</h3></header>
    {!current && <LoadingIndicator compact label="Consultando depósito protegido" />}
    {current?.error && <div role="alert"><p>{current.error}</p>
      <CyberButton theme={theme} neon={neon} text="Tentar novamente" width="190px"
        onClick={() => { setResult(null); setAttempt(value => value + 1); }} />
    </div>}
    {current?.data && (entries.length ? <VictoryProtectedItems>
      {entries.map(({ entry, id, compatible }) => <li key={id}>
        <VictoryItemPortrait src={normalizeImagePath(entry.image ?? undefined)} alt={entry.name}
          fallbackIcon={<Inventory2OutlinedIcon aria-hidden="true" />} />
        <div><strong>{entry.name}</strong><small><LockOutlinedIcon aria-hidden="true" />
          {entry.quantity} {entry.quantity === 1 ? 'unidade protegida' : 'unidades protegidas'}
        </small>{!compatible && <small>Guardado em outra versão do Sistema</small>}</div>
      </li>)}
    </VictoryProtectedItems> : <p>Nenhum item protegido ficou guardado nesta jornada.</p>)}
    <p className="protected-note">O depósito protegido fica salvo para as próximas jornadas deste personagem e jogo.
      {' '}Itens na mochila ou no depósito comum não são levados para a próxima run.</p>
  </VictoryDetail>;
}
