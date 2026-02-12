import api from "../axios/api";
import { JSONContent } from "../models/Cities";
import { PontoDeInteresse } from "../models/InfoLore";

export interface CidadePayload {
  idcidade: number;
  nome: string;
  descricao?: string;
  imagem?: string;
  galeriaImagem?: string[];
  tags?: string[];
  pontosDeInteresse?: PontoDeInteresse[];
  visivel: boolean;
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

export const getCidades = async (visivel?: boolean): Promise<ResultCidades> => {
  const params = visivel !== undefined ? { visivel } : {};
  const response = await api.get("/cidades", { params });
  return response.data;
};

export const createCidade = async (dto: CreateCidadeDto): Promise<ResultCreateCidade> => {
  const response = await api.post("/cidades", dto);
  return response.data;
};