import api from "../axios/api";
import { JSONContent } from "../models/Characters";
import { ServiceRequestOptions } from './serviceRequestOptions';

export interface InfoLoreDto {
  idinfoLore?: number;
  titulo: string;
  descricao?: JSONContent | string;
  imagem?: string;
  ordem?: number;
  tags?: string[];
  visivel: boolean;
  destaque?: boolean;
}

export interface SearchResultItem {
  id?: number;
  idString?: string;
  nome: string;
  imagem?: string;
  tags?: string[];
  visivel: boolean;
  destaque?: boolean;
  slug?: string;
  tipoEntidade: "Cidade" | "Personagem" | "Item" | "InfoLore" | "Raca" | "Page";
}

export interface GlobalSearchResultDto {
  cidades: SearchResultItem[];
  personagens: SearchResultItem[];
  itens: SearchResultItem[];
  infoLores: SearchResultItem[];
  racas: SearchResultItem[];
  pages: SearchResultItem[];
  totalResultados: number;
}

export interface ResultInfoLore {
  sucesso: boolean;
  mensagemErro?: string;
  infoLore?: InfoLoreDto;
}

export interface ResultInfoLores {
  sucesso: boolean;
  mensagemErro?: string;
  infoLores?: InfoLoreDto[];
}

const normalizeCategorySearchTerm = (term: string): string => (
  term
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
);

const pageCategoryTerms = new Set(['page', 'pages', 'pagina', 'paginas']);

// Busca Global
export const globalSearch = async (
  termo: string,
  requestOptions: ServiceRequestOptions = {},
): Promise<GlobalSearchResultDto> => {
  const normalizedCategoryTerm = normalizeCategorySearchTerm(termo);
  const requestTerm = pageCategoryTerms.has(normalizedCategoryTerm)
    ? normalizedCategoryTerm
    : termo.trim();

  const response = await api.get("/infolore/search/management", {
    params: { termo: requestTerm },
    ...requestOptions,
  });
  return response.data;
};

// CRUD InfoLore
export const getInfoLores = async (visivel?: boolean): Promise<ResultInfoLores> => {
  const params = visivel !== undefined ? { visivel } : {};
  const response = await api.get("/infolore", { params });
  return response.data;
};

export const getInfoLoreById = async (id: number): Promise<InfoLoreDto> => {
  const response = await api.get(`/infolore/${id}`);
  return response.data;
};

export const createInfoLore = async (dto: InfoLoreDto): Promise<ResultInfoLore> => {
  const response = await api.post("/infolore", dto);
  return response.data;
};

export const updateInfoLore = async (id: number, dto: InfoLoreDto): Promise<ResultInfoLore> => {
  const response = await api.put(`/infolore/${id}`, dto);
  return response.data;
};

export const deleteInfoLore = async (id: number): Promise<boolean> => {
  const response = await api.delete(`/infolore/${id}`);
  return response.status === 204 || response.status === 200;
};
