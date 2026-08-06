import { ItemTipo } from '../models/Itens';
import { SistemaItemEscopoRuntime, SistemaItemReferenciaRuntime } from '../models/SistemaRpg';

export interface ItemFormOption {
  value: string;
  label: string;
}

export interface SistemaItemFormCatalog {
  typeOptions: Array<{ value: ItemTipo; label: string }>;
  categoryOptions: ItemFormOption[];
  archetypeOptions: ItemFormOption[];
  references: SistemaItemReferenciaRuntime[];
  categoryCode?: string;
  archetypeCode?: string;
}

const TYPE_CODES: Record<ItemTipo, string> = {
  arma: 'ARMA',
  traje: 'TRAJE',
  consumiveis: 'CONSUMIVEIS',
  acessorio: 'ACESSORIO',
  implante: 'IMPLANTE',
  outro: 'OUTRO',
};

const CODE_TYPES = Object.fromEntries(
  Object.entries(TYPE_CODES).map(([type, code]) => [code, type]),
) as Record<string, ItemTipo>;

export const normalizeSystemItemCode = (value: unknown) => String(value ?? '')
  .trim()
  .toLocaleUpperCase('pt-BR')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^A-Z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

export const itemTypeToSystemCode = (type: ItemTipo): string => TYPE_CODES[type];

const readAttribute = (attributes: unknown, key: string): unknown => (
  attributes && typeof attributes === 'object'
    ? (attributes as Record<string, unknown>)[key]
    : undefined
);

const legacyArchetype = (type: ItemTipo, attributes: unknown): string => {
  if (type === 'arma') return normalizeSystemItemCode(readAttribute(attributes, 'tipoArma'));
  if (type === 'traje') return normalizeSystemItemCode(readAttribute(attributes, 'tipoTraje'));
  if (type === 'implante') return normalizeSystemItemCode(readAttribute(attributes, 'parteCorpo'));
  return normalizeSystemItemCode(
    readAttribute(attributes, 'codigoArquetipo')
    ?? readAttribute(attributes, 'arquetipo')
    ?? readAttribute(attributes, 'subtipo'),
  );
};

const findArchetypeParent = (
  categories: SistemaItemEscopoRuntime[],
  archetypeCode: string,
): SistemaItemEscopoRuntime | undefined => categories.find((category) => (
  category.filhos?.some((child) => normalizeSystemItemCode(child.codigo) === archetypeCode)
));

export const resolveItemSystemScope = (
  type: ItemTipo,
  attributes: unknown,
  types: SistemaItemEscopoRuntime[],
) => {
  const typeCode = itemTypeToSystemCode(type);
  const typeScope = types.find((item) => normalizeSystemItemCode(item.codigo) === typeCode);
  const archetypeCode = normalizeSystemItemCode(
    readAttribute(attributes, 'codigoArquetipo') || legacyArchetype(type, attributes),
  );
  const explicitCategory = normalizeSystemItemCode(readAttribute(attributes, 'codigoCategoria'));
  const archetypeParent = archetypeCode
    ? findArchetypeParent(typeScope?.filhos ?? [], archetypeCode)
    : undefined;
  const categoryCode = explicitCategory || normalizeSystemItemCode(archetypeParent?.codigo);

  return { typeCode, typeScope, categoryCode, archetypeCode };
};

export const buildSistemaItemFormCatalog = (
  type: ItemTipo,
  attributes: unknown,
  types: SistemaItemEscopoRuntime[],
): SistemaItemFormCatalog => {
  const { typeScope, categoryCode, archetypeCode } = resolveItemSystemScope(type, attributes, types);
  const categories = (typeScope?.filhos ?? []).filter((item) => item.ativo !== false);
  const category = categories.find((item) => normalizeSystemItemCode(item.codigo) === categoryCode);
  const availableArchetypes = category
    ? category.filhos
    : categories.flatMap((item) => item.filhos ?? []);
  const archetype = availableArchetypes.find((item) => normalizeSystemItemCode(item.codigo) === archetypeCode);

  return {
    typeOptions: types
      .filter((item) => item.ativo !== false)
      .flatMap((item) => {
        const mapped = CODE_TYPES[normalizeSystemItemCode(item.codigo)];
        return mapped ? [{ value: mapped, label: item.nome }] : [];
      }),
    categoryOptions: categories.map((item) => ({
      value: normalizeSystemItemCode(item.codigo),
      label: item.nome,
    })),
    archetypeOptions: availableArchetypes
      .filter((item) => item.ativo !== false)
      .map((item) => ({
        value: normalizeSystemItemCode(item.codigo).toLocaleLowerCase('pt-BR'),
        label: item.nome,
      })),
    references: [
      ...(typeScope?.referencias ?? []),
      ...(category?.referencias ?? []),
      ...(archetype?.referencias ?? []),
    ],
    categoryCode: categoryCode || undefined,
    archetypeCode: archetypeCode || undefined,
  };
};

export const catalogReferenceOptions = (
  catalog: SistemaItemFormCatalog | undefined,
  type: string,
  fallback: ItemFormOption[],
): ItemFormOption[] => {
  const references = catalog?.references
    .filter((reference) => normalizeSystemItemCode(reference.tipo) === normalizeSystemItemCode(type))
    .map((reference) => ({
      value: normalizeSystemItemCode(reference.valor ?? reference.codigo).toLocaleLowerCase('pt-BR'),
      label: reference.nome,
    })) ?? [];
  return references.length > 0 ? references : fallback;
};
