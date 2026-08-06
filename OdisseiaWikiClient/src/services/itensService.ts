import api from "../axios/api";
import { JSONContent } from "../models/Itens";
import { ServiceRequestOptions } from './serviceRequestOptions';
import type { SistemaRuntimeContexto, SistemaRuntimeWarning } from '../models/SistemaRpg';

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
  requestOptions: ServiceRequestOptions = {}
): Promise<ItemPayload[]> => {
  const response = await api.get("/item", requestOptions);
  return response.data;
};

export const getItemById = async (id: string): Promise<ItemPayload> => {
  const response = await api.get(`/item/${id}`);
  return response.data;
};

export const getItensByIds = async (ids: Array<string | number>): Promise<ItemPayload[]> => {
  const response = await api.post(`/item/batch`, { ids });
  return response.data;
};

export const salvarItem = async (
  payload: ItemPayload
): Promise<ResultItem> => {
  const response = await api.post("/item", payload);
  return response.data;
};

export const atualizarItem = async (
  id: string,
  payload: ItemPayload
): Promise<ResultItem> => {
  const response = await api.put(`/item/${id}`, payload);
  return response.data;
};

export const excluirItem = async (id: string): Promise<boolean> => {
  const response = await api.delete(`/item/${id}`);
  return response.status === 204;
};
