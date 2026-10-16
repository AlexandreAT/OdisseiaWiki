import api from '../axios/api';
import type {
  AbandonGameRunRequest,
  CreateGameRunRequest,
  GameCharacterOption,
  GameRunDto,
  GameRunMutationRequest,
  GameRunBattleRecord,
  GameRunBaseResolution,
  GameRunWeaponOrderRequest,
  GameRunLoadoutRequest,
  GameRunConsumeItemRequest,
  GameRunConsumeItemResult,
  GameRunEncounterSetup,
  GameRunMediumRestPreview,
  GameRunMediumRestResolution,
  GameRunBattleRequest,
} from '../models/GameRun';
import type { GameBattlePreview } from '../models/GameBattlePreview';

const basePath = '/game-runs';

export const getGameRunAttributes = async (id: number): Promise<import('../models/GameRun').GameAttributeOptions> =>
  (await api.get(`${basePath}/${id}/attributes`)).data;
export const upgradeGameRunAttribute = async (id: number, payload: GameRunMutationRequest & { codigo: string }): Promise<GameRunDto> =>
  (await api.post<GameRunDto>(`${basePath}/${id}/attributes/upgrade`, payload)).data;
export const rollGameRunLoot = async (id: number, payload: GameRunMutationRequest): Promise<GameRunDto> =>
  (await api.post<GameRunDto>(`${basePath}/${id}/loot/roll`, payload)).data;
export const dropGameRunItem = async (id: number, itemId: string, payload: GameRunMutationRequest): Promise<GameRunDto> =>
  (await api.post<GameRunDto>(`${basePath}/${id}/inventory/items/${encodeURIComponent(itemId)}/drop`, payload)).data;

export const getGameCharacters = async (): Promise<GameCharacterOption[]> => {
  const response = await api.get<GameCharacterOption[]>(`${basePath}/characters`);
  return response.data;
};

export const getActiveGameRun = async (): Promise<GameRunDto | null> => {
  const response = await api.get<GameRunDto>(`${basePath}/active`);
  return response.status === 204 ? null : response.data;
};

export const createGameRun = async (payload: CreateGameRunRequest): Promise<GameRunDto> => {
  const response = await api.post<GameRunDto>(basePath, payload);
  return response.data;
};

export const getGameRun = async (id: number): Promise<GameRunDto> => {
  const response = await api.get<GameRunDto>(`${basePath}/${id}`);
  return response.data;
};

export const abandonGameRun = async (
  id: number,
  payload: AbandonGameRunRequest,
): Promise<GameRunDto> => {
  const response = await api.post<GameRunDto>(`${basePath}/${id}/abandon`, payload);
  return response.data;
};

export const restartGameRun = async (
  id: number, payload: GameRunMutationRequest,
): Promise<GameRunDto> => {
  const response = await api.post<GameRunDto>(`${basePath}/${id}/restart`, payload);
  return response.data;
};

export const selectGameRunNode = async (
  id: number, nodeId: string, payload: GameRunMutationRequest,
): Promise<GameRunDto> => {
  const response = await api.post<GameRunDto>(`${basePath}/${id}/nodes/${encodeURIComponent(nodeId)}/select`, payload);
  return response.data;
};

export const resolveGameRunBattle = async (
  id: number, payload: GameRunBattleRequest,
): Promise<{ run: GameRunDto; battle: GameBattlePreview; noId: string; ordem: number; criadaEmUtc: string }> => {
  const response = await api.post<{ run: GameRunDto; battle: GameBattlePreview; noId: string; ordem: number; criadaEmUtc: string }>(
    `${basePath}/${id}/battles/current/resolve`, payload);
  return response.data;
};

export const getCurrentGameRunEncounterSetup = async (id: number): Promise<GameRunEncounterSetup> => {
  const response = await api.get<GameRunEncounterSetup>(`${basePath}/${id}/battles/current/setup`);
  return response.data;
};

export const getFirstGameRunBattle = async (id: number): Promise<GameBattlePreview | null> => {
  const response = await api.get<GameBattlePreview>(`${basePath}/${id}/battles/first`);
  return response.status === 204 ? null : response.data;
};

export const getGameRunBattles = async (id: number): Promise<GameRunBattleRecord[]> => {
  const response = await api.get<GameRunBattleRecord[]>(`${basePath}/${id}/battles`);
  return response.data;
};

export const upgradeGameRunMap = async (id: number, payload: GameRunMutationRequest): Promise<GameRunDto> => {
  const response = await api.post<GameRunDto>(`${basePath}/${id}/map/upgrade`, payload);
  return response.data;
};

export const enterGameRunBase = async (
  id: number, nodeId: string, payload: GameRunMutationRequest,
): Promise<GameRunBaseResolution> => {
  const response = await api.post<GameRunBaseResolution>(
    `${basePath}/${id}/nodes/${encodeURIComponent(nodeId)}/rest`, payload);
  return response.data;
};

export const getGameRunMediumRestPreview = async (id: number): Promise<GameRunMediumRestPreview> => {
  const response = await api.get<GameRunMediumRestPreview>(`${basePath}/${id}/rest/medium`);
  return response.data;
};

export const performGameRunMediumRest = async (
  id: number, payload: GameRunMutationRequest,
): Promise<GameRunMediumRestResolution> => {
  const response = await api.post<GameRunMediumRestResolution>(`${basePath}/${id}/rest/medium`, payload);
  return response.data;
};

export const resolveGameRunEvent = async (
  id: number, nodeId: string, payload: GameRunMutationRequest,
): Promise<GameRunBaseResolution> => {
  const response = await api.post<GameRunBaseResolution>(
    `${basePath}/${id}/nodes/${encodeURIComponent(nodeId)}/event`, payload);
  return response.data;
};

export const updateGameRunWeaponOrder = async (
  id: number, payload: GameRunWeaponOrderRequest,
): Promise<GameRunDto> => {
  const response = await api.put<GameRunDto>(`${basePath}/${id}/inventory/weapon-order`, payload);
  return response.data;
};

export const updateGameRunLoadout = async (
  id: number, payload: GameRunLoadoutRequest,
): Promise<GameRunDto> => {
  const response = await api.put<GameRunDto>(`${basePath}/${id}/inventory/loadout`, payload);
  return response.data;
};

export const consumeGameRunItem = async (
  id: number, payload: GameRunConsumeItemRequest,
): Promise<GameRunConsumeItemResult> => {
  const response = await api.post<GameRunConsumeItemResult>(`${basePath}/${id}/inventory/consume`, payload);
  return response.data;
};

export const equipGameRunDefenseItem = async (
  id: number, itemId: string, payload: GameRunMutationRequest & { equipado: boolean },
): Promise<GameRunDto> => {
  const response = await api.put<GameRunDto>(
    `${basePath}/${id}/inventory/items/${encodeURIComponent(itemId)}/defense`, payload);
  return response.data;
};

