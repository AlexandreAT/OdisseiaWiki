import { Principais, Secundarios, JSONContent } from './../models/Characters';
import api from "../axios/api";
import { ServiceRequestOptions } from './serviceRequestOptions';
import { GalleryImage } from '../models/GalleryImage';
import type { PersonagemVisibilidade } from '../models/PersonagemVisibilidade';
import type { PersonagemVariante } from '../models/Characters';
import type { SistemaRuntimeContexto, SistemaRuntimeWarning } from '../models/SistemaRpg';
import { getMesaWikiApiPath, getMesaWikiApiPathForMesa, getMesaWikiIdFromPath } from './wikiContext';

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
  quantidadeRelacionadosOcultos?: number;
  tags?: string[];
  visivel: boolean;
  destaque?: boolean;
  dataCriacao: string;
  idSistemaRpg?: number | null;
  idSistemaVersao?: number | null;
  acompanharPublicacaoAtual?: boolean;
  sistemaRuntime?: SistemaRuntimeContexto | null;
  visibilidade?: PersonagemVisibilidade;
  statusJson: {
    generico?: boolean;
    variantes?: PersonagemVariante[];
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
  sistemaRuntime?: SistemaRuntimeContexto | null;
  warnings?: SistemaRuntimeWarning[];
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
  visibilidadeInicial?: PersonagemVisibilidade;
  destaque?: boolean;
  idSistemaRpg?: number | null;
  idSistemaVersao?: number | null;
  acompanharPublicacaoAtual?: boolean;
  statusJson?: {
    generico?: boolean;
    variantes?: PersonagemVariante[];
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
  idSistemaRpg?: number | null;
  idSistemaVersao?: number | null;
  acompanharPublicacaoAtual?: boolean;
  idpassiva?: number;
  ultimate?: string;
  statusJson?: {
    generico?: boolean;
    variantes?: PersonagemVariante[];
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
  requestOptions: ServiceRequestOptions = {},
  somenteProprios = false,
): Promise<PersonagemPayload[]> => {
  const params = {
    ...(visivel !== undefined ? { visivel } : {}),
    ...(getMesaWikiIdFromPath() && somenteProprios ? { proprios: true } : {}),
  };
  const response = await api.get(getMesaWikiApiPath('personagens', '/personagens'), { params, ...requestOptions });
  return response.data;
};

export const getPersonagensDaMesa = async (
  idMesa: number,
  requestOptions: ServiceRequestOptions = {},
): Promise<PersonagemPayload[]> => {
  const response = await api.get(getMesaWikiApiPathForMesa(idMesa, 'personagens'), {
    params: { visivel: true },
    ...requestOptions,
  });
  return response.data;
};

export const salvarPersonagem = async (
  payload: PersonagemCreatePayload
): Promise<ResultPersonagem> => {
  const response = await api.post(getMesaWikiApiPath('personagens', '/personagens'), payload);
  return response.data;
};

export const getPersonagemById = async (id: string): Promise<ResultPersonagem | PersonagemPayload> => {
  const response = await api.get(`${getMesaWikiApiPath('personagens', '/personagens')}/${id}`);
  return response.data;
};

export const getPersonagemForClone = async (
  id: string,
  sourceMesaId?: number,
): Promise<ResultPersonagem | PersonagemPayload> => {
  const endpoint = sourceMesaId
    ? `${getMesaWikiApiPathForMesa(sourceMesaId, 'personagens')}/${id}`
    : `/personagens/${id}`;
  const response = await api.get(endpoint);
  return response.data;
};

export const getPersonagensByIds = async (ids: Array<string | number>, idMesa?: number): Promise<PersonagemPayload[]> => {
  const idsSelecionados = new Set(ids.map(String));
  if (idMesa) {
    const personagens = (await api.get(getMesaWikiApiPathForMesa(idMesa, 'personagens'))).data as PersonagemPayload[];
    return personagens.filter((personagem) => idsSelecionados.has(String(personagem.idpersonagem)));
  }
  if (getMesaWikiIdFromPath()) {
    const personagens = await getPersonagens();
    return personagens.filter((personagem) => idsSelecionados.has(String(personagem.idpersonagem)));
  }
  const response = await api.post(`/personagens/batch`, { ids });
  return response.data;
};

export const atualizarPersonagem = async (
  id: string,
  payload: PersonagemUpdatePayload
): Promise<ResultPersonagem> => {
  const response = await api.put(`${getMesaWikiApiPath('personagens', '/personagens')}/${id}`, payload);
  return response.data;
};

export const deletePersonagem = async (id: string): Promise<boolean> => {
  const response = await api.delete(`${getMesaWikiApiPath('personagens', '/personagens')}/${id}`);
  return response.status === 204 || response.status === 200;
};
