import api from '../axios/api';
import type { GameBattlePreview } from '../models/GameBattlePreview';

export const createGameBattlePreview = async (runId: number): Promise<GameBattlePreview> => {
  const response = await api.post<GameBattlePreview>(`/game-runs/${runId}/battles/preview`);
  return response.data;
};
