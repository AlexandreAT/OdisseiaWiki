import api from "../axios/api";
import { ServiceRequestOptions } from './serviceRequestOptions';
import { GalleryImage } from '../models/GalleryImage';
import { JSONContent } from '../models/Cities';
import type { SistemaRuntimeContexto } from '../models/SistemaRpg';
import { getMesaWikiApiPath, getMesaWikiApiPathForMesa, getMesaWikiIdFromPath } from './wikiContext';

export interface StatusBase {
  vida: number;
  vidaMaxima?: number;
  estamina: number;
  estaminaMaxima?: number;
  mana: number;
  manaMaxima?: number;
  capacidadeCarga: number;
}

export interface RacaStatus {
  status: StatusBase;
  atributoInicial: string;
  passivas: RacaPassiva[];
}

export interface RacaPassiva {
  idpassiva?: number;
  nome: string;
  efeito?: string;
}

export interface RacaVariacao {
  nome: string;
  descricao?: string;
  efeito?: string;
  imagem?: string;
}

export type RacaCharacterStatusDefaults = Required<StatusBase>;

export interface RacaPayload {
  idraca: number;
  nome: string;
  statusJson: RacaStatus;
  descricao?: JSONContent | string;
  imagem?: string;
  galeriaImagem?: GalleryImage[];
  variacoes?: RacaVariacao[];
  tags?: string[];
  visivel: boolean;
  destaque?: boolean;
  dataCriacao?: string;
  idSistemaRpg?: number | null;
  idSistemaVersao?: number | null;
  acompanharPublicacaoAtual?: boolean;
  sistemaRuntime?: SistemaRuntimeContexto | null;
}

export interface CreateRacaDto {
  Nome: string;
  StatusJson?: RacaStatus;
  Descricao?: JSONContent | string | null;
  Imagem?: string;
  GaleriaImagem?: GalleryImage[];
  Variacoes?: RacaVariacao[];
  Tags?: string[];
  Visivel: boolean;
  Destaque?: boolean;
  IdSistemaRpg?: number | null;
  IdSistemaVersao?: number | null;
  AcompanharPublicacaoAtual?: boolean;
}

export interface ResultRacas {
  sucesso: boolean;
  mensagemErro?: string;
  racas?: RacaPayload[];
}

export interface ResultRaca {
  sucesso: boolean;
  mensagemErro?: string;
  raca?: RacaPayload;
}

const normalizeRacaPassivas = (value: unknown): RacaPassiva[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (typeof item === 'string') {
      const nome = item.trim();
      return nome ? [{ nome }] : [];
    }

    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const passiva = item as Record<string, unknown>;
    const idpassiva = Number(passiva.idpassiva ?? passiva.idPassiva ?? passiva.Idpassiva ?? passiva.IdPassiva) || undefined;
    const nome = String(passiva.nome ?? passiva.Nome ?? '').trim();
    const efeito = String(passiva.efeito ?? passiva.Efeito ?? passiva.descricao ?? passiva.Descricao ?? '').trim();
    if (!nome && !efeito) return [];

    return [{ ...(idpassiva ? { idpassiva } : {}), nome, ...(efeito ? { efeito } : {}) }];
  });
};

export const normalizeRacaVariacoes = (value: unknown): RacaVariacao[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (typeof item === 'string') {
      const nome = item.trim();
      return nome ? [{ nome }] : [];
    }

    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const variacao = item as Record<string, unknown>;
    const nome = String(variacao.nome ?? variacao.Nome ?? '').trim();
    const descricao = String(variacao.descricao ?? variacao.Descricao ?? '').trim();
    const efeito = String(variacao.efeito ?? variacao.Efeito ?? '').trim();
    const imagem = String(variacao.imagem ?? variacao.Imagem ?? '').trim();
    if (!nome && !descricao && !efeito && !imagem) return [];

    return [{
      nome,
      ...(descricao ? { descricao } : {}),
      ...(efeito ? { efeito } : {}),
      ...(imagem ? { imagem } : {}),
    }];
  });
};

export const normalizeRacaStatus = (value: unknown): RacaStatus | null => {
  if (value === undefined || value === null) return null;

  let parsedValue = value;
  while (typeof parsedValue === 'string') {
    try {
      parsedValue = JSON.parse(parsedValue);
    } catch {
      return null;
    }
  }

  if (typeof parsedValue !== 'object' || Array.isArray(parsedValue)) return null;

  const raceValue = parsedValue as Record<string, unknown>;
  const embeddedStatus = raceValue.status ?? raceValue.Status;
  if (typeof embeddedStatus !== 'object' || embeddedStatus === null || Array.isArray(embeddedStatus)) return null;

  const statusValue = embeddedStatus as Record<string, unknown>;
  const toNumber = (field: string) => {
    const numberValue = Number(statusValue[field] ?? 0);
    return Number.isFinite(numberValue) ? numberValue : 0;
  };

  return {
    status: {
      vida: toNumber('vida') || toNumber('Vida'),
      vidaMaxima: toNumber('vidaMaxima') || toNumber('VidaMaxima'),
      estamina: toNumber('estamina') || toNumber('Estamina'),
      estaminaMaxima: toNumber('estaminaMaxima') || toNumber('EstaminaMaxima'),
      mana: toNumber('mana') || toNumber('Mana'),
      manaMaxima: toNumber('manaMaxima') || toNumber('ManaMaxima'),
      capacidadeCarga: toNumber('capacidadeCarga') || toNumber('CapacidadeCarga'),
    },
    atributoInicial: String(raceValue.atributoInicial ?? raceValue.AtributoInicial ?? ''),
    passivas: normalizeRacaPassivas(raceValue.passivas ?? raceValue.Passivas),
  };
};

export const resolveRacaCharacterStatus = (value: unknown): RacaCharacterStatusDefaults | null => {
  const raceStatus = normalizeRacaStatus(value);
  if (!raceStatus) return null;

  const resolveInitialValue = (baseValue: number, maximumValue?: number) => {
    const normalizedBase = Number.isFinite(baseValue) ? Math.max(0, baseValue) : 0;
    const normalizedMaximum = Number(maximumValue);
    return Number.isFinite(normalizedMaximum) && normalizedMaximum > 0
      ? normalizedMaximum
      : normalizedBase;
  };

  const vida = resolveInitialValue(raceStatus.status.vida, raceStatus.status.vidaMaxima);
  const estamina = resolveInitialValue(raceStatus.status.estamina, raceStatus.status.estaminaMaxima);
  const mana = resolveInitialValue(raceStatus.status.mana, raceStatus.status.manaMaxima);

  return {
    vida,
    vidaMaxima: vida,
    estamina,
    estaminaMaxima: estamina,
    mana,
    manaMaxima: mana,
    capacidadeCarga: Math.max(0, Number(raceStatus.status.capacidadeCarga) || 0),
  };
};

// READ
export const getRacas = async (
  visivel?: boolean,
  idMesa?: number,
  requestOptions: ServiceRequestOptions = {},
  somenteProprias = false,
): Promise<ResultRacas> => {
  const params = {
    ...(visivel !== undefined ? { visivel } : {}),
    ...(getMesaWikiIdFromPath() && somenteProprias ? { proprias: true } : {}),
  };
  if (idMesa !== undefined && !getMesaWikiIdFromPath()) {
    const response = await api.get(getMesaWikiApiPathForMesa(idMesa, 'racas'), { params, ...requestOptions });
    return { sucesso: true, racas: response.data };
  }

  const response = await api.get(getMesaWikiApiPath('racas', '/racas'), { params, ...requestOptions });
  return getMesaWikiIdFromPath() ? { sucesso: true, racas: response.data } : response.data;
};

export const getRacaById = async (id: number, idMesa?: number): Promise<ResultRaca | RacaPayload> => {
  if (idMesa !== undefined && !getMesaWikiIdFromPath()) {
    const response = await api.get(`${getMesaWikiApiPathForMesa(idMesa, 'racas')}/${id}`);
    return { sucesso: true, raca: response.data };
  }
  const response = await api.get(`${getMesaWikiApiPath('racas', '/racas')}/${id}`, {
    params: idMesa !== undefined ? { idMesa } : {},
  });
  return getMesaWikiIdFromPath() ? { sucesso: true, raca: response.data } : response.data;
};

export const getRacasByIds = async (ids: number[]): Promise<RacaPayload[]> => {
  if (getMesaWikiIdFromPath()) {
    const racas = await getRacas();
    return (racas.racas ?? []).filter((raca) => ids.includes(raca.idraca));
  }
  const response = await api.post(`/racas/batch`, { ids });
  return response.data;
};

// CREATE
export const createRaca = async (dto: CreateRacaDto): Promise<ResultRaca> => {
  const response = await api.post(getMesaWikiApiPath('racas', '/racas'), dto);
  return response.data;
};

// UPDATE
export const updateRaca = async (id: number, dto: CreateRacaDto): Promise<ResultRaca> => {
  const response = await api.put(`${getMesaWikiApiPath('racas', '/racas')}/${id}`, dto);
  return response.data;
};

// DELETE
export const deleteRaca = async (id: number): Promise<boolean> => {
  const response = await api.delete(`${getMesaWikiApiPath('racas', '/racas')}/${id}`);
  return response.status === 204 || response.status === 200;
};
