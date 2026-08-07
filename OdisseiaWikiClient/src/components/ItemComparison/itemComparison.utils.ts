import {
  ARMA_DAMAGE_DISPLAY_CONFIG,
  ARMA_DAMAGE_FALLBACK_CONFIG,
  ARMA_TIPO_DANO_OPTIONS,
  ARMA_TIPO_OPTIONS,
  ITEM_TIPO_OPTIONS,
  normalizeArmaTipo,
  normalizeDadoAcerto,
  normalizeTrajeTipo,
  TRAJE_TIPO_OPTIONS,
  type ArmaDamageField,
} from '../../constants';
import type {
  AcessorioAtributos,
  ArmaAtributos,
  ConsumiveisAtributos,
  ImplanteAtributos,
  Item,
  OutrosAtributos,
  TrajeAtributos,
} from '../../models/Itens';
import type { SistemaItemFaixaRuntime, SistemaRuntimeContexto } from '../../models/SistemaRpg';
import { resolveItemSystemScope } from '../../utils/systemItemFormCatalog';
import type { ItemComparisonDetail, ItemComparisonMetric, ItemComparisonModel } from './ItemComparison.types';

const DAMAGE_LABELS: Record<ArmaDamageField, string> = {
  base: 'Dano base',
  curta: 'Dano curto',
  media: 'Dano médio',
  longa: 'Dano longo',
  emArea: 'Dano em área',
  preciso: 'Dano preciso',
};

const OUTFIT_REFERENCES = {
  colete: { protecao: 800, escudo: 0, armadura: 0 },
  traje: { protecao: 800, escudo: 0, armadura: 200 },
  armor_core: { protecao: 1200, escudo: 0, armadura: 300 },
} as const;

const IMPLANT_LIMITS: Record<string, number> = {
  vida: 1000,
  estamina: 100,
  mana: 100,
  resistencia: 6,
  forca: 6,
  agilidade: 6,
  precisao: 6,
  sabedoria: 6,
};

const IMPLANT_LABELS: Record<string, string> = {
  vida: 'Vida',
  estamina: 'Estamina',
  mana: 'Mana',
  resistencia: 'Resistência',
  forca: 'Força',
  agilidade: 'Agilidade',
  precisao: 'Precisão',
  sabedoria: 'Sabedoria',
};

const normalizeCode = (value: unknown) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9]/g, '')
  .toLocaleLowerCase('pt-BR');

const humanize = (value: unknown) => {
  const text = String(value ?? '').trim();
  if (!text) return undefined;
  const normalized = text.replace(/[-_]/g, ' ');
  return normalized.charAt(0).toLocaleUpperCase('pt-BR') + normalized.slice(1);
};

const text = (value: unknown) => typeof value === 'string' && value.trim()
  ? value.trim()
  : undefined;

const number = (value: unknown) => {
  const parsed = Number(value);
  return value !== '' && value !== null && value !== undefined && Number.isFinite(parsed)
    ? parsed
    : undefined;
};

const optionLabel = <T extends string>(
  value: T | undefined,
  options: Array<{ value: T; label: string }>,
) => options.find((option) => option.value === value)?.label;

const compactWeaponLabel = (label?: string) => label
  ?.replace(/^Arma de fogo\s+—\s+/i, '')
  .replace(/^Arma branca\s+—\s+/i, 'Arma ')
  .replace(/^Corpo a corpo\s+—\s+/i, '')
  .replace(/^Arma pesada\s+—\s+/i, 'Pesada: ');

const findRange = (ranges: SistemaItemFaixaRuntime[], ...candidates: string[]) => {
  const normalizedCandidates = candidates.map(normalizeCode);
  return ranges.find((range) => {
    const rangeCode = normalizeCode(range.codigoCampo);
    return normalizedCandidates.some((candidate) => rangeCode === candidate || rangeCode.endsWith(candidate));
  });
};

const metricReference = (
  ranges: SistemaItemFaixaRuntime[],
  candidates: string[],
  fallbackMaximum: number,
  fallbackReference?: number,
) => {
  const range = findRange(ranges, ...candidates);
  const maximum = number(range?.valorMaximo) ?? fallbackMaximum;
  const referenceMaximum = number(range?.valorReferencia) ?? fallbackReference;
  return {
    maximum: maximum > 0 ? maximum : fallbackMaximum,
    referenceMaximum,
    referenceDescription: range?.descricao ?? (referenceMaximum === undefined
      ? undefined
      : `Referência comum deste arquétipo: ${formatComparisonNumber(referenceMaximum)}.`),
  };
};

const detail = (
  key: string,
  label: string,
  value: unknown,
  options?: Pick<ItemComparisonDetail, 'numericValue' | 'higherIsBetter'>,
): ItemComparisonDetail | null => {
  const resolved = typeof value === 'number' ? formatComparisonNumber(value) : text(value);
  return resolved === undefined ? null : { key, label, value: resolved, ...options };
};

const clean = <T,>(values: Array<T | null | undefined | false>): T[] => values.filter(Boolean) as T[];

export const formatComparisonNumber = (value: number) => (
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value)
);

export const getItemComparisonGroup = (
  item: Item,
  context?: SistemaRuntimeContexto | null,
) => {
  const scope = resolveItemSystemScope(item.tipo, item.atributos, context?.itens?.tipos ?? []);
  const category = scope.typeScope?.filhos?.find((candidate) => normalizeCode(candidate.codigo) === normalizeCode(scope.categoryCode));
  if (item.tipo !== 'arma') {
    return { key: item.tipo, label: optionLabel(item.tipo, ITEM_TIPO_OPTIONS) ?? 'Item' };
  }

  if (scope.categoryCode) {
    return { key: `arma:${normalizeCode(scope.categoryCode)}`, label: category?.nome ?? humanize(scope.categoryCode) ?? 'Arma' };
  }

  const weaponType = normalizeArmaTipo((item.atributos as ArmaAtributos | undefined)?.tipoArma);
  const fallbackGroup = weaponType && ['pistola_revolver', 'smg', 'rifle_assalto', 'shotgun', 'rifle_atirador', 'rifle_precisao'].includes(weaponType)
    ? ['arma:fogo', 'Arma de fogo']
    : weaponType && ['arma_branca_comum', 'arma_branca_menor', 'arma_energizada', 'arma_fotons', 'sabre_luz'].includes(weaponType)
      ? ['arma:branca', 'Arma branca']
      : weaponType && ['desarmado', 'protese', 'soco_ingles'].includes(weaponType)
        ? ['arma:corpo', 'Corpo a corpo']
        : weaponType && ['arco', 'crossbow'].includes(weaponType)
          ? ['arma:disparo', 'Arco / besta']
          : weaponType && ['arma_pesada', 'arma_pesada_area'].includes(weaponType)
            ? ['arma:pesada', 'Arma pesada']
            : [`arma:${weaponType ?? 'geral'}`, compactWeaponLabel(optionLabel(weaponType, ARMA_TIPO_OPTIONS)) ?? 'Arma'];
  return { key: fallbackGroup[0], label: fallbackGroup[1] };
};

export const isCompatibleComparisonItem = (
  current: Item,
  candidate: Item,
  context?: SistemaRuntimeContexto | null,
) => {
  if (candidate.visivel === false) return false;
  if (current.id && candidate.id === current.id) return false;
  if (current.idItemBase && candidate.id === current.idItemBase) return false;
  const currentGroup = getItemComparisonGroup(current, context).key;
  const candidateGroup = getItemComparisonGroup(candidate, context).key;
  if (current.tipo === 'arma' && currentGroup === 'arma:geral') return candidate.tipo === 'arma';
  return currentGroup === candidateGroup;
};

export const buildCatalogItemRuntimeContext = (
  item: Item,
  context?: SistemaRuntimeContexto | null,
): SistemaRuntimeContexto | null => {
  if (!context) return null;
  const { typeScope, categoryCode, archetypeCode } = resolveItemSystemScope(
    item.tipo,
    item.atributos,
    context.itens.tipos,
  );
  const category = typeScope?.filhos?.find((scope) => normalizeCode(scope.codigo) === normalizeCode(categoryCode));
  const archetype = category?.filhos?.find((scope) => normalizeCode(scope.codigo) === normalizeCode(archetypeCode));
  const scopes = [typeScope, category, archetype].filter(Boolean);
  const merge = <T,>(values: T[], key: (value: T) => string) => (
    Array.from(new Map(values.map((value) => [key(value), value])).values())
  );
  const campos = merge(scopes.flatMap((scope) => scope?.campos ?? []), (field) => normalizeCode(field.codigo));
  const faixas = merge(scopes.flatMap((scope) => scope?.faixas ?? []), (range) => normalizeCode(range.codigoCampo));
  const referencias = merge(
    scopes.flatMap((scope) => scope?.referencias ?? []),
    (reference) => `${normalizeCode(reference.tipo)}:${normalizeCode(reference.codigo)}`,
  );

  return {
    ...context,
    referenciaItem: {
      codigoTipo: typeScope?.codigo ?? null,
      codigoCategoria: category?.codigo ?? categoryCode ?? null,
      codigoArquetipo: archetype?.codigo ?? archetypeCode ?? null,
      codigoCaminho: archetype?.codigoCaminho ?? category?.codigoCaminho ?? typeScope?.codigoCaminho ?? null,
      completa: Boolean(typeScope && (!categoryCode || category) && (!archetypeCode || archetype)),
      campos,
      faixas,
      referencias,
    },
  };
};

export const buildItemComparisonModel = (
  item: Item,
  context?: SistemaRuntimeContexto | null,
): ItemComparisonModel => {
  const attributes = item.atributos ?? {};
  const ranges = context?.referenciaItem?.faixas ?? [];
  const typeLabel = optionLabel(item.tipo, ITEM_TIPO_OPTIONS) ?? 'Item';
  const commonDetails = clean<ItemComparisonDetail>([
    detail('peso', 'Espaço ocupado / peso', item.peso ?? 0, { numericValue: item.peso ?? 0, higherIsBetter: false }),
    detail('discricao', 'Discrição', item.discricao ?? 0, { numericValue: item.discricao ?? 0, higherIsBetter: true }),
  ]);
  let subtypeLabel: string | undefined;
  let metrics: ItemComparisonMetric[] = [];
  let details: ItemComparisonDetail[] = [];
  let special: string | undefined;

  if (item.tipo === 'arma') {
    const weapon = attributes as ArmaAtributos;
    const weaponType = normalizeArmaTipo(weapon.tipoArma);
    const config = weaponType ? ARMA_DAMAGE_DISPLAY_CONFIG[weaponType] : ARMA_DAMAGE_FALLBACK_CONFIG;
    subtypeLabel = compactWeaponLabel(optionLabel(weaponType, ARMA_TIPO_OPTIONS));
    const values: Record<ArmaDamageField, number | undefined> = {
      base: number(weapon.danoBase),
      curta: number(weapon.danoPorAlcance?.curta),
      media: number(weapon.danoPorAlcance?.media),
      longa: number(weapon.danoPorAlcance?.longa),
      emArea: number(weapon.danoPorAlcance?.emArea),
      preciso: number(weapon.danoPorAlcance?.preciso),
    };
    metrics = config.fields.map((field, index) => ({
      key: `dano.${field}`,
      label: DAMAGE_LABELS[field],
      value: values[field] ?? 0,
      ...metricReference(
        ranges,
        field === 'base' ? ['danoBase', 'base'] : [`danoPorAlcance.${field}`, `dano${field}`, field],
        config.scaleMaximumByField?.[field] ?? config.scaleMaximum,
        config.commonMaximumByField?.[field] ?? config.commonMaximum,
      ),
      higherIsBetter: true,
      accent: index % 2 === 0 ? 'pink' : 'purple',
    }));
    const cadence = number(weapon.cadencia ?? weapon.ataquesPorTurno);
    const ammunition = number(weapon.capacidadeMunicao ?? weapon.municao?.capacidade);
    details = clean([
      detail('tipoArma', 'Tipo de arma', subtypeLabel),
      detail('tipoDano', 'Tipo de dano', optionLabel(weapon.tipoDano, ARMA_TIPO_DANO_OPTIONS) ?? humanize(weapon.tipoDano)),
      detail('acerto', 'Dado de acerto', normalizeDadoAcerto(weapon.acerto) || weapon.acerto),
      detail('cadencia', 'Cadência', cadence === undefined ? undefined : `${formatComparisonNumber(cadence)}/turno`, { numericValue: cadence, higherIsBetter: true }),
      detail('capacidadeUso', 'Usos até pausa', number(weapon.capacidadeUso), { numericValue: number(weapon.capacidadeUso), higherIsBetter: true }),
      detail('municao', 'Munição', ammunition, { numericValue: ammunition, higherIsBetter: true }),
      detail('estamina', 'Estamina por ação', number(weapon.gastoEstaminaPorAtaque), { numericValue: number(weapon.gastoEstaminaPorAtaque), higherIsBetter: false }),
      detail('duracao', 'Duração', weapon.duracaoEfeito),
      ...commonDetails,
    ]);
    special = text(weapon.especial);
  } else if (item.tipo === 'traje') {
    const outfit = attributes as TrajeAtributos;
    const outfitType = normalizeTrajeTipo(outfit.tipoTraje);
    const refs = outfitType ? OUTFIT_REFERENCES[outfitType] : undefined;
    subtypeLabel = optionLabel(outfitType, TRAJE_TIPO_OPTIONS);
    metrics = [
      ['protecao', 'Proteção', number(outfit.protecaoBase) ?? 0, 1200, refs?.protecao, 'pink'],
      ['escudo', 'Escudo', number(outfit.escudoBase) ?? 0, 3000, refs?.escudo, 'green'],
      ['armadura', 'Armadura', number(outfit.armaduraBase) ?? 0, 500, refs?.armadura, 'purple'],
    ].map(([key, label, value, maximum, referenceMaximum, accent]) => ({
      key: String(key),
      label: String(label),
      value: Number(value),
      ...metricReference(ranges, [`${key}Base`, String(key)], Number(maximum), Number(referenceMaximum)),
      higherIsBetter: true,
      accent: accent as ItemComparisonMetric['accent'],
    }));
    details = clean([
      detail('tipoTraje', 'Subcategoria / tipo', subtypeLabel),
      ...commonDetails,
      detail('resistencias', 'Resistências', outfit.resistencias?.filter(Boolean).join(' • ')),
      detail('penalidades', 'Penalidades', outfit.penalidades?.filter(Boolean).join(' • ')),
    ]);
    special = text(outfit.especial);
  } else if (item.tipo === 'consumiveis') {
    const consumable = attributes as ConsumiveisAtributos;
    const restore = consumable.restaura ?? {};
    metrics = clean([
      number(restore.vida) !== undefined && { key: 'vida', label: 'Restaura vida', value: number(restore.vida), ...metricReference(ranges, ['restaura.vida', 'restauraVida', 'vida'], 1500, 1500), higherIsBetter: true, accent: 'pink' as const, showPlus: true },
      number(restore.estamina) !== undefined && { key: 'estamina', label: 'Restaura estamina', value: number(restore.estamina), ...metricReference(ranges, ['restaura.estamina', 'restauraEstamina', 'estamina'], 100, 40), higherIsBetter: true, accent: 'green' as const, showPlus: true },
      number(restore.mana) !== undefined && { key: 'mana', label: 'Restaura mana', value: number(restore.mana), ...metricReference(ranges, ['restaura.mana', 'restauraMana', 'mana'], 100, 35), higherIsBetter: true, accent: 'purple' as const, showPlus: true },
    ]);
    details = clean([detail('duracao', 'Duração', consumable.duracao), ...commonDetails]);
    special = text(consumable.especial);
  } else if (item.tipo === 'implante') {
    const implant = attributes as ImplanteAtributos;
    subtypeLabel = humanize(implant.parteCorpo);
    metrics = Object.entries(implant.bonus ?? {}).flatMap(([key, rawValue], index) => {
      const value = number(rawValue);
      if (value === undefined || !IMPLANT_LIMITS[key]) return [];
      return [{
        key: `bonus.${key}`,
        label: `Bônus de ${IMPLANT_LABELS[key] ?? humanize(key)}`,
        value,
        ...metricReference(ranges, [`bonus.${key}`, `bonus${key}`, key], IMPLANT_LIMITS[key], undefined),
        higherIsBetter: true,
        showPlus: true,
        accent: index % 2 === 0 ? 'purple' as const : 'green' as const,
      }];
    });
    details = clean([
      detail('parteCorpo', 'Parte do corpo', humanize(implant.parteCorpo)),
      detail('lado', 'Lado', humanize(implant.lado)),
      detail('material', 'Material', humanize(implant.material)),
      detail('modelo', 'Modelo', implant.modelo),
      detail('slotsModificacao', 'Slots de modificação', number(implant.slotsModificacao), { numericValue: number(implant.slotsModificacao), higherIsBetter: true }),
      detail('slotsLacrima', 'Slots de lácrima', number(implant.slotsLacrima), { numericValue: number(implant.slotsLacrima), higherIsBetter: true }),
      detail('amputacao', 'Necessita amputação', implant.necessitaAmputacao ? 'Sim' : 'Não'),
      ...commonDetails,
    ]);
    special = implant.especiais?.filter(Boolean).join(' • ');
  } else if (item.tipo === 'acessorio') {
    const accessory = attributes as AcessorioAtributos;
    details = clean([
      detail('slot', 'Slot', accessory.slot),
      detail('duracao', 'Duração', accessory.duracao),
      ...commonDetails,
      detail('bonus', 'Bônus', accessory.bonus?.filter(Boolean).join(' • ')),
    ]);
  } else {
    const other = attributes as OutrosAtributos;
    details = clean([detail('duracao', 'Duração', other.duracao), ...commonDetails]);
    special = text(other.especial);
  }

  return {
    item,
    typeLabel,
    subtypeLabel,
    metrics,
    details,
    effect: text((attributes as { efeito?: string }).efeito) ?? text(item.efeito),
    special,
  };
};

export const mergeComparisonKeys = <T extends { key: string }>(left: T[], right: T[]) => (
  [...left, ...right].reduce<string[]>((keys, entry) => (
    keys.includes(entry.key) ? keys : [...keys, entry.key]
  ), [])
);

export const getNumericDelta = (
  currentValue: number | undefined,
  candidateValue: number | undefined,
  higherIsBetter: boolean,
) => {
  if (currentValue === undefined || candidateValue === undefined) return null;
  const difference = candidateValue - currentValue;
  if (difference === 0) return { difference, quality: 'equal' as const };
  return {
    difference,
    quality: (difference > 0) === higherIsBetter ? 'better' as const : 'worse' as const,
  };
};
