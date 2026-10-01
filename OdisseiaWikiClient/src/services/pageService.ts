import api from "../axios/api";
import {
  CreatePageWithBlocksDto,
  PageDto,
  ResultPage,
  ResultPageComplete,
  ResultPages
} from "../models/Pages";
import { ServiceRequestOptions } from "./serviceRequestOptions";
import { getMesaWikiApiPath, getMesaWikiIdFromPath } from './wikiContext';

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
  const response = await api.post(getMesaWikiApiPath('pages', '/pages'), dto);
  return response.data;
};

export const updatePage = async (
  id: number,
  dto: CreatePageWithBlocksDto
): Promise<ResultPage> => {
  const response = await api.put(`${getMesaWikiApiPath('pages', '/pages')}/${id}`, dto);
  return response.data;
};

export const getPages = async (
  visivel?: boolean,
  requestOptions: ServiceRequestOptions = {},
  somenteProprias = false,
): Promise<ResultPages> => {
  const params = {
    ...(visivel !== undefined ? { visivel } : {}),
    ...(getMesaWikiIdFromPath() && somenteProprias ? { proprias: true } : {}),
  };

  const response = await api.get(getMesaWikiApiPath('pages', '/pages'), { params, ...requestOptions });
  return getMesaWikiIdFromPath() ? { sucesso: true, pages: response.data } : response.data;
};

export const getPageBySlug = async (
  slug: string
): Promise<ResultPage> => {
  const response = await api.get(`${getMesaWikiApiPath('pages', '/pages')}/${slug}`);
  return getMesaWikiIdFromPath() ? { sucesso: true, page: response.data } : response.data;
};

export const getPageById = async (
  id: number
): Promise<ResultPageComplete> => {
  if (getMesaWikiIdFromPath()) {
    const page = (await api.get(`${getMesaWikiApiPath('pages', '/pages')}/id/${id}`)).data;
    return page ? { sucesso: true, page } : { sucesso: false, mensagemErro: 'Página não encontrada.' };
  }
  const response = await api.get(`/pages/id/${id}`);
  return response.data;
};

export const getPagesByIds = async (
  ids: Array<string | number>
): Promise<PageDto[]> => {
  const normalizedIds = new Set(
    ids
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0)
  );

  if (normalizedIds.size === 0) return [];

  const result = await getPages();
  return (result.pages ?? []).filter(
    (page) => page.idPage !== undefined && normalizedIds.has(page.idPage)
  );
};

export const getPagesReferencingEntity = async (
  entityType: 'Cidade' | 'Personagem' | 'Item' | 'Raca' | 'Page',
  entityId: number | string,
  requestOptions: ServiceRequestOptions = {}
): Promise<ResultPages> => {
  if (getMesaWikiIdFromPath()) {
    return {
      sucesso: true,
      pages: (await api.get(
        `${getMesaWikiApiPath('pages', '/pages')}/referencing/${encodeURIComponent(entityType)}/${encodeURIComponent(String(entityId))}`,
        requestOptions,
      )).data,
    };

  }
  const response = await api.get(`/pages/referencing/${encodeURIComponent(entityType)}/${encodeURIComponent(String(entityId))}`, requestOptions);
  return response.data;
};

export const deletePage = async (
  id: number
): Promise<boolean> => {
  const response = await api.delete(`${getMesaWikiApiPath('pages', '/pages')}/${id}`);

  return response.status === 204 || response.status === 200;
};

export const searchPages = async (
  termo: string,
  requestOptions: ServiceRequestOptions = {},
  somenteProprias = false,
): Promise<ResultPages> => {
  if (getMesaWikiIdFromPath()) {
    const result = await getPages(true, requestOptions, somenteProprias);
    const normalized = termo.trim().toLocaleLowerCase('pt-BR');
    return { sucesso: true, pages: (result.pages ?? []).filter((page) => `${page.titulo} ${page.descricao ?? ''}`.toLocaleLowerCase('pt-BR').includes(normalized)) };
  }
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
