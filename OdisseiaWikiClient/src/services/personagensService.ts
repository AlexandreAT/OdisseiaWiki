import { Principais, Secundarios, JSONContent } from './../models/Characters';
import api from "../axios/api";
import { ServiceRequestOptions } from './serviceRequestOptions';
import { GalleryImage } from '../models/GalleryImage';

export interface PersonagemPayload {
  idpersonagem: string;
  nome: string;
  idraca: number;
  idcidade: number;
  historia?: JSONContent | string;
  imagem?: string;
  galeriaImagem?: GalleryImage[];
  costumes: string[];
  nanites?: number;
  alinhamento?: string;
  tracos: string[];
  inventarioJson: any[];
  skills: any[];
  magia: any[];
  idpassiva?: number;
  ultimate?: string;
  personagemsVinculados: string[];
  tags?: string[];
  visivel: boolean;
  destaque?: boolean;
  dataCriacao: string;
  statusJson: {
    status: {
      vida: number;
      vidaMaxima: number;
      estamina: number;
      estaminaMaxima: number;
      mana: number;
      manaMaxima: number;
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
  galeriaImagem?: GalleryImage[];
  costumes?: string[];
  nanites?: number;
  alinhamento?: string;
  tracos?: string[];
  inventarioJson?: any[];
  skills?: any[];
  magia?: any[];
  idpassiva?: number;
  ultimate?: string;
  personagemsVinculados?: number[];
  tags?: string[];
  visivel: boolean;
  destaque?: boolean;
  statusJson?: {
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

export interface PersonagemUpdatePayload {
  nome: string;
  idraca: number;
  idcidade?: number;
  historia?: JSONContent | string;
  imagem?: string;
  galeriaImagem?: GalleryImage[];
  costumes?: string[];
  alinhamento?: string;
  tracos?: string[];
  nanites?: number;
  tags?: string[];
  visivel: boolean;
  destaque?: boolean;
  idpassiva?: number;
  ultimate?: string;
  statusJson?: {
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
  inventarioJson?: any[];
  skills?: any[];
  magia?: any[];
  personagemsVinculados?: number[];
}

export const getPersonagens = async (
  visivel?: boolean,
  requestOptions: ServiceRequestOptions = {}
): Promise<PersonagemPayload[]> => {
  const params = visivel !== undefined ? { visivel } : {};
  const response = await api.get("/personagens", { params, ...requestOptions });
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

export const getPersonagensByIds = async (ids: Array<string | number>): Promise<PersonagemPayload[]> => {
  const response = await api.post(`/personagens/batch`, { ids });
  return response.data;
};

export const atualizarPersonagem = async (
  id: string,
  payload: PersonagemUpdatePayload
): Promise<ResultPersonagem> => {
  const response = await api.put(`/personagens/${id}`, payload);
  return response.data;
};

export const deletePersonagem = async (id: string): Promise<boolean> => {
  const response = await api.delete(`/personagens/${id}`);
  return response.status === 204 || response.status === 200;
};
