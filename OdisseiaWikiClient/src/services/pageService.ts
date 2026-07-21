import api from "../axios/api";
import {
  CreatePageWithBlocksDto,
  ResultPage,
  ResultPageComplete,
  ResultPages
} from "../models/Pages";
import { ServiceRequestOptions } from "./serviceRequestOptions";

interface PageSearchApiItem {
  id: number;
  nome: string;
  slug: string;
  imagem?: string;
  visivel: boolean;
  destaque?: boolean;
  tags?: string;
}

export const createPage = async (
  dto: CreatePageWithBlocksDto
): Promise<ResultPage> => {
  const response = await api.post("/pages", dto);
  return response.data;
};

export const updatePage = async (
  id: number,
  dto: CreatePageWithBlocksDto
): Promise<ResultPage> => {
  const response = await api.put(`/pages/${id}`, dto);
  return response.data;
};

export const getPages = async (
  visivel?: boolean,
  requestOptions: ServiceRequestOptions = {}
): Promise<ResultPages> => {
  const params = visivel !== undefined ? { visivel } : {};

  const response = await api.get("/pages", { params, ...requestOptions });

  return response.data;
};

export const getPageBySlug = async (
  slug: string
): Promise<ResultPage> => {
  const response = await api.get(`/pages/${slug}`);
  return response.data;
};

export const getPageById = async (
  id: number
): Promise<ResultPageComplete> => {
  const response = await api.get(`/pages/id/${id}`);
  return response.data;
};

export const getPagesReferencingEntity = async (
  entityType: 'Cidade' | 'Personagem' | 'Item' | 'Raca',
  entityId: number | string,
  requestOptions: ServiceRequestOptions = {}
): Promise<ResultPages> => {
  const response = await api.get(
    `/pages/referencing/${encodeURIComponent(entityType)}/${encodeURIComponent(String(entityId))}`,
    requestOptions
  );
  return response.data;
};

export const deletePage = async (
  id: number
): Promise<boolean> => {
  const response = await api.delete(`/pages/${id}`);

  return response.status === 204 || response.status === 200;
};

export const searchPages = async (
  termo: string,
  requestOptions: ServiceRequestOptions = {}
): Promise<ResultPages> => {
  const response = await api.get("/pages/search", {
    params: { termo },
    ...requestOptions
  });
  
  if (response.data.sucesso && response.data.pages) {
      const mappedPages = (response.data.pages as PageSearchApiItem[]).map((page) => {
        return {
        idPage: page.id,
        titulo: page.nome,
        slug: page.slug,
        coverImage: page.imagem,
        visivel: page.visivel,
        destaque: page.destaque,
        descricao: page.tags
      };
    });
    
    return {
      ...response.data,
      pages: mappedPages
    };
  }
  
  return response.data;
};
