import api from "../axios/api";
import { PersonagemJogador } from "../models/PersonagemJogador";
import { Principais, Secundarios } from "../models/PersonagemJogador";
import { JSONContent } from "../models/Characters";

export interface PersonagemJogadorPayload {
  idpersonagemJogador?: number;
  nome: string;
  idraca: number;
  idcidade?: number;
  idusuario: number;
  idmesa: number;
  historia?: JSONContent | string;
  imagem?: string;
  galeriaImagem?: string[];
  costumes: string[];
  infoSecundariasJson?: any;
  nanites?: number;
  alinhamento?: string;
  tracos: string[];
  inventarioJson: any[];
  skills: any[];
  magia: any[];
  idpassiva?: number;
  ultimate?: string;
  personagemsVinculados: string[];
  dataCriacao: string;
  statusJson: {
    status: {
      vida: number;
      vidaMaxima?: number;
      estamina: number;
      estaminaMaxima?: number;
      mana: number;
      manaMaxima?: number;
      capacidadeCarga: number;
    };
    atributos: {
      principais: Principais;
      secundarios: Secundarios;
    };
    nivel: number;
    xp: number;
    pontos: number;
    pontosAtributo: number;
    pontosSkill: number;
    pontosUltimate: number;
    condicioes: string[];
    defesas: Record<string, number>;
  };
}

export interface ResultPersonagemJogador {
  sucesso: boolean;
  mensagem?: string;
  mensagemErro?: string;
  personagem?: PersonagemJogadorResumo;
}

export interface PersonagemJogadorResumo {
  idpersonagemJogador: number;
  idusuario: number;
  idmesa: number;
  idraca: number;
  idcidade?: number;
  nome: string;
  imagem?: string;
  dataCriacao: string;
}

export const getPersonagensPorUsuario = async (
  idUsuario: number
): Promise<PersonagemJogador[]> => {
  const response = await api.get(`/PersonagemJogador/usuario/${idUsuario}`);
  return response.data;
};

export const getPersonagemJogadorById = async (
  id: number
): Promise<PersonagemJogador | null> => {
  const response = await api.get(`/PersonagemJogador/${id}`);
  return response.data;
};

export const criarPersonagemJogador = async (
  payload: PersonagemJogadorPayload
): Promise<ResultPersonagemJogador> => {
  const response = await api.post("/PersonagemJogador", payload);
  return response.data;
};

export const atualizarPersonagemJogador = async (
  id: number,
  payload: PersonagemJogadorPayload
): Promise<ResultPersonagemJogador> => {
  const response = await api.put(`/PersonagemJogador/${id}`, payload);
  return response.data;
};

export const deletarPersonagemJogador = async (id: number) => {
  await api.delete(`/PersonagemJogador/${id}`);
};

export const deletarPersonagensJogador = async (ids: number[]): Promise<number> => {
  const response = await api.post('/PersonagemJogador/batch-delete', { ids });
  return response.data.excluidos ?? response.data.Excluidos ?? 0;
};
