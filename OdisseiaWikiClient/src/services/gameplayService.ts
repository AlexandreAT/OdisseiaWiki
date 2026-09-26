import api from '../axios/api';
import type {
  GameplayCommandResponse,
  GameplayActionCatalog,
  GameplayEffectApplyRequest,
  GameplayEventPage,
  GameplayFavoriteRoll,
  GameplayFavoriteRollUpsert,
  GameplayManualRecordRequest,
  GameplayRollRequest,
  GameplaySimulationResponse,
  GameplaySession,
} from '../models/Gameplay';

export const obterCatalogoAcoesGameplay = async (
  idPersonagemJogador: number,
): Promise<GameplayActionCatalog> => {
  const response = await api.get<GameplayActionCatalog>(
    `/personagens-jogador/${idPersonagemJogador}/rolagens/catalogo`,
  );
  return response.data;
};

export const aplicarEfeitoGameplay = async (
  idMesa: number,
  idMesaSessao: number,
  payload: GameplayEffectApplyRequest,
): Promise<GameplayCommandResponse> => {
  const response = await api.post<GameplayCommandResponse>(
    `/mesas/${idMesa}/sessoes/${idMesaSessao}/efeitos/aplicar`,
    payload,
  );
  return response.data;
};

export const listarRolagensFavoritas = async (idPersonagemJogador: number): Promise<GameplayFavoriteRoll[]> => {
  const response = await api.get<GameplayFavoriteRoll[]>(
    `/personagens-jogador/${idPersonagemJogador}/rolagens/favoritos`,
  );
  return response.data;
};

export const salvarRolagemFavorita = async (
  idPersonagemJogador: number,
  payload: GameplayFavoriteRollUpsert,
): Promise<GameplayFavoriteRoll> => {
  const response = await api.put<GameplayFavoriteRoll>(
    `/personagens-jogador/${idPersonagemJogador}/rolagens/favoritos`,
    payload,
  );
  return response.data;
};

export const excluirRolagemFavorita = async (
  idPersonagemJogador: number,
  idFavorito: string,
): Promise<void> => {
  await api.delete(`/personagens-jogador/${idPersonagemJogador}/rolagens/favoritos/${idFavorito}`);
};

export const obterSessaoGameplayAtual = async (
  idMesa: number,
): Promise<GameplaySession | null> => {
  const response = await api.get<GameplaySession | null>(
    `/mesas/${idMesa}/sessoes/atual`,
  );

  if (response.status === 204 || !response.data) return null;
  return response.data;
};

export const listarEventosGameplay = async (
  idMesa: number,
  idMesaSessao: number,
  cursor?: string | null,
  limite = 100,
): Promise<GameplayEventPage> => {
  const response = await api.get<GameplayEventPage>(
    `/mesas/${idMesa}/sessoes/${idMesaSessao}/eventos`,
    { params: { cursor: cursor || undefined, limite } },
  );
  return response.data;
};

export const criarRolagemGameplay = async (
  idMesa: number,
  idMesaSessao: number,
  payload: GameplayRollRequest,
): Promise<GameplayCommandResponse> => {
  const response = await api.post<GameplayCommandResponse>(
    `/mesas/${idMesa}/sessoes/${idMesaSessao}/rolagens`,
    payload,
  );
  return response.data;
};

export const simularRolagemGameplay = async (
  idPersonagemJogador: number,
  payload: GameplayRollRequest,
): Promise<GameplaySimulationResponse> => {
  const response = await api.post<GameplaySimulationResponse>(
    `/personagens-jogador/${idPersonagemJogador}/rolagens/simular`,
    payload,
  );
  return response.data;
};

export const criarRegistroManualGameplay = async (
  idMesa: number,
  idMesaSessao: number,
  payload: GameplayManualRecordRequest,
): Promise<GameplayCommandResponse> => {
  const response = await api.post<GameplayCommandResponse>(
    `/mesas/${idMesa}/sessoes/${idMesaSessao}/registros-manuais`,
    payload,
  );
  return response.data;
};
