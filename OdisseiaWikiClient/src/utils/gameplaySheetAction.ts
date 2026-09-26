import type { GameplaySheetActionSource } from '../components/Gameplay';
import type { Item } from '../models/Itens';
import type { Magia } from '../models/Magias';
import type { PersonagemJogador } from '../models/PersonagemJogador';
import type { Skills } from '../models/Skills';

type AbilityActionType = 'SKILL' | 'MAGIA';

const asRecord = (value: unknown): Record<string, unknown> => (
  value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
);

const parseStoredValue = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const readStoredField = (record: Record<string, unknown>, ...keys: string[]) => (
  keys.map((key) => record[key]).find((value) => value !== undefined && value !== null)
);

const parseStoredCollection = (value: unknown): unknown[] => {
  const parsed = parseStoredValue(value);
  return Array.isArray(parsed) ? parsed : [];
};

const normalizeStoredItem = (value: unknown): Item | null => {
  const record = asRecord(value);
  const id = String(readStoredField(record, 'id', 'Id', 'iditem', 'Iditem') ?? '').trim();
  if (!id) return null;
  const rawType = String(readStoredField(record, 'tipo', 'Tipo') ?? 'outro').toLowerCase();
  const attributes = asRecord(parseStoredValue(readStoredField(
    record,
    'atributos',
    'Atributos',
    'atributosJson',
    'AtributosJson',
  )));

  return {
    ...(record as Partial<Item>),
    id,
    nome: String(readStoredField(record, 'nome', 'Nome', 'nomeItem', 'NomeItem') ?? 'Item'),
    tipo: rawType as Item['tipo'],
    quantidade: Number(readStoredField(record, 'quantidade', 'Quantidade') ?? 1),
    atributos: attributes,
    aplicaTeste: typeof readStoredField(record, 'aplicaTeste', 'AplicaTeste') === 'boolean'
      ? readStoredField(record, 'aplicaTeste', 'AplicaTeste') as boolean
      : undefined,
  };
};

const hasConfiguredTest = (value: unknown) => {
  const attributes = asRecord(value);
  const test = attributes.teste ?? attributes.especificacaoTeste;
  return Boolean(
    test
    && typeof test === 'object'
    && !Array.isArray(test)
    && typeof (test as Record<string, unknown>).codigoTeste === 'string'
    && (test as Record<string, string>).codigoTeste.trim(),
  );
};

/**
 * Builds only a UI reference. The API resolves every executable rule from the
 * persisted character and the version fixed to the Mesa.
 */
export const getItemGameplayAction = (item: Item): GameplaySheetActionSource | null => {
  if (!item.id) return null;
  const attributes = asRecord(item.atributos);
  const configuredAppliesTest = typeof attributes.aplicaTeste === 'boolean'
    ? attributes.aplicaTeste
    : undefined;
  const appliesTest = item.aplicaTeste
    ?? configuredAppliesTest
    ?? (item.tipo === 'arma' || hasConfiguredTest(attributes));

  if (!appliesTest) return null;
  return {
    type: item.tipo === 'implante' ? 'PROTESE' : 'ITEM',
    id: item.id,
    name: item.nome || 'Item',
    item,
    attributes,
  };
};

const getAbilityGameplayAction = (
  ability: Skills | Magia,
  type: AbilityActionType,
): GameplaySheetActionSource | null => {
  if (!ability.id || !hasConfiguredTest(ability.atributos)) return null;
  return {
    type,
    id: ability.id,
    name: ability.nome || (type === 'SKILL' ? 'Skill' : 'Magia'),
    attributes: asRecord(ability.atributos),
  };
};

export const getSkillGameplayAction = (skill: Skills) => getAbilityGameplayAction(skill, 'SKILL');

export const getMagicGameplayAction = (magic: Magia) => getAbilityGameplayAction(magic, 'MAGIA');

/** Resolve a instância persistida usada por um favorito sem confiar no snapshot salvo pelo atalho. */
export const getCharacterItemGameplayAction = (
  character: PersonagemJogador & { implantes?: unknown },
  itemId: string,
): GameplaySheetActionSource | null => {
  const entries = [
    ...parseStoredCollection(character.inventarioJson),
    ...parseStoredCollection(character.implantes),
  ];
  const item = entries
    .map(normalizeStoredItem)
    .find((entry) => entry?.id === itemId);
  return item ? getItemGameplayAction(item) : null;
};
