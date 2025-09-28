import api from "../axios/api";
import { PersonagemJogador } from "../models/PersonagemJogador";
import { Principais, Secundarios } from "../models/PersonagemJogador";

export interface PersonagemJogadorPayload {
  idpersonagemJogador?: number;
  nome: string;
  idraca: number;
  idcidade?: number;
  idusuario: number;
  idmesa: number;
  historia?: string;
  imagem?: string;
  costumes: string[];
  infoSecundariasJson?: any;
  nanites?: number;
  alinhamento?: string;
  tracos: string[];
  inventarioJson: any[];
  skills: any[];
  magia: any[];
  personagemsVinculados: string[];
  dataCriacao: string;
  statusJson: {
    status: {
      vida: number;
      estamina: number;
      mana: number;
      capacidadeCarga: number;
    };
    atributos: {
      principais: Principais;
      secundarios: Secundarios;
    };
    nivel: number;
    xp: number;
    defesas: Record<string, number>;
  };
}

export interface ResultPersonagemJogador {
  sucesso: boolean;
  mensagemErro?: string;
  personagem?: PersonagemJogadorPayload;
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
): Promise<{ sucesso: boolean; mensagemErro?: string; personagemJogador?: PersonagemJogadorPayload }> => {
  const response = await api.post("/PersonagemJogador", payload);
  return response.data;
};

export const atualizarPersonagemJogador = async (
  id: number,
  payload: PersonagemJogadorPayload
): Promise<{ sucesso: boolean; mensagemErro?: string; personagemJogador?: PersonagemJogadorPayload }> => {
  const response = await api.put(`/PersonagemJogador/${id}`, payload);
  return response.data;
};

export const deletarPersonagemJogador = async (id: number) => {
  await api.delete(`/PersonagemJogador/${id}`);
};