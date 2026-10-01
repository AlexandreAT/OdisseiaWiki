import api from "../axios/api";
import { JSONContent } from "../models/Itens";
import { ServiceRequestOptions } from './serviceRequestOptions';
import type { SistemaRuntimeContexto, SistemaRuntimeWarning } from '../models/SistemaRpg';
import { getMesaWikiApiPath, getMesaWikiApiPathForMesa, getMesaWikiIdFromPath } from './wikiContext';

export interface ItemPayload {
  iditem?: string;
  nome: string;
  tipo: string;
  descricao?: string | JSONContent;
  peso?: number;
  discricao?: number;
  quantidade: number;
  efeito?: string;
  imagem?: string;
  atributosJson?: string | Record<string, any>;
  iditemBase?: string;
  idpersonagem?: number;
  tags?: string[];
  visivel?: boolean;
  destaque?: boolean;
  dataCriacao?: string;
  aplicaTeste?: boolean;
  idSistemaRpg?: number | null;
  idSistemaVersao?: number | null;
  acompanharPublicacaoAtual?: boolean;
  sistemaRuntime?: SistemaRuntimeContexto | null;
}

export interface ResultItem {
  sucesso: boolean;
  id?: string;
  mensagemErro?: string;
  item?: ItemPayload;
  sistemaRuntime?: SistemaRuntimeContexto | null;
  warnings?: SistemaRuntimeWarning[];
}

export const getItens = async (
  requestOptions: ServiceRequestOptions = {},
  somenteProprios = false,
): Promise<ItemPayload[]> => {
  const params = getMesaWikiIdFromPath() && somenteProprios ? { proprios: true } : undefined;
  const response = await api.get(getMesaWikiApiPath('itens', '/item'), { params, ...requestOptions });
  return response.data;
};

export const getItensDaMesa = async (
  idMesa: number,
  requestOptions: ServiceRequestOptions = {},
): Promise<ItemPayload[]> => {
  const response = await api.get(getMesaWikiApiPathForMesa(idMesa, 'itens'), {
    params: { visivel: true },
    ...requestOptions,
  });
  return response.data;
};

export const getItemById = async (id: string): Promise<ItemPayload> => {
  const response = await api.get(`${getMesaWikiApiPath('itens', '/item')}/${id}`);
  return response.data;
};

export const getItensByIds = async (ids: Array<string | number>): Promise<ItemPayload[]> => {
  if (getMesaWikiIdFromPath()) {
    const itens = await getItens();
    return itens.filter((item) => item.iditem && ids.map(String).includes(item.iditem));
  }
  const response = await api.post(`/item/batch`, { ids });
  return response.data;
};

export const salvarItem = async (
  payload: ItemPayload
): Promise<ResultItem> => {
  const response = await api.post(getMesaWikiApiPath('itens', '/item'), payload);
  return response.data;
};

export const atualizarItem = async (
  id: string,
  payload: ItemPayload
): Promise<ResultItem> => {
  const response = await api.put(`${getMesaWikiApiPath('itens', '/item')}/${id}`, payload);
  return response.data;
};

export const excluirItem = async (id: string): Promise<boolean> => {
  const response = await api.delete(`${getMesaWikiApiPath('itens', '/item')}/${id}`);
  return response.status === 204;
};
