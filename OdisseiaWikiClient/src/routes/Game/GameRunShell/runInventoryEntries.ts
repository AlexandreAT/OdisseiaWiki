import type { GameRunActionSelection } from '../../../models/GameRun';
import type { ConfiguracaoCombateSistema } from '../../../models/SistemaRpg';
import type { GameplayConditionEffectConfig } from '../../../models/Itens';

export interface RunConditionOrigin extends GameplayConditionEffectConfig { name: string; index: number; }

export type RunInventoryKind = Exclude<GameRunActionSelection['tipo'], 'DESCANSO'>;
export interface RunActionQuantityLimit {
  source: 'Item' | 'Sistema';
  reason: string;
  max: number;
}
export interface RunInventoryEntry extends GameRunActionSelection {
  tipo: RunInventoryKind;
  name: string;
  image: string | null;
  weight: number | null;
  value: number | null;
  subtype: string;
  quantity: number;
  baseItemId: string | null;
  stackSignature: string;
  maxAttacks: number;
  quantityLimits: RunActionQuantityLimit[];
  availableUses: number | null;
  ammoPerUse: number;
  ammoCapacity: number;
  controlsAmmo: boolean;
  staminaPerUse: number;
  damageByRange: { base: number; curta: number; media: number; longa: number };
  weaponType: string;
  ranged: boolean;
  fireMode: 'TIRO' | 'RAJADA';
  hasDeclaredTest: boolean;
  restore: { vida: number; mana: number; estamina: number };
  useConditions: string[];
  hitConditions: string[];
  conditions: RunConditionOrigin[];
  defense: { escudo: number; protecao: number; armadura: number };
  defenseRemaining: { escudo: number; protecao: number };
  defenseEquipped: boolean;
  passiveBonuses?: Record<string, number>;
  engineerUpgrades?: number;
  manaPerUse?: number;
  cooldownTurns?: number;
}

const object = (value: unknown): Record<string, unknown> | null => {
  if (typeof value === 'string') {
    try { return object(JSON.parse(value)); } catch { return null; }
  }
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
};
const field = (value: Record<string, unknown>, key: string) =>
  Object.entries(value).find(([name]) => name.toLowerCase() === key.toLowerCase())?.[1];
const numeric = (value: unknown): number => {
  const parsed = typeof value === 'number' || typeof value === 'string' ? Number(value) : 0;
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
};
const entries = (raw: unknown): unknown[] => {
  let value = raw;
  if (typeof value === 'string') { try { value = JSON.parse(value); } catch { return []; } }
  if (Array.isArray(value)) return value;
  const wrapper = object(value);
  return (['itens', 'inventario', 'items', 'implantes', 'proteses', 'skills', 'magia', 'magias', 'poderes']
    .map((key) => wrapper && field(wrapper, key)).find(Array.isArray) as unknown[] | undefined) ?? [];
};

const rangedTypes = new Set(['pistola_revolver', 'smg', 'rifle_assalto', 'shotgun',
  'rifle_atirador', 'rifle_precisao', 'arma_energizada', 'arma_fotons', 'arco',
  'crossbow', 'arma_pesada', 'arma_pesada_area', 'dano_continuo']);
const firearmTypes = new Set(['pistola_revolver', 'smg', 'rifle_assalto', 'shotgun',
  'rifle_atirador', 'rifle_precisao', 'arma_pesada', 'arma_pesada_area']);
const weaponRuleCode = (code: string) => code.trim().toLowerCase().replace(/[\s-]+/g, '_');

export const runWeaponSystemRule = (
  rules: ConfiguracaoCombateSistema['limitesAcoesPorArma'] | undefined, weaponType: string,
) => rules?.find((rule) => weaponRuleCode(rule.tipoArma) === weaponRuleCode(weaponType)) ??
  (firearmTypes.has(weaponRuleCode(weaponType))
    ? rules?.find((rule) => weaponRuleCode(rule.tipoArma) === 'arma_de_fogo') : undefined);

export const runSystemQuantityLimit = (
  entry: RunInventoryEntry, rules: ConfiguracaoCombateSistema | null,
): RunActionQuantityLimit | null => {
  if (entry.tipo === 'MAGIA' || entry.tipo === 'SKILL') return null;
  const rule = runWeaponSystemRule(rules?.limitesAcoesPorArma, entry.weaponType);
  const max = entry.ranged
    ? entry.fireMode === 'RAJADA' ? rule?.maximoRajadas : rule?.maximoTiros
    : rule?.maximoGolpes;
  if (!max || max <= 0) return null;
  return { source: 'Sistema', reason: entry.ranged
    ? entry.fireMode === 'RAJADA' ? 'Rajadas por turno' : 'Tiros por turno'
    : 'Golpes por turno', max };
};

export const runConfiguredAttackLimit = (
  entry: RunInventoryEntry, rules: ConfiguracaoCombateSistema | null,
) => Math.min(100, ...entry.quantityLimits.map((limit) => limit.max),
  runSystemQuantityLimit(entry, rules)?.max ?? 100);

const fixedFireMode = (attributes: Record<string, unknown> | null): 'TIRO' | 'RAJADA' => {
  if (!attributes) return 'TIRO';
  const direct = String(field(attributes, 'modoDisparo') ?? '').toUpperCase();
  if (direct === 'TIRO' || direct === 'RAJADA') return direct;
  const configured = field(object(field(attributes, 'teste')) ?? {}, 'modosDisparo');
  const modes = Array.isArray(configured)
    ? [...new Set(configured.map((mode) => String(mode).toUpperCase())
      .filter((mode) => mode === 'TIRO' || mode === 'RAJADA'))] : [];
  if (modes.length === 1) return modes[0] as 'TIRO' | 'RAJADA';
  if (numeric(field(attributes, 'custoMunicaoRajada')) > 0 &&
    numeric(field(attributes, 'custoMunicaoTiro')) === 0) return 'RAJADA';
  return numeric(field(attributes, 'cadencia')) >= 10 ? 'RAJADA' : 'TIRO';
};

export const parseRunInventoryEntries = (raw: unknown, tipo: RunInventoryKind): RunInventoryEntry[] =>
  entries(raw).flatMap((value) => {
    const item = object(value);
    if (!item) return [];
    const id = field(item, 'id');
    const name = field(item, 'nome');
    if ((typeof id !== 'string' && typeof id !== 'number') || !String(id).trim()) return [];
    if (tipo === 'MAGIA' || tipo === 'SKILL') {
      if (typeof name !== 'string' || !name.trim()) return [];
    }
    const image = field(item, 'imagem');
    const weight = Number(field(item, 'peso'));
    const itemValue = field(item, 'valor');
    const quantity = Number(field(item, 'quantidade') ?? 1);
    const attributes = object(field(item, 'atributos'));
    const declaredTest = object(field(attributes ?? {}, 'teste') ?? field(attributes ?? {}, 'especificacaoTeste') ??
      field(item, 'teste') ?? field(item, 'especificacaoTeste'));
    const hasDeclaredTest = field(attributes ?? {}, 'aplicaTeste') !== false && Boolean(String(field(declaredTest ?? {}, 'codigoTeste') ?? '').trim() ||
      String(field(attributes ?? {}, 'acerto') ?? field(item, 'acerto') ?? '').trim());
    const configuredConditions = field(attributes ?? {}, 'condicoes');
    const conditionEffects = Array.isArray(configuredConditions) ? configuredConditions
      .map(object).filter((condition): condition is Record<string, unknown> => condition !== null) : [];
    const conditions: RunConditionOrigin[] = conditionEffects.flatMap((condition, index) => {
      const code = String(field(condition, 'codigo') ?? '').trim();
      if (!code) return [];
      const numbers = field(condition, 'resultadosNaturais');
      const numberOrUndefined = (key: string) => {
        const value = field(condition, key);
        return value == null || value === '' || !Number.isFinite(Number(value)) ? undefined : Number(value);
      };
      const resistance = object(field(condition, 'testeResistencia'));
      return [{ index, codigo: code, name: String(field(condition, 'nome') ?? code),
        gatilho: String(field(condition, 'gatilho') ?? 'ACERTO').toUpperCase() as RunConditionOrigin['gatilho'],
        alvo: field(condition, 'alvo') as RunConditionOrigin['alvo'],
        valor: numberOrUndefined('valor'), duracao: numberOrUndefined('duracao'),
        valoresEfeitos: object(field(condition, 'valoresEfeitos')) as Record<number, number> | undefined,
        testeResistencia: resistance ? {
          dados: Number(field(resistance, 'dados') ?? 1),
          faces: Number(field(resistance, 'faces') ?? 6),
          atributo: String(field(resistance, 'atributo') ?? ''),
          dificuldade: Number(field(resistance, 'dificuldade') ?? 0),
        } : undefined,
        unidadeDuracao: field(condition, 'unidadeDuracao') as RunConditionOrigin['unidadeDuracao'],
        resultadoNaturalMinimo: numberOrUndefined('resultadoNaturalMinimo'),
        resultadoNaturalMaximo: numberOrUndefined('resultadoNaturalMaximo'),
        resultadosNaturais: Array.isArray(numbers) ? numbers.map(Number).filter((number) => Number.isInteger(number) && number >= 1 && number <= 20) : [],
        codigoResultado: String(field(condition, 'codigoResultado') ?? '') || undefined,
      }];
    });
    const conditionNames = (trigger: string) => conditionEffects
      .filter((condition) => String(field(condition, 'gatilho') ?? 'ACERTO').toUpperCase() === trigger)
      .map((condition) => String(field(condition, 'nome') ?? field(condition, 'codigo') ?? '').trim())
      .filter(Boolean);
    const baseItemId = field(item, 'idItemBase') ?? field(item, 'idMagiaBase') ?? field(item, 'idSkillBase');
    const subtype = String(field(item, 'tipo') ?? '').toLowerCase();
    const restores = attributes && object(field(attributes, 'restaura'));
    const metadata = attributes && object(field(attributes, '__vistaExplodida'));
    const remainingDefense = attributes && object(field(attributes, '__runDefenseRemaining'));
    const fireMode = fixedFireMode(attributes);
    const cadence = numeric(attributes &&
      (field(attributes, 'cadencia') ?? field(attributes, 'ataquesPorTurno'))) || 1;
    const ammoPerUse = fireMode === 'RAJADA'
      ? numeric(attributes && field(attributes, 'custoMunicaoRajada')) || cadence
      : numeric(attributes && field(attributes, 'custoMunicaoTiro')) || 1;
    const ammunition = object(attributes && field(attributes, 'municao'));
    const capacity = numeric(attributes && field(attributes, 'capacidadeMunicao')) ||
      numeric(field(ammunition ?? {}, 'capacidade')) ||
      numeric(attributes && field(attributes, 'municaoAtual')) ||
      numeric(field(ammunition ?? {}, 'atual'));
    const controlsAmmo = Boolean(attributes && (field(attributes, 'controlaMunicao') === true || capacity > 0));
    const magazineLimit = capacity > 0
      ? Math.floor(capacity / ammoPerUse) : controlsAmmo ? 0 : 100;
    const usesUntilRest = numeric(attributes && field(attributes, 'capacidadeUso'));
    const savedUses = attributes && field(attributes, 'capacidadeUsoRestante');
    const remainingUses = usesUntilRest > 0 && savedUses != null
      ? Math.min(usesUntilRest, numeric(savedUses)) : usesUntilRest;
    const ranged = attributes ? String(field(attributes, 'modoModificadores') ?? '').toUpperCase() === 'DISTANCIA' ||
      (!field(attributes, 'modoModificadores') && rangedTypes.has(weaponRuleCode(String(field(attributes, 'tipoArma') ?? '')))) : false;
    const damageRanges = object(attributes && field(attributes, 'danoPorAlcance'));
    const base = numeric(attributes && field(attributes,
      subtype === 'outro' || tipo === 'MAGIA' || tipo === 'SKILL' ? 'dano' : 'danoBase'));
    const accessories = field(attributes ?? {}, 'acessorios');
    const modifierSources = [object(attributes && field(attributes, 'modificadores')),
      ...(Array.isArray(accessories) ? accessories : [])
        .map((accessory) => object(field(object(accessory) ?? {}, 'atributos')))
        .filter((accessory): accessory is Record<string, unknown> => accessory !== null)
        .filter((accessory) => {
          const compatibility = String(field(accessory, 'compatibilidade') ?? '').toUpperCase();
          return !compatibility || compatibility === 'TODAS' || compatibility === (ranged ? 'DISTANCIA' : 'CORPO_A_CORPO');
        }).map((accessory) => object(field(accessory, 'modificadores')))];
    const modifiers = modifierSources.reduce((sum, modifier) =>
      sum + (Number(field(modifier ?? {}, 'dano')) || 0), 0);
    const damage = (range: string) => Math.max(0,
      (range === 'base' ? base : damageRanges && field(damageRanges, range) != null
        ? numeric(field(damageRanges, range)) : base) + modifiers);
    const staminaModifiers = modifierSources.reduce((sum, modifier) =>
      sum + (Number(field(modifier ?? {}, 'estamina')) || 0), 0);
    const quantityLimits: RunActionQuantityLimit[] = [];
    const addItemLimit = (max: number, reason: string) => {
      if (max > 0) quantityLimits.push({ source: 'Item', reason, max });
    };
    if (tipo === 'MAGIA' || tipo === 'SKILL') {
      quantityLimits.push({ source: 'Item', reason: 'Ataques por turno', max: tipo === 'MAGIA'
        ? Math.min(100, numeric(attributes && field(attributes, 'limiteAtaquesPorTurno')) || 1) : 1 });
    } else {
      if (ranged && capacity > 0) quantityLimits.push({
        source: 'Item', reason: 'Capacidade do carregador', max: Math.floor(capacity / ammoPerUse),
      });
      if (ranged && controlsAmmo && capacity === 0) quantityLimits.push({
        source: 'Item', reason: 'Carregador sem capacidade configurada', max: 0,
      });
      if (usesUntilRest > 0) quantityLimits.push({
        source: 'Item', reason: 'Usos por descanso', max: usesUntilRest,
      });
      addItemLimit(numeric(attributes && field(attributes, 'limiteAtaquesPorTurno')), 'Ataques por turno');
      if (ranged) addItemLimit(numeric(attributes && field(attributes,
        fireMode === 'RAJADA' ? 'limiteRajadasPorTurno' : 'limiteTirosPorTurno')),
      fireMode === 'RAJADA' ? 'Rajadas por turno' : 'Tiros por turno');
    }
    const maxAttacks = tipo === 'MAGIA' || tipo === 'SKILL' ? quantityLimits[0].max
      : ranged && controlsAmmo && capacity === 0 ? 0
        : Math.min(100, ...quantityLimits.map((limit) => limit.max));
    return [{ tipo, idInstancia: String(id), name: typeof name === 'string' ? name : 'Sem nome',
      engineerUpgrades: numeric(field(item, '__runEngineerUpgrades')),
      manaPerUse: numeric(field(attributes ?? {}, 'custoMana') ?? field(attributes ?? {}, 'gastoMana') ?? field(item, 'custoMana') ?? field(item, 'gastoMana')),
      cooldownTurns: numeric(field(attributes ?? {}, 'cooldownTurnos')),
      image: typeof image === 'string' ? image : null,
      subtype,
      quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : 0,
      baseItemId: baseItemId == null ? null : String(baseItemId),
      stackSignature: JSON.stringify(Object.fromEntries(Object.entries(attributes ?? {})
        .filter(([key]) => key.toLowerCase() !== '__vistaexplodida'))),
      maxAttacks: Math.max(0, Math.min(maxAttacks, ranged ? magazineLimit : 100,
        usesUntilRest > 0 ? remainingUses : 100)),
      quantityLimits, availableUses: usesUntilRest > 0 ? remainingUses : null,
      ammoPerUse, ammoCapacity: capacity, controlsAmmo,
      staminaPerUse: Math.max(0, numeric(attributes && (tipo === 'MAGIA' || tipo === 'SKILL'
        ? field(attributes, 'custoEstamina') ?? field(attributes, 'gastoEstamina') ?? field(item, 'custoEstamina') ?? field(item, 'gastoEstamina')
        : field(attributes, 'gastoEstaminaPorAtaque'))) + staminaModifiers),
      damageByRange: { base: damage('base'), curta: damage('curta'), media: damage('media'), longa: damage('longa') },
      weaponType: String(field(attributes ?? {}, 'tipoArma') ?? ''),
      fireMode,
      hasDeclaredTest,
      ranged,
      restore: {
        vida: numeric(attributes && field(attributes, 'recuperacaoVida')) || numeric(restores && field(restores, 'vida')),
        mana: numeric(attributes && field(attributes, 'recuperacaoMana')) || numeric(restores && field(restores, 'mana')),
        estamina: numeric(attributes && field(attributes, 'recuperacaoEstamina')) || numeric(restores && field(restores, 'estamina')),
      },
      useConditions: conditionNames('AO_USAR'),
      hitConditions: [...conditionNames('ACERTO'), ...conditionNames('RESULTADO_NATURAL')],
      conditions,
      passiveBonuses: tipo === 'PROTESE' ? Object.fromEntries(Object.entries(object(field(attributes ?? {}, 'bonus')) ?? {})
        .map(([key, value]) => [key, Number(value)]).filter(([, value]) => Number.isFinite(value) && value !== 0)) : undefined,
      defense: {
        escudo: numeric(attributes && field(attributes, subtype === 'traje' || tipo === 'PROTESE' ? 'escudoBase' : 'escudo')),
        protecao: numeric(attributes && field(attributes, subtype === 'traje' || tipo === 'PROTESE' ? 'protecaoBase' : 'protecao')),
        armadura: numeric(attributes && field(attributes, subtype === 'traje' || tipo === 'PROTESE' ? 'armaduraBase' : 'armadura')),
      },
      defenseRemaining: {
        escudo: remainingDefense && field(remainingDefense, 'escudo') != null
          ? numeric(field(remainingDefense, 'escudo')) : numeric(attributes && field(attributes, subtype === 'traje' || tipo === 'PROTESE' ? 'escudoBase' : 'escudo')),
        protecao: remainingDefense && field(remainingDefense, 'protecao') != null
          ? numeric(field(remainingDefense, 'protecao')) : numeric(attributes && field(attributes, subtype === 'traje' || tipo === 'PROTESE' ? 'protecaoBase' : 'protecao')),
      },
      defenseEquipped: Boolean(metadata && field(metadata, 'equippedSlot')),
      value: itemValue == null || !Number.isFinite(Number(itemValue)) ? null : Number(itemValue),
      weight: Number.isFinite(weight) && weight >= 0 && Number.isFinite(quantity) && quantity > 0
        ? weight * quantity : null }];
  });

/** Stash items keep the same inventory kind when they move out of the character's load. */
export const parseRunStoredItems = (raw: unknown): RunInventoryEntry[] => entries(raw).flatMap((item) => {
  const type = String(field(object(item) ?? {}, 'tipo') ?? '').toLowerCase();
  return parseRunInventoryEntries([item], type === 'implante' || type === 'protese' ? 'PROTESE' : 'ITEM');
});

/** Null means the instance must keep its own card (weapons, powers and equipment). */
export const runConsumableStackKey = (entry: RunInventoryEntry): string | null => {
  if (entry.tipo !== 'ITEM' || !['consumiveis', 'outro'].includes(entry.subtype) ||
      !Object.values(entry.restore).some((value) => value > 0) && entry.useConditions.length === 0 ||
      (entry.subtype === 'outro' && (entry.damageByRange.base > 0 ||
        Object.values(entry.defense).some((value) => value > 0)))) return null;
  return JSON.stringify([entry.baseItemId, entry.name, entry.image, entry.value, entry.stackSignature]);
};

/** Only consumables with the same source and effects share a card. */
export const stackRunConsumables = (all: RunInventoryEntry[]): RunInventoryEntry[] => {
  const stacks = new Map<string, RunInventoryEntry>();
  const result: RunInventoryEntry[] = [];
  for (const entry of all) {
    const group = runConsumableStackKey(entry);
    if (group === null) { result.push(entry); continue; }
    const existing = stacks.get(group);
    if (existing) {
      existing.quantity += entry.quantity;
      existing.weight = existing.weight === null || entry.weight === null ? null : existing.weight + entry.weight;
    } else {
      const copy = { ...entry };
      stacks.set(group, copy);
      result.push(copy);
    }
  }
  return result;
};

export const runInventoryTabs: { type: RunInventoryKind; label: string }[] = [
  { type: 'ITEM', label: 'Itens' }, { type: 'PROTESE', label: 'Próteses' },
  { type: 'MAGIA', label: 'Magias' }, { type: 'SKILL', label: 'Skills' },
];

export const runInventoryKey = (entry: GameRunActionSelection) => `${entry.tipo}:${entry.idInstancia}`;

export const maxRunAttackQuantity = (
  entry: RunInventoryEntry, stamina: number, additionalStaminaCost: number, systemLimit = 0,
): number => {
  const maximum = Math.min(entry.maxAttacks, systemLimit > 0 ? systemLimit : 100);
  for (let count = maximum; count >= 1; count -= 1) {
    if (runAttackStaminaCost(entry, count, additionalStaminaCost) <= stamina) return count;
  }
  return 0;
};

export const runAdditionalAttackStaminaCost = (
  entry: RunInventoryEntry, systemCost: number,
): number => entry.ranged
  ? firearmTypes.has(weaponRuleCode(entry.weaponType))
    ? Math.max(entry.staminaPerUse, systemCost)
    : systemCost
  : entry.staminaPerUse;

export const runAttackStaminaCost = (
  entry: RunInventoryEntry, count: number, additionalStaminaCost: number,
): number => {
  const firearm = firearmTypes.has(weaponRuleCode(entry.weaponType));
  const baseCost = firearm && entry.ranged ? 0 : entry.staminaPerUse;
  const extraCost = runAdditionalAttackStaminaCost(entry, additionalStaminaCost);
  return entry.ranged ? baseCost * count + extraCost * Math.max(0, count - 1)
    : extraCost * count;
};
