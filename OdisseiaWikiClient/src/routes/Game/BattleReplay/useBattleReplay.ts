import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GameBattlePreview } from '../../../models/GameBattlePreview';
import { createGameBattlePreview } from '../../../services/gameBattlePreviewService';
import { getApiErrorMessage } from '../../../utils/apiError';
import { buildBattleBeats } from './battlePresentation';

const battleSpeedKey = 'game-run:battle-speed';

const savedBattleSpeed = (): 1 | 2 => {
  try { return window.localStorage.getItem(battleSpeedKey) === '2' ? 2 : 1; }
  catch { return 1; }
};

export const useBattleReplay = (runId: number, savedBattle?: GameBattlePreview) => {
  const [preview, setPreview] = useState<GameBattlePreview | null>(savedBattle ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const [resolvedEventCount, setResolvedEventCount] = useState(0);
  const [rollingSequence, setRollingSequence] = useState<number | null>(null);
  const [revealHold, setRevealHold] = useState<{ sequence: number; duration: number } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeedState] = useState<1 | 2>(savedBattleSpeed);
  const setSpeed = (value: 1 | 2) => {
    setSpeedState(value);
    try { window.localStorage.setItem(battleSpeedKey, String(value)); }
    catch { /* O combate continua funcional se o navegador bloquear o armazenamento. */ }
  };
  const beats = useMemo(() => preview ? buildBattleBeats(preview) : [], [preview]);
  const advance = useCallback(() => {
    const nextBeat = beats.find((beat) => beat.throughIndex > eventCount);
    const nextCount = nextBeat?.throughIndex ?? preview?.resultado.events.length ?? eventCount;
    setEventCount(nextCount);
    if (nextBeat?.action) setRollingSequence(nextBeat.sequence);
    else setResolvedEventCount(nextCount);
  }, [beats, eventCount, preview]);

  useEffect(() => {
    if (!savedBattle) return;
    setPreview(savedBattle);
    setEventCount(0);
    setResolvedEventCount(0);
    setRollingSequence(null);
    setRevealHold(null);
    setPlaying(savedBattle.resultado.events.length > 0);
  }, [savedBattle]);

  const load = useCallback(async () => {
    setPlaying(false);
    setLoading(true);
    setError(null);
    try {
      const result = await createGameBattlePreview(runId);
      setPreview(result);
      setEventCount(0);
      setResolvedEventCount(0);
      setRollingSequence(null);
      setRevealHold(null);
      setPlaying(result.resultado.events.length > 0);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Não foi possível preparar a batalha de treino.'));
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    if (rollingSequence !== null) {
      const timer = window.setTimeout(() => {
        setResolvedEventCount(eventCount);
        setRollingSequence(null);
        const action = beats.find((beat) => beat.sequence === rollingSequence)?.action;
        setRevealHold({ sequence: rollingSequence, duration: action?.failed ? 0 : speed === 1 ? 1000 : 500 });
      }, speed === 1 ? 1500 : 750);
      return () => window.clearTimeout(timer);
    }
    if (revealHold !== null) {
      const timer = window.setTimeout(() => {
        setRevealHold(null);
        if (playing && preview && eventCount < preview.resultado.events.length) advance();
        else if (playing) setPlaying(false);
      }, revealHold.duration);
      return () => window.clearTimeout(timer);
    }
    if (!playing || !preview) return undefined;
    if (eventCount >= preview.resultado.events.length) {
      setPlaying(false);
      return undefined;
    }
    const timer = window.setTimeout(advance, speed === 1 ? 450 : 225);
    return () => window.clearTimeout(timer);
  }, [playing, preview, speed, eventCount, rollingSequence, revealHold, beats, advance]);

  const step = () => {
    if (!preview) return;
    setPlaying(false);
    if (rollingSequence !== null) {
      setResolvedEventCount(eventCount);
      setRollingSequence(null);
      setRevealHold(null);
    } else {
      setRevealHold(null);
      advance();
    }
  };

  const restart = () => {
    if (!preview) return;
    setEventCount(0);
    setResolvedEventCount(0);
    setRollingSequence(null);
    setRevealHold(null);
    setPlaying(true);
  };

  const skip = () => {
    if (!preview) return;
    setPlaying(false);
    setEventCount(preview.resultado.events.length);
    setResolvedEventCount(preview.resultado.events.length);
    setRollingSequence(null);
    setRevealHold(null);
  };

  return { preview, beats, loading, error, eventCount, resolvedEventCount, rollingSequence, revealHold,
    playing, speed, setSpeed, setPlaying, load, step, restart, skip };
};
