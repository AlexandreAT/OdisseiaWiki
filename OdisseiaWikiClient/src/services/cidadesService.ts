import api from "../axios/api";
import { JSONContent } from "../models/Cities";
import { PontoDeInteresse } from "../models/InfoLore";
import { ServiceRequestOptions } from './serviceRequestOptions';

export interface CidadePayload {
  idcidade: number;
  nome: string;
  descricao?: string;
  imagem?: string;
  galeriaImagem?: string[];
  tags?: string[];
  pontosDeInteresse?: PontoDeInteresse[];
  visivel: boolean;
  destaque?: boolean;
  dataCriacao?: string;
}

export interface CreateCidadeDto {
  Nome: string;
  Descricao?: JSONContent | string;
  Imagem: string;
  GaleriaImagem?: string[];
  Tags?: string[];
  PontosDeInteresse?: PontoDeInteresse[];
  Visivel: boolean;
  Destaque?: boolean;
}

export interface ResultCidades {
  sucesso: boolean;
  mensagemErro?: string;
  cidades?: CidadePayload[];
}

export interface ResultCreateCidade {
  sucesso: boolean;
  mensagemErro?: string;
  cidade?: CidadePayload;
}

export const getCidades = async (
  visivel?: boolean,
  requestOptions: ServiceRequestOptions = {}
): Promise<ResultCidades> => {
  const params = visivel !== undefined ? { visivel } : {};
  const response = await api.get("/cidades", { params, ...requestOptions });
  return response.data;
};

export const createCidade = async (dto: CreateCidadeDto): Promise<ResultCreateCidade> => {
  const response = await api.post("/cidades", dto);
  return response.data;
};

export const getCidadeById = async (id: number): Promise<ResultCreateCidade> => {
  const response = await api.get(`/cidades/${id}`);
  return response.data;
};

export const getCidadesByIds = async (ids: number[]): Promise<CidadePayload[]> => {
  const response = await api.post(`/cidades/batch`, { ids });
  return response.data;
};

export const updateCidade = async (id: number, dto: CreateCidadeDto): Promise<ResultCreateCidade> => {
  const response = await api.put(`/cidades/${id}`, dto);
  return response.data;
};

export const deleteCidade = async (id: number): Promise<boolean> => {
  const response = await api.delete(`/cidades/${id}`);
  return response.status === 204 || response.status === 200;
};
