import api from '../axios/api';
import {
  CAMPOS_PERSONAGEM_VISIBILIDADE,
  criarVisibilidadePadrao,
  type CampoPersonagemVisibilidade,
  type PersonagemVisibilidade,
  type TipoPersonagemVisibilidade,
} from '../models/PersonagemVisibilidade';

type VisibilityResponse = Record<string, unknown>;

const isObjectRecord = (value: unknown): value is VisibilityResponse => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const toPascalCase = (value: string) => `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

/**
 * The API currently returns the DTO directly, but older development builds may
 * still return it inside `visibilidade`/`Visibilidade`. Normalising here keeps
 * the modal functional through that transition and guarantees every checkbox
 * always receives a boolean.
 */
const normalizarVisibilidade = (
  payload: unknown,
  tipo: TipoPersonagemVisibilidade,
): PersonagemVisibilidade => {
  if (!isObjectRecord(payload)) {
    throw new Error('A resposta da configuração de visibilidade é inválida.');
  }

  const nested = payload.visibilidade ?? payload.Visibilidade;
  const source = isObjectRecord(nested) ? nested : payload;
  const defaults = criarVisibilidadePadrao(tipo);

  return Object.keys(CAMPOS_PERSONAGEM_VISIBILIDADE).reduce<PersonagemVisibilidade>(
    (configuracao, campo) => {
      const typedField = campo as CampoPersonagemVisibilidade;
      const rawValue = source[typedField] ?? source[toPascalCase(typedField)];

      configuracao[typedField] = typeof rawValue === 'boolean'
        ? rawValue
        : defaults[typedField];
      return configuracao;
    },
    { ...defaults },
  );
};

const rotaVisibilidade = (tipo: TipoPersonagemVisibilidade, idPersonagem: number): string => (
  `/personagens-visibilidade/${tipo}/${idPersonagem}`
);

export const obterVisibilidadePersonagem = async (
  tipo: TipoPersonagemVisibilidade,
  idPersonagem: number,
): Promise<PersonagemVisibilidade> => {
  const response = await api.get<unknown>(rotaVisibilidade(tipo, idPersonagem));
  return normalizarVisibilidade(response.data, tipo);
};

export const atualizarVisibilidadePersonagem = async (
  tipo: TipoPersonagemVisibilidade,
  idPersonagem: number,
  visibilidade: PersonagemVisibilidade,
): Promise<PersonagemVisibilidade> => {
  const response = await api.put<unknown>(
    rotaVisibilidade(tipo, idPersonagem),
    visibilidade,
  );
  return normalizarVisibilidade(response.data, tipo);
};

const rotaVisibilidadeGeral = (
  tipo: TipoPersonagemVisibilidade,
  idPersonagem: number,
): string => (
  tipo === 'npc'
    ? `/personagens/${idPersonagem}/visivel`
    : `/PersonagemJogador/${idPersonagem}/visivel`
);

/**
 * Atualiza somente a exposição pública da ficha. Os 24 campos individuais
 * continuam sendo controlados por `atualizarVisibilidadePersonagem`.
 */
export const atualizarVisibilidadeGeralPersonagem = async (
  tipo: TipoPersonagemVisibilidade,
  idPersonagem: number,
  visivel: boolean,
): Promise<boolean> => {
  const response = await api.patch<unknown>(
    rotaVisibilidadeGeral(tipo, idPersonagem),
    { visivel },
  );

  if (!isObjectRecord(response.data)) {
    throw new Error('A resposta da atualização de visibilidade é inválida.');
  }

  const savedValue = response.data.visivel ?? response.data.Visivel;
  if (typeof savedValue !== 'boolean') {
    throw new Error('A resposta da atualização de visibilidade não informou o novo estado.');
  }

  return savedValue;
};
