import type { GameRunDto } from '../../../models/GameRun';

/** End-of-run loot is still actionable, without reopening the rest of a finished run. */
export const canManageRunItem = (run: GameRunDto, itemId: string): boolean =>
  run.status === 'Ativa' || run.status === 'Vitoria' && run.estadoAtual.loot?.roll != null &&
    run.estadoAtual.loot.rewards.some(item => item.id === itemId);
