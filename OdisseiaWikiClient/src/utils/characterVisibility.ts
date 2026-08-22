import {
  CampoPersonagemVisibilidade,
  PersonagemVisibilidade,
} from '../models/PersonagemVisibilidade';

/** Copy used consistently by public character surfaces when the API deliberately removes a value. */
export const CHARACTER_INFORMATION_BLOCKED = 'Informação bloqueada';

export type CamposOcultosProjetados = Partial<Record<CampoPersonagemVisibilidade, boolean>>;

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const readCaseInsensitive = (source: unknown, ...keys: string[]) => {
  if (!isRecord(source)) return undefined;
  const match = Object.keys(source).find((key) => keys.some((expected) => (
    key.toLocaleLowerCase('pt-BR') === expected.toLocaleLowerCase('pt-BR')
  )));
  return match ? source[match] : undefined;
};

const hasValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

const parseStatus = (value: unknown): Record<string, unknown> => {
  if (isRecord(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return {};

  try {
    const parsed = JSON.parse(value) as unknown;
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const readAny = (source: unknown, ...keys: string[]) => readCaseInsensitive(source, ...keys);

const hasAnyValue = (source: unknown, ...keys: string[]) => keys.some((key) => hasValue(readAny(source, key)));

const wasRemoved = (
  visibility: PersonagemVisibilidade | null | undefined,
  field: CampoPersonagemVisibilidade,
  stillExists: boolean,
) => visibility?.[field] === false && !stillExists;

/**
 * The visibility configuration itself is returned to owners and admins too.
 * For that reason a `false` flag alone never means that the browser should mask
 * the value: only a false flag together with the property missing in the raw API
 * payload proves that the backend has projected it for an external viewer.
 */
export const getProjectedHiddenCharacterFields = (
  rawPayload: unknown,
  visibility?: PersonagemVisibilidade | null,
): CamposOcultosProjetados => {
  const raw = isRecord(rawPayload) ? rawPayload : {};
  const statusRoot = parseStatus(readAny(raw, 'statusJson', 'StatusJson'));
  const status = readAny(statusRoot, 'status');
  const attributes = readAny(statusRoot, 'atributos');
  const fields: CamposOcultosProjetados = {};

  const mark = (field: CampoPersonagemVisibilidade, exists: boolean) => {
    if (wasRemoved(visibility, field, exists)) fields[field] = true;
  };

  mark('vida', hasAnyValue(status, 'vida', 'vidaMaxima'));
  mark('estamina', hasAnyValue(status, 'estamina', 'estaminaMaxima'));
  mark('mana', hasAnyValue(status, 'mana', 'manaMaxima'));
  mark('capacidadeCarga', hasAnyValue(status, 'capacidadeCarga'));
  mark('atributosPrincipais', hasValue(readAny(attributes, 'principais')));
  mark('atributosSecundarios', hasValue(readAny(attributes, 'secundarios')));
  mark('defesas', hasValue(readAny(statusRoot, 'defesas')) || hasValue(readAny(attributes, 'defesas')));
  mark('xp', hasAnyValue(statusRoot, 'xp'));
  mark('nivel', hasAnyValue(statusRoot, 'nivel'));

  mark('imagem', hasAnyValue(raw, 'imagem', 'Imagem', 'imagemUrl', 'ImagemUrl'));
  mark('nome', hasAnyValue(raw, 'nome', 'Nome'));
  mark('historia', hasAnyValue(raw, 'historia', 'Historia'));
  mark('raca', hasAnyValue(raw, 'idraca', 'Idraca', 'idRaca', 'RacaNome', 'racaNome'));
  mark('cidade', hasAnyValue(raw, 'idcidade', 'Idcidade', 'idCidade', 'CidadeNome', 'cidadeNome'));
  mark('alinhamento', hasAnyValue(raw, 'alinhamento', 'Alinhamento', 'alignment'));
  mark('tracosPersonalidade', hasAnyValue(raw, 'tracos', 'Tracos', 'costumes', 'Costumes', 'infoSecundariasJson', 'InfoSecundariasJson'));
  mark('personagensRelacionados', hasAnyValue(raw, 'personagemsVinculados', 'PersonagemsVinculados'));
  mark('inventario', hasAnyValue(raw, 'inventarioJson', 'InventarioJson'));
  mark('proteses', hasAnyValue(raw, 'implantes', 'Implantes'));
  mark('passivas', hasAnyValue(raw, 'idpassiva', 'Idpassiva', 'passiva', 'Passiva'));
  mark('ultimate', hasAnyValue(raw, 'ultimate', 'Ultimate'));
  mark('skills', hasAnyValue(raw, 'skills', 'Skills'));
  mark('magias', hasAnyValue(raw, 'magia', 'Magia'));
  mark('galeria', hasAnyValue(raw, 'galeriaImagem', 'GaleriaImagem'));

  return fields;
};

export const isProjectedCharacterFieldHidden = (
  fields: CamposOcultosProjetados | null | undefined,
  field: CampoPersonagemVisibilidade,
) => fields?.[field] === true;

export const characterTextOrBlocked = (
  value: unknown,
  fields: CamposOcultosProjetados | null | undefined,
  field: CampoPersonagemVisibilidade,
  fallback = '—',
) => {
  if (isProjectedCharacterFieldHidden(fields, field)) return CHARACTER_INFORMATION_BLOCKED;
  return hasValue(value) ? String(value) : fallback;
};

export const characterNumberOrBlocked = (
  value: unknown,
  fields: CamposOcultosProjetados | null | undefined,
  field: CampoPersonagemVisibilidade,
) => {
  if (isProjectedCharacterFieldHidden(fields, field)) return '0000';
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};
