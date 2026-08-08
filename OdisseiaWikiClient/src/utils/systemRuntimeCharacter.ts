import {
  SistemaAtributoConfig,
  SistemaRuntimeContexto,
  SistemaTipoDefesa,
} from '../models/SistemaRpg';
import { RacaCharacterStatusDefaults } from '../services/racasService';

export interface RuntimeNumericField {
  key: string;
  code: string;
  label: string;
  description?: string;
  min?: number;
  max?: number;
  order: number;
  configured: boolean;
}

export interface RuntimeSelectOption {
  label: string;
  value: string;
}

const LEGACY_PRIMARY_FIELDS = [
  ['resistencia', 'Resistência'],
  ['agilidade', 'Agilidade'],
  ['sabedoria', 'Sabedoria'],
  ['precisao', 'Precisão'],
  ['forca', 'Força'],
] as const;

const LEGACY_SECONDARY_FIELDS = [
  ['sanidade', 'Sanidade'],
  ['coragem', 'Coragem'],
  ['inteligencia', 'Inteligência'],
  ['percepcao', 'Percepção'],
  ['labia', 'Lábia'],
  ['intimidacao', 'Intimidação'],
] as const;

const LEGACY_DEFENSE_FIELDS = [
  ['armadura', 'Armadura'],
  ['protecao', 'Proteção'],
  ['escudo', 'Escudo'],
  ['outras', 'Outras'],
] as const;

const LEGACY_RESOURCE_FIELDS = [
  ['vida', 'Vida'],
  ['estamina', 'Estamina'],
  ['mana', 'Mana'],
  ['capacidadeCarga', 'Capacidade de carga'],
] as const;

const ATTRIBUTE_KEY_ALIASES: Record<string, string> = {
  AMEACA: 'intimidacao',
};

const RESOURCE_KEY_ALIASES: Record<string, string> = {
  VIDA: 'vida',
  ESTAMINA: 'estamina',
  MANA: 'mana',
  CAPACIDADE_CARGA: 'capacidadeCarga',
};

const DEFENSE_KEY_ALIASES: Record<string, string> = {
  ARMADURA: 'armadura',
  PROTECAO: 'protecao',
  ESCUDO: 'escudo',
  OUTRAS: 'outras',
};

export const normalizeRuntimeCode = (value: string) => value
  .trim()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')
  .toUpperCase();

const codeToCamelCase = (value: string) => normalizeRuntimeCode(value)
  .toLowerCase()
  .replace(/_([a-z0-9])/g, (_, character: string) => character.toUpperCase());

export const getRuntimeAttributeKey = (code: string) => {
  const normalizedCode = normalizeRuntimeCode(code);
  return ATTRIBUTE_KEY_ALIASES[normalizedCode] ?? codeToCamelCase(normalizedCode);
};

export const getRuntimeResourceKey = (code: string) => {
  const normalizedCode = normalizeRuntimeCode(code);
  return RESOURCE_KEY_ALIASES[normalizedCode] ?? codeToCamelCase(normalizedCode);
};

export const getRuntimeDefenseKey = (code: string) => {
  const normalizedCode = normalizeRuntimeCode(code);
  return DEFENSE_KEY_ALIASES[normalizedCode] ?? codeToCamelCase(normalizedCode);
};

const formatUnknownKey = (key: string) => key
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/_/g, ' ')
  .replace(/^./, (character) => character.toUpperCase());

type RuntimeKeyResolver = (code: string) => string;

const normalizeNumericValues = (
  values: Record<string, number> | null | undefined,
  resolveKey: RuntimeKeyResolver,
) => {
  const entries = Object.entries(values ?? {});
  const canonicalSources = new Set(
    entries
      .filter(([key]) => key === resolveKey(key))
      .map(([key]) => resolveKey(key)),
  );
  const normalized: Record<string, number> = {};

  entries.forEach(([sourceKey, rawValue]) => {
    const key = resolveKey(sourceKey);
    const sourceIsCanonical = sourceKey === key;
    const hasCanonicalSource = canonicalSources.has(key);

    if (hasCanonicalSource && !sourceIsCanonical) return;

    const value = Number(rawValue);
    normalized[key] = Number.isFinite(value) ? value : 0;
  });

  return normalized;
};

export const normalizeRuntimeAttributeValues = (
  values: Record<string, number> | null | undefined,
) => normalizeNumericValues(values, getRuntimeAttributeKey);

export const normalizeRuntimeDefenseValues = (
  values: Record<string, number> | null | undefined,
) => normalizeNumericValues(values, getRuntimeDefenseKey);

const appendUnknownFields = (
  configuredFields: RuntimeNumericField[],
  values: Record<string, number>,
  excludedKeys: Set<string> = new Set(),
  resolveKey: RuntimeKeyResolver = (key) => key,
) => {
  const uniqueConfiguredFields = configuredFields.filter((field, index, fields) => (
    fields.findIndex((candidate) => resolveKey(candidate.key) === resolveKey(field.key)) === index
  ));
  const configuredKeys = new Set(uniqueConfiguredFields.map((field) => resolveKey(field.key)));
  const excludedCanonicalKeys = new Set([...excludedKeys].map(resolveKey));
  const unknownKeys = [...new Set(Object.keys(values).map(resolveKey))]
    .filter((key) => !configuredKeys.has(key) && !excludedCanonicalKeys.has(key));
  const unknownFields = unknownKeys.map<RuntimeNumericField>((key, index) => ({
    key,
    code: key,
    label: formatUnknownKey(key),
    order: uniqueConfiguredFields.length + index + 1,
    configured: false,
  }));

  return [...uniqueConfiguredFields, ...unknownFields];
};

const legacyFields = (fields: ReadonlyArray<readonly [string, string]>): RuntimeNumericField[] => (
  fields.map(([key, label], index) => ({
    key,
    code: normalizeRuntimeCode(key),
    label,
    order: index + 1,
    configured: false,
  }))
);

const mapAttribute = (attribute: SistemaAtributoConfig): RuntimeNumericField => ({
  key: getRuntimeAttributeKey(attribute.codigo),
  code: attribute.codigo,
  label: attribute.nome,
  description: attribute.descricao,
  min: attribute.valorMinimo,
  max: attribute.valorMaximoAbsoluto ?? attribute.valorMaximoNatural,
  order: attribute.ordem,
  configured: true,
});

export const getRuntimeAttributeFields = (
  contexto: SistemaRuntimeContexto | null | undefined,
  group: 'Principal' | 'Secundario',
  values: Record<string, number>,
) => {
  const configured = (contexto?.criacao?.atributos ?? [])
    .filter((attribute) => attribute.ativo && attribute.grupo === group)
    .sort((left, right) => left.ordem - right.ordem)
    .map(mapAttribute);
  const baseFields = configured.length > 0
    ? configured
    : legacyFields(group === 'Principal' ? LEGACY_PRIMARY_FIELDS : LEGACY_SECONDARY_FIELDS);

  return appendUnknownFields(baseFields, values, new Set(), getRuntimeAttributeKey);
};

const mapDefense = (defense: SistemaTipoDefesa): RuntimeNumericField => ({
  key: getRuntimeDefenseKey(defense.codigo),
  code: defense.codigo,
  label: defense.nome,
  description: defense.descricao,
  order: defense.ordem,
  configured: true,
});

export const getRuntimeDefenseFields = (
  contexto: SistemaRuntimeContexto | null | undefined,
  values: Record<string, number>,
) => {
  const configured = (contexto?.combate?.tiposDefesa ?? [])
    .slice()
    .sort((left, right) => left.ordem - right.ordem)
    .map(mapDefense);
  const baseFields = configured.length > 0 ? configured : legacyFields(LEGACY_DEFENSE_FIELDS);
  return appendUnknownFields(baseFields, values, new Set(), getRuntimeDefenseKey);
};

export const getRuntimeResourceFields = (
  contexto: SistemaRuntimeContexto | null | undefined,
  values: Record<string, number>,
) => {
  const configured = (contexto?.criacao?.recursos ?? [])
    .filter((resource) => resource.ativo)
    .sort((left, right) => left.ordem - right.ordem)
    .map<RuntimeNumericField>((resource) => ({
      key: getRuntimeResourceKey(resource.codigo),
      code: resource.codigo,
      label: resource.nome,
      description: resource.formula ?? resource.formulaValorInicial ?? resource.condicaoAoZerar,
      min: resource.valorMinimo,
      max: resource.valorMaximo ?? undefined,
      order: resource.ordem,
      configured: true,
    }));
  const baseFields = configured.length > 0 ? configured : legacyFields(LEGACY_RESOURCE_FIELDS);
  const maximumKeys = new Set(Object.keys(values).filter((key) => key.endsWith('Maxima')));
  return appendUnknownFields(baseFields, values, maximumKeys);
};

const createAttributeValues = (
  contexto: SistemaRuntimeContexto | null | undefined,
  group: 'Principal' | 'Secundario',
) => Object.fromEntries(
  getRuntimeAttributeFields(contexto, group, {})
    .map((field) => [field.key, field.min ?? 0]),
);

export const createRuntimeAttributeDefaults = (
  contexto: SistemaRuntimeContexto | null | undefined,
) => ({
  principais: createAttributeValues(contexto, 'Principal'),
  secundarios: createAttributeValues(contexto, 'Secundario'),
});

export const applyRuntimeInitialAttribute = (
  values: Record<string, number>,
  attributeCode?: string | null,
) => {
  if (!attributeCode?.trim()) return values;
  const key = getRuntimeAttributeKey(attributeCode);
  return { ...values, [key]: (Number(values[key]) || 0) + 1 };
};

export const createRuntimeDefenseDefaults = (
  contexto: SistemaRuntimeContexto | null | undefined,
) => Object.fromEntries(
  getRuntimeDefenseFields(contexto, {}).map((field) => [field.key, 0]),
);

export const createRuntimeResourceDefaults = (
  contexto: SistemaRuntimeContexto | null | undefined,
  legacyRaceDefaults?: RacaCharacterStatusDefaults | null,
) => {
  const values: Record<string, number> = {};
  (contexto?.criacao?.recursos ?? []).filter((resource) => resource.ativo).forEach((resource) => {
    values[getRuntimeResourceKey(resource.codigo)] = Number(resource.valorPadrao) || 0;
  });

  const race = contexto?.configuracaoRacial;
  const vida = race?.vidaBase ?? legacyRaceDefaults?.vida ?? values.vida ?? 0;
  const estamina = race?.estaminaBase ?? legacyRaceDefaults?.estamina ?? values.estamina ?? 0;
  const mana = race?.manaBase ?? legacyRaceDefaults?.mana ?? values.mana ?? 0;
  const capacidadeCarga = race?.capacidadeCargaBase
    ?? legacyRaceDefaults?.capacidadeCarga
    ?? values.capacidadeCarga
    ?? 0;

  return {
    ...values,
    vida,
    vidaMaxima: vida,
    estamina,
    estaminaMaxima: estamina,
    mana,
    manaMaxima: mana,
    capacidadeCarga,
  };
};

export const getRuntimeMagicTypeOptions = (
  contexto: SistemaRuntimeContexto | null | undefined,
  includeNormal = false,
): RuntimeSelectOption[] => {
  const configured = (contexto?.poderes?.tiposMagia ?? [])
    .slice()
    .sort((left, right) => left.ordem - right.ordem)
    .map((type) => ({ label: type.nome, value: codeToCamelCase(type.codigo) }));

  if (configured.length > 0) {
    return includeNormal
      ? [{ label: 'Normal', value: 'normal' }, ...configured.filter((option) => option.value !== 'normal')]
      : configured;
  }

  const fallback: RuntimeSelectOption[] = [
    { label: 'Fogo', value: 'fogo' },
    { label: 'Água', value: 'agua' },
    { label: 'Ar', value: 'ar' },
    { label: 'Terra', value: 'terra' },
    { label: 'Luz', value: 'luz' },
    { label: 'Escuridão', value: 'escuridao' },
    { label: 'Espacial', value: 'espacial' },
    { label: 'Transfiguração', value: 'transfiguracao' },
    { label: 'Invocação', value: 'invocacao' },
  ];
  return includeNormal ? [{ label: 'Normal', value: 'normal' }, ...fallback] : fallback;
};

export const getRuntimeResourceLabel = (
  contexto: SistemaRuntimeContexto | null | undefined,
  key: string,
  fallback: string,
) => getRuntimeResourceFields(contexto, {})
  .find((field) => field.key === key)?.label ?? fallback;
