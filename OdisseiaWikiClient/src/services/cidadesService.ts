import api from "../axios/api";
import { JSONContent, PontoDeInteresse } from "../models/Cities";
import { GalleryImage, normalizeGalleryImages } from '../models/GalleryImage';
import { ServiceRequestOptions } from './serviceRequestOptions';
import { getMesaWikiApiPath, getMesaWikiApiPathForMesa, getMesaWikiIdFromPath } from './wikiContext';

export interface CidadePayload {
  idcidade: number;
  nome: string;
  descricao?: JSONContent | string;
  imagem?: string;
  galeriaImagem?: GalleryImage[];
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
  GaleriaImagem?: GalleryImage[];
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

interface RawCidadePayload extends Omit<CidadePayload, 'galeriaImagem' | 'tags' | 'pontosDeInteresse'> {
  galeriaImagem?: GalleryImage[] | string[] | string;
  tags?: string[] | string;
  pontosDeInteresse?: PontoDeInteresse[] | string;
}

const parseList = <T>(value: T[] | string | undefined): T[] | undefined => {
  if (Array.isArray(value)) return value;
  if (!value?.trim()) return undefined;

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as T[] : undefined;
  } catch {
    return undefined;
  }
};

const parsePontosDeInteresse = (
  value: PontoDeInteresse[] | string | undefined
): PontoDeInteresse[] | undefined => {
  const parsed = parseList<unknown>(value as unknown[] | string | undefined);
  if (!parsed) return undefined;

  const normalized = parsed.flatMap((point) => {
    if (!point || typeof point !== 'object') return [];

    const record = point as Record<string, unknown>;
    const nameValue = record.nome ?? record.Nome ?? record.titulo ?? record.Titulo;
    const descriptionValue = record.descricao ?? record.Descricao;
    const imageValue = record.imagem ?? record.Imagem;
    const nome = typeof nameValue === 'string' ? nameValue.trim() : '';
    const descricao = typeof descriptionValue === 'string' ? descriptionValue.trim() : '';
    const imagem = typeof imageValue === 'string' ? imageValue.trim() : '';

    if (!nome) return [];

    return [{
      nome,
      ...(descricao ? { descricao } : {}),
      ...(imagem ? { imagem } : {}),
    } satisfies PontoDeInteresse];
  });

  return normalized.length > 0 ? normalized : undefined;
};

export const getCidades = async (
  visivel?: boolean,
  requestOptions: ServiceRequestOptions = {},
  somenteProprias = false,
): Promise<ResultCidades> => {
  const params = {
    ...(visivel !== undefined ? { visivel } : {}),
    ...(getMesaWikiIdFromPath() && somenteProprias ? { proprias: true } : {}),
  };
  const response = await api.get(getMesaWikiApiPath('cidades', '/cidades'), { params, ...requestOptions });
  return getMesaWikiIdFromPath() ? { sucesso: true, cidades: response.data } : response.data;
};

export const getCidadesDaMesa = async (
  idMesa: number,
  visivel = true,
  requestOptions: ServiceRequestOptions = {},
): Promise<ResultCidades> => {
  const response = await api.get(getMesaWikiApiPathForMesa(idMesa, 'cidades'), {
    params: { visivel },
    ...requestOptions,
  });
  return { sucesso: true, cidades: response.data };
};

export const createCidade = async (dto: CreateCidadeDto): Promise<ResultCreateCidade> => {
  const response = await api.post(getMesaWikiApiPath('cidades', '/cidades'), dto);
  return response.data;
};

export const getCidadeById = async (id: number, idMesa?: number): Promise<CidadePayload> => {
  const endpoint = idMesa
    ? getMesaWikiApiPathForMesa(idMesa, 'cidades')
    : getMesaWikiApiPath('cidades', '/cidades');
  const response = await api.get(`${endpoint}/${id}`);
  const city = response.data as RawCidadePayload;

  return {
    ...city,
    galeriaImagem: normalizeGalleryImages(city.galeriaImagem),
    tags: parseList(city.tags),
    pontosDeInteresse: parsePontosDeInteresse(city.pontosDeInteresse),
  };
};

export const getCidadesByIds = async (ids: number[]): Promise<CidadePayload[]> => {
  if (getMesaWikiIdFromPath()) {
    const cidades = await getCidades();
    return (cidades.cidades ?? []).filter((cidade) => ids.includes(cidade.idcidade));
  }
  const response = await api.post(`/cidades/batch`, { ids });
  return response.data;
};

export const updateCidade = async (id: number, dto: CreateCidadeDto): Promise<ResultCreateCidade> => {
  const response = await api.put(`${getMesaWikiApiPath('cidades', '/cidades')}/${id}`, dto);
  return response.data;
};

export const deleteCidade = async (id: number): Promise<boolean> => {
  const response = await api.delete(`${getMesaWikiApiPath('cidades', '/cidades')}/${id}`);
  return response.status === 204 || response.status === 200;
};
