import { useEffect, useRef, useState } from 'react';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import type { GameBattlePreview } from '../../../../models/GameBattlePreview';
import { createGameBattlePreview, getGameTrainingEnemies, type GameTrainingEnemy } from '../../../../services/gameBattlePreviewService';
import { CyberButton } from '../../../../components/Generic/HighlightButton/HighlightButton';
import { LoadingIndicator } from '../../../../components/Generic/LoadingIndicator';
import { getApiErrorMessage } from '../../../../utils/apiError';
import { normalizeImagePath } from '../../../Wiki/utils/imagePathHelper';
import { BattleReplay } from '../../BattleReplay/BattleReplay';
import { GameNotice } from '../../GameShared.style';
import { RunResourceBar } from '../RunResourceBar/RunResourceBar';
import { TrainingChoices, TrainingEnemyCard, TrainingHint, TrainingPortrait } from './RunTraining.style';

function EnemyPortrait({ image }: { image?: string | null }) {
  const [failed, setFailed] = useState(false);
  const path = normalizeImagePath(image ?? undefined);
  return <TrainingPortrait>{path && !failed ? <img src={path} alt="" onError={() => setFailed(true)} />
    : <PersonOutlineIcon aria-hidden="true" />}</TrainingPortrait>;
}

export function RunTraining({ runId, theme, neon, playerImage }: {
  runId: number; theme: 'dark' | 'light'; neon: 'on' | 'off'; playerImage?: string | null;
}) {
  const [enemies, setEnemies] = useState<GameTrainingEnemy[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [battle, setBattle] = useState<GameBattlePreview | null>(null);
  const [attempt, setAttempt] = useState(0);
  const request = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(null);
    getGameTrainingEnemies(runId, controller.signal).then((items) => {
      if (!controller.signal.aborted) setEnemies(items);
    }).catch((reason) => {
      if (!controller.signal.aborted) setError(getApiErrorMessage(reason, 'Não foi possível carregar os oponentes.'));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); request.current?.abort(); };
  }, [runId, attempt]);

  const train = async (enemy: GameTrainingEnemy) => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setLoadingKey(enemy.key); setError(null);
    try {
      const result = await createGameBattlePreview(runId, enemy.key, controller.signal);
      if (!controller.signal.aborted) setBattle(result);
    } catch (reason) {
      if (!controller.signal.aborted) setError(getApiErrorMessage(reason, 'Não foi possível preparar este treino.'));
    } finally {
      if (request.current === controller) request.current = null;
      if (!controller.signal.aborted) setLoadingKey(null);
    }
  };

  return <>
    <TrainingHint>Escolha seu oponente. Inimigos derrotados ficam disponíveis para este personagem nas próximas runs.
      O treino não gasta itens ou recursos e não concede recompensas.</TrainingHint>
    {error && <GameNotice $danger role="alert">{error}</GameNotice>}
    {loading ? <LoadingIndicator label="Carregando oponentes" /> : battle ? <>
      <CyberButton theme={theme} neon={neon} colorType="secondary" text="Escolher oponente" onClick={() => setBattle(null)} />
      <BattleReplay runId={runId} theme={theme} neon={neon} savedBattle={battle} playerImage={playerImage} isHistoricalReplay />
    </> : <>
      {error && enemies.length === 0 && <CyberButton theme={theme} neon={neon} text="Tentar novamente" onClick={() => setAttempt(value => value + 1)} />}
      <TrainingChoices aria-label="Oponentes do treino">
        {enemies.map(enemy => <TrainingEnemyCard key={enemy.key} type="button" data-neon={neon === 'on'}
          aria-label={`Treinar contra ${enemy.nome}`} disabled={loadingKey !== null} onClick={() => void train(enemy)}>
          <EnemyPortrait image={enemy.imagem} />
          <strong title={enemy.nome}>{enemy.nome}</strong>
          <small>{enemy.key === 'default' ? 'Treino padrão' : 'Inimigo derrotado'}</small>
          <RunResourceBar label="Vida" tone="life" value={enemy.vida} max={enemy.vida} />
          <RunResourceBar label="Mana" tone="mana" value={enemy.mana} max={enemy.mana} />
          <RunResourceBar label="Estamina" tone="stamina" value={enemy.estamina} max={enemy.estamina} />
          {loadingKey === enemy.key && <LoadingIndicator compact label="Preparando treino" />}
        </TrainingEnemyCard>)}
      </TrainingChoices>
    </>}
  </>;
}
