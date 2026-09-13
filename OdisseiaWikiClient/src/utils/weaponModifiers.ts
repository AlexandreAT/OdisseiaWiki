import { ARMA_DAMAGE_DISPLAY_CONFIG, normalizeArmaTipo } from '../constants';
import type { AcessorioAnexado, AcessorioAtributos, ArmaAtributos, Item, ModificadoresArma, ModoModificadoresArma } from '../models/Itens';

export const WEAPON_MODIFIER_FIELDS = [
  { key: 'curta', label: 'A curta distância', mode: 'distancia' },
  { key: 'media', label: 'A média distância', mode: 'distancia' },
  { key: 'longa', label: 'A longa distância', mode: 'distancia' },
  { key: 'ataque', label: 'Ao atacar', mode: 'corpo_a_corpo' },
  { key: 'revidar', label: 'Ao revidar', mode: 'corpo_a_corpo' },
  { key: 'dano', label: 'Dano adicional', mode: 'todas' },
  { key: 'estamina', label: 'Gasto de estamina', mode: 'todas' },
] as const;

const finite = (value: unknown): number => typeof value === 'number' && Number.isFinite(value) ? value : 0;
const texts = (value: unknown): string[] => Array.isArray(value)
  ? value.filter((entry): entry is string => typeof entry === 'string' && Boolean(entry.trim())) : [];
export const signedModifier = (value: number) => `${value > 0 ? '+' : ''}${value.toLocaleString('pt-BR')}`;

export const getWeaponModifierMode = (attributes: ArmaAtributos): ModoModificadoresArma | undefined => {
  if (attributes.modoModificadores === 'distancia' || attributes.modoModificadores === 'corpo_a_corpo') return attributes.modoModificadores;
  const type = normalizeArmaTipo(attributes.tipoArma);
  if (!type) return undefined;
  return ARMA_DAMAGE_DISPLAY_CONFIG[type].fields.some((field) => field !== 'base') ? 'distancia' : 'corpo_a_corpo';
};

export const getAttachedAccessories = (attributes?: ArmaAtributos | null): AcessorioAnexado[] => (
  Array.isArray(attributes?.acessorios) ? attributes.acessorios.filter((entry) => (
    entry && typeof entry.idItemBase === 'string' && typeof entry.nome === 'string'
    && entry.atributos && typeof entry.atributos === 'object'
  )) : []
);

export const getAccessoryCompatibilityLabel = (accessory: AcessorioAtributos) => accessory.compatibilidade === 'distancia'
  ? 'Armas à distância' : accessory.compatibilidade === 'corpo_a_corpo' ? 'Armas corpo a corpo' : 'Todas as armas';

export const isAccessoryCompatible = (weapon: ArmaAtributos, accessory: AcessorioAtributos) => (
  !accessory.compatibilidade || accessory.compatibilidade === 'todas'
  || accessory.compatibilidade === getWeaponModifierMode(weapon)
);

export const describeModifiers = (modifiers?: ModificadoresArma): string[] => [
  ...WEAPON_MODIFIER_FIELDS.flatMap(({ key, label }) => {
    const value = finite(modifiers?.[key]);
    return value ? [`${signedModifier(value)} ${label.toLocaleLowerCase('pt-BR')}`] : [];
  }),
  ...texts(modifiers?.efeitos),
];

export const describeAccessory = (accessory: AcessorioAtributos): string[] => [
  ...describeModifiers(accessory.modificadores),
  ...texts(accessory.bonus),
  ...(typeof accessory.efeito === 'string' && accessory.efeito.trim() ? [accessory.efeito] : []),
];

export const resolveWeaponModifiers = (weapon: ArmaAtributos): ModificadoresArma => {
  const mode = getWeaponModifierMode(weapon);
  const sources = [weapon.modificadores, ...getAttachedAccessories(weapon)
    .filter((accessory) => isAccessoryCompatible(weapon, accessory.atributos))
    .map((accessory) => accessory.atributos.modificadores)];
  const result: ModificadoresArma = {};
  for (const { key, mode: fieldMode } of WEAPON_MODIFIER_FIELDS) {
    if (fieldMode !== 'todas' && fieldMode !== mode) continue;
    const value = sources.reduce((sum, source) => sum + finite(source?.[key]), 0);
    if (value) result[key] = value;
  }
  result.efeitos = [...new Set(sources.flatMap((source) => texts(source?.efeitos)))];
  return result;
};

/** Projeção somente para leitura. Nunca persistir esses totais sobre os valores base. */
export const getEffectiveWeaponAttributes = (weapon: ArmaAtributos): ArmaAtributos => {
  const modifiers = resolveWeaponModifiers(weapon);
  const result = { ...weapon, modificadores: modifiers };
  const damage = modifiers.dano ?? 0;
  if (damage) {
    if (typeof weapon.danoBase === 'number') result.danoBase = Math.max(0, weapon.danoBase + damage);
    if (weapon.danoPorAlcance) result.danoPorAlcance = Object.fromEntries(Object.entries(weapon.danoPorAlcance)
      .map(([key, value]) => [key, typeof value === 'number' ? Math.max(0, value + damage) : value]));
  }
  if (modifiers.estamina && typeof weapon.gastoEstaminaPorAtaque === 'number') {
    result.gastoEstaminaPorAtaque = Math.max(0, weapon.gastoEstaminaPorAtaque + modifiers.estamina);
  }
  return result;
};

export const getEffectiveItemAttributes = (item: Item) => item.tipo === 'arma'
  ? getEffectiveWeaponAttributes((item.atributos ?? {}) as ArmaAtributos) : item.atributos ?? {};

export const createAccessorySnapshot = (item: Item): AcessorioAnexado | undefined => {
  const id = item.idItemBase ?? item.id;
  if (item.tipo !== 'acessorio' || !id) return undefined;
  const attributes = (item.atributos ?? {}) as AcessorioAtributos;
  return {
    idItemBase: id, nome: item.nome,
    atributos: {
      compatibilidade: attributes.compatibilidade,
      modificadores: attributes.modificadores ? { ...attributes.modificadores, efeitos: [...texts(attributes.modificadores.efeitos)] } : undefined,
      efeito: attributes.efeito ?? item.efeito,
      bonus: [...texts(attributes.bonus)], slot: attributes.slot, duracao: attributes.duracao,
    },
  };
};
