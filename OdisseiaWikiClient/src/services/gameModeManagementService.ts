import api from '../axios/api';
import type { GameModeEditor, GameModeEditorUpdate, GameModeNpcOption, GameModeRestOption, GameModeSystemVersion } from '../models/GameModeManagement';

const path = '/game-mode/management';

export interface GameLootOption { id: string; name: string; type: string; image: string | null }
export const getGameLootOptions = async (): Promise<GameLootOption[]> =>
  (await api.get<GameLootOption[]>(`${path}/loot-items`)).data;

export const getGameModeEditor = async (idSistemaVersao?: number): Promise<GameModeEditor> =>
  (await api.get<GameModeEditor>(path, { params: { idSistemaVersao } })).data;

export const getGameModeSystemVersions = async (): Promise<GameModeSystemVersion[]> =>
  (await api.get<GameModeSystemVersion[]>(`${path}/system-versions`)).data;

export const getGameModeRestOptions = async (idSistemaVersao: number): Promise<GameModeRestOption[]> =>
  (await api.get<GameModeRestOption[]>(`${path}/rest-options`, { params: { idSistemaVersao } })).data;

export const getGameModeNpcs = async (idSistemaVersao?: number): Promise<GameModeNpcOption[]> =>
  (await api.get<GameModeNpcOption[]>(`${path}/npcs`, { params: { idSistemaVersao } })).data;

export const createGameModeDraft = async (idSistemaVersao?: number): Promise<GameModeEditor> =>
  (await api.post<GameModeEditor>(`${path}/draft`, null, { params: { idSistemaVersao } })).data;

export const cloneGameModeDraft = async (sourceId: number, targetId: number): Promise<GameModeEditor> =>
  (await api.post<GameModeEditor>(`${path}/draft/clone`, null, { params: {
    idSistemaVersaoOrigem: sourceId, idSistemaVersaoDestino: targetId,
  } })).data;

export const saveGameModeDraft = async (id: number, update: GameModeEditorUpdate): Promise<GameModeEditor> =>
  (await api.put<GameModeEditor>(`${path}/draft/${id}`, update)).data;

export const publishGameModeDraft = async (id: number): Promise<GameModeEditor> =>
  (await api.post<GameModeEditor>(`${path}/draft/${id}/publish`)).data;
