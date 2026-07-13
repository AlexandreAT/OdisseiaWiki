import api from "../axios/api";
import {
  CreatePageWithBlocksDto,
  ResultPage,
  ResultPageComplete,
  ResultPages
} from "../models/Pages";

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
  visivel?: boolean
): Promise<ResultPages> => {
  const params = visivel !== undefined ? { visivel } : {};

  const response = await api.get("/pages", { params });

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

export const deletePage = async (
  id: number
): Promise<boolean> => {
  const response = await api.delete(`/pages/${id}`);

  return response.status === 204 || response.status === 200;
};

export const searchPages = async (termo: string) => {
  const response = await api.get("/pages/search", {
    params: { termo }
  });
  
  if (response.data.sucesso && response.data.pages) {
      const mappedPages = response.data.pages.map((page: any) => {
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
