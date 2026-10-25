import api from '../axios/api';
import type { GameBattlePreview } from '../models/GameBattlePreview';

export interface GameTrainingEnemy {
  key: string; nome: string; imagem?: string | null; vida: number; mana: number; estamina: number;
}
export const getGameTrainingEnemies = async (runId: number, signal?: AbortSignal): Promise<GameTrainingEnemy[]> =>
  (await api.get<GameTrainingEnemy[]>(`/game-runs/${runId}/battles/preview/opponents`, { signal })).data;

export const createGameBattlePreview = async (runId: number, enemyKey = 'default', signal?: AbortSignal): Promise<GameBattlePreview> => {
  const response = await api.post<GameBattlePreview>(`/game-runs/${runId}/battles/preview`, undefined,
    { params: { enemyKey }, signal });
  return response.data;
};
