import api from '../axios/api';
import type {
  GameplayCombatCommandBase,
  GameplayCombatCommandResponse,
  GameplayCombatSnapshot,
  GameplayStateCatalog,
} from '../models/GameplayCombat';

const base = (idMesa: number, idMesaSessao: number) => `/mesas/${idMesa}/sessoes/${idMesaSessao}/combate`;

export const obterCombateAtual = async (idMesa: number, idMesaSessao: number): Promise<GameplayCombatSnapshot | null> => {
  const response = await api.get<GameplayCombatSnapshot | null>(base(idMesa, idMesaSessao));
  return response.status === 204 || !response.data ? null : response.data;
};

export const obterCatalogoEstadoGameplay = async (idMesa: number, idMesaSessao: number): Promise<GameplayStateCatalog> => {
  const response = await api.get<GameplayStateCatalog>(`${base(idMesa, idMesaSessao)}/catalogo`);
  return response.data;
};

const post = async <T extends GameplayCombatCommandBase>(idMesa: number, idMesaSessao: number, route: string, payload: T) => {
  const response = await api.post<GameplayCombatCommandResponse>(`${base(idMesa, idMesaSessao)}/${route}`, payload);
  return response.data;
};

export const iniciarCombate = (idMesa: number, idSessao: number, payload: GameplayCombatCommandBase & { idsPersonagens: number[] }) => post(idMesa, idSessao, 'iniciar', payload);
export interface AdicionarNpcCombatePayload {
  nome: string;
  imagem?: string | null;
  modificadorIniciativa: number;
  idPersonagemJogador?: number | null;
  idPersonagemOrigem?: number | null;
  idVarianteOrigem?: string | null;
}

export const adicionarNpcCombate = (idMesa: number, idSessao: number, payload: GameplayCombatCommandBase & AdicionarNpcCombatePayload) => post(idMesa, idSessao, 'npcs', payload);
export const removerParticipanteCombate = (idMesa: number, idSessao: number, payload: GameplayCombatCommandBase & { idParticipante: number }) => post(idMesa, idSessao, 'participantes/remover', payload);
export const rolarIniciativaCombate = (idMesa: number, idSessao: number, payload: GameplayCombatCommandBase & { idParticipante: number }) => post(idMesa, idSessao, 'iniciativa', payload);
export const ativarCombate = (idMesa: number, idSessao: number, payload: GameplayCombatCommandBase & { ordemParticipantes: number[] }) => post(idMesa, idSessao, 'ativar', payload);
export const avancarTurnoCombate = (idMesa: number, idSessao: number, payload: GameplayCombatCommandBase) => post(idMesa, idSessao, 'avancar', payload);
export const encerrarCombate = (idMesa: number, idSessao: number, payload: GameplayCombatCommandBase) => post(idMesa, idSessao, 'encerrar', payload);
export const aplicarCondicaoCombate = (idMesa: number, idSessao: number, payload: GameplayCombatCommandBase & { idParticipante: number; idSistemaCondicao: number; duracao?: number; valor?: number }) => post(idMesa, idSessao, 'condicoes', payload);
export const removerCondicaoCombate = (idMesa: number, idSessao: number, payload: GameplayCombatCommandBase & { idCondicaoAtiva: number; motivo?: string }) => post(idMesa, idSessao, 'condicoes/remover', payload);
export const rolarSobrevivenciaCombate = (idMesa: number, idSessao: number, payload: GameplayCombatCommandBase & { idParticipante: number; estabilizacaoManual?: boolean }) => post(idMesa, idSessao, 'sobrevivencia', payload);
export const aplicarDescansoGameplay = (idMesa: number, idSessao: number, payload: GameplayCombatCommandBase & { idPersonagemJogador: number; idSistemaDescansoConfig: number; revisaoPersonagemEsperada: number; guardaConfirmada: boolean }) => post(idMesa, idSessao, 'descansos', payload);
