import api from '../axios/api';
import type { GameAdventure, GameModeEditor, GameModeEditorUpdate, GameModeNpcOption, GameModeRestOption, GameModeSystemVersion } from '../models/GameModeManagement';

const path = '/game-mode/management';
const adventurePath = '/game-adventures';

export const listGameAdventures = async (mesaId?: number): Promise<GameAdventure[]> =>
  (await api.get<GameAdventure[]>(adventurePath, { params: { idMesa: mesaId } })).data;

export const createGameAdventure = async (payload: { idMesa?: number; idSistemaVersao?: number;
  nome: string; descricao: string; banner: string }): Promise<GameModeEditor> =>
  (await api.post<GameModeEditor>(adventurePath, payload)).data;

export const getGameAdventureEditor = async (code: string, mesaId?: number, versionId?: number): Promise<GameModeEditor> =>
  (await api.get<GameModeEditor>(`${adventurePath}/${encodeURIComponent(code)}`,
    { params: { idMesa: mesaId, idSistemaVersao: versionId } })).data;

export const createGameAdventureDraft = async (code: string, mesaId?: number): Promise<GameModeEditor> =>
  (await api.post<GameModeEditor>(`${adventurePath}/${encodeURIComponent(code)}/draft`, null,
    { params: { idMesa: mesaId } })).data;

export const adaptGameAdventure = async (code: string, mesaId?: number): Promise<GameModeEditor> =>
  (await api.post<GameModeEditor>(`${adventurePath}/${encodeURIComponent(code)}/adapt`, null,
    { params: { idMesa: mesaId } })).data;

export const saveGameAdventureDraft = async (id: number, update: GameModeEditorUpdate, mesaId?: number): Promise<GameModeEditor> =>
  (await api.put<GameModeEditor>(`${adventurePath}/draft/${id}`, update,
    { params: { idMesa: mesaId } })).data;

export const publishGameAdventureDraft = async (id: number, mesaId?: number): Promise<GameModeEditor> =>
  (await api.post<GameModeEditor>(`${adventurePath}/draft/${id}/publish`, null,
    { params: { idMesa: mesaId } })).data;

export const getGameAdventureSystemVersions = async (mesaId?: number): Promise<GameModeSystemVersion[]> =>
  (await api.get<GameModeSystemVersion[]>(`${adventurePath}/system-versions`,
    { params: { idMesa: mesaId } })).data;

export interface GameLootOption { id: string; name: string; type: string; image: string | null }
export const getGameLootOptions = async (mesaId?: number, versionId?: number): Promise<GameLootOption[]> =>
  (await api.get<GameLootOption[]>(mesaId ? `${adventurePath}/loot-items` : `${path}/loot-items`,
    { params: { idMesa: mesaId, idSistemaVersao: versionId } })).data;

export const getGameModeEditor = async (idSistemaVersao?: number): Promise<GameModeEditor> =>
  (await api.get<GameModeEditor>(path, { params: { idSistemaVersao } })).data;

export const getGameModeSystemVersions = async (): Promise<GameModeSystemVersion[]> =>
  (await api.get<GameModeSystemVersion[]>(`${path}/system-versions`)).data;

export const getGameModeRestOptions = async (idSistemaVersao: number, mesaId?: number): Promise<GameModeRestOption[]> =>
  (await api.get<GameModeRestOption[]>(mesaId ? `${adventurePath}/rest-options` : `${path}/rest-options`,
    { params: { idMesa: mesaId, idSistemaVersao } })).data;

export const getGameModeNpcs = async (idSistemaVersao?: number, mesaId?: number): Promise<GameModeNpcOption[]> =>
  (await api.get<GameModeNpcOption[]>(mesaId ? `${adventurePath}/npcs` : `${path}/npcs`,
    { params: { idMesa: mesaId, idSistemaVersao } })).data;

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
