import { Principais, Secundarios, JSONContent } from './../models/Characters';
import api from "../axios/api";

export interface PersonagemPayload {
  idpersonagem: string;
  nome: string;
  idraca: number;
  idcidade: number;
  historia?: JSONContent | string;
  imagem?: string;
  costumes: string[];
  nanites?: number;
  alinhamento?: string;
  tracos: string[];
  inventarioJson: any[];
  skills: any[];
  magia: any[];
  personagemsVinculados: string[];
  tags?: string[];
  visivel: boolean;
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

export interface ResultPersonagem {
  sucesso: boolean;
  mensagemErro?: string;
  personagem?: PersonagemPayload;
}

export interface ResultPersonagens {
  sucesso: boolean;
  mensagemErro?: string;
  personagens?: PersonagemPayload[];
}

export interface PersonagemCreatePayload {
  nome: string;
  idraca: number;
  idcidade?: number;
  historia?: JSONContent | string;
  imagem?: string;
  galeriaImagem?: string[];
  costumes?: string[];
  nanites?: number;
  alinhamento?: string;
  tracos?: string[];
  inventarioJson?: any[];
  skills?: any[];
  magia?: any[];
  personagemsVinculados?: number[];
  tags?: string[];
  visivel: boolean;
  statusJson?: {
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

export interface PersonagemUpdatePayload {
  nome: string;
  idraca: number;
  idcidade?: number;
  historia?: JSONContent | string;
  imagem?: string;
  galeriaImagem?: string[];
  costumes?: string[];
  alinhamento?: string;
  tracos?: string[];
  nanites?: number;
  tags?: string[];
  visivel: boolean;
  statusJson?: {
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
  inventarioJson?: any[];
  skills?: any[];
  magia?: any[];
  personagemsVinculados?: number[];
}

export const getPersonagens = async (visivel?: boolean): Promise<PersonagemPayload[]> => {
  const params = visivel !== undefined ? { visivel } : {};
  const response = await api.get("/personagens", { params });
  return response.data;
};

export const salvarPersonagem = async (
  payload: PersonagemCreatePayload
): Promise<ResultPersonagem> => {
  const response = await api.post("/personagens", payload);
  return response.data;
};

export const getPersonagemById = async (id: string): Promise<ResultPersonagem | PersonagemPayload> => {
  const response = await api.get(`/personagens/${id}`);
  return response.data;
};

export const atualizarPersonagem = async (
  id: string,
  payload: PersonagemUpdatePayload
): Promise<ResultPersonagem> => {
  const response = await api.put(`/personagens/${id}`, payload);
  return response.data;
};