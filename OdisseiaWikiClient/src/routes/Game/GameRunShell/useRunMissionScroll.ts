import { useLayoutEffect } from 'react';
import type { GameRunDto } from '../../../models/GameRun';

export function useRunMissionScroll(run: Pick<GameRunDto, 'idGameRun' | 'mapa'> | null, onEnter: () => void) {
  const entrance = (run?.mapa.parentMap?.nodes ?? run?.mapa.parentNodes)
    ?.find(node => node.id === run?.mapa.secretReturnNodeId);
  const location = entrance?.type === 'MISSAO' ? `${run?.idGameRun}:${entrance.id}` : null;
  useLayoutEffect(() => {
    if (!location) return;
    onEnter();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location, onEnter]);
}
