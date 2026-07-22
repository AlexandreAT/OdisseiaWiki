/**
 * Global Form Constants - Shared across all forms in the application
 * This is the single source of truth for form option values
 */

import type { ArmaTipo, ArmaTipoDano, ItemTipo, TrajeTipo } from './models/Itens';
import type { DadoAcerto } from './models/Dados';

// Character Traits - Used in FormCharacter and CharacterCreate
export const TRAITS_OPTIONS = [
  { value: 'bravo', label: 'Bravo' },
  { value: 'curioso', label: 'Curioso' },
  { value: 'ambicioso', label: 'Ambicioso' },
  { value: 'leal', label: 'Leal' },
  { value: 'orgulhoso', label: 'Orgulhoso' },
  { value: 'calculista', label: 'Calculista' },
  { value: 'bondoso', label: 'Bondoso' },
  { value: 'impulsivo', label: 'Impulsivo' },
];

// Character Alignment - Used in FormCharacter and CharacterCreate
export const ALIGNMENT_OPTIONS = [
  { value: 'leal_bondoso', label: 'Leal e Bondoso' },
  { value: 'neutro_bondoso', label: 'Neutro e Bondoso' },
  { value: 'caotico_bondoso', label: 'Caótico e Bondoso' },
  { value: 'leal_neutro', label: 'Leal Neutro' },
  { value: 'neutro', label: 'Neutro Puro' },
  { value: 'caotico_neutro', label: 'Caótico Neutro' },
  { value: 'leal_mal', label: 'Leal e Maligno' },
  { value: 'neutro_mal', label: 'Neutro e Maligno' },
  { value: 'caotico_mal', label: 'Caótico e Maligno' },
];

// Item Types - Used in FormItem
export const ITEM_TIPO_OPTIONS: { value: ItemTipo; label: string }[] = [
  { value: 'arma', label: 'Arma' },
  { value: 'traje', label: 'Traje' },
  { value: 'consumiveis', label: 'Consumível' },
  { value: 'acessorio', label: 'Acessório' },
  { value: 'implante', label: 'Prótese / Implante' },
  { value: 'outro', label: 'Outro' },
];

export const TRAJE_TIPO_OPTIONS: { value: TrajeTipo; label: string }[] = [
  { value: 'colete', label: 'Colete' },
  { value: 'traje', label: 'Traje completo' },
  { value: 'armor_core', label: 'ArmorCore' },
];

const TRAJE_TIPO_ALIASES: Record<string, TrajeTipo> = {
  colete: 'colete',
  vest: 'colete',
  traje: 'traje',
  traje_completo: 'traje',
  armorcore: 'armor_core',
  armor_core: 'armor_core',
  'armor-core': 'armor_core',
};

export const normalizeTrajeTipo = (value: unknown): TrajeTipo | undefined => {
  const normalized = String(value ?? '')
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');

  return TRAJE_TIPO_ALIASES[normalized];
};

export const ACERTO_DADO_OPTIONS: { value: DadoAcerto; label: string }[] = [
  { value: 'D6', label: 'D6' },
  { value: 'D8', label: 'D8' },
  { value: 'D20', label: 'D20' },
];

export const normalizeDadoAcerto = (value: unknown): DadoAcerto | '' => {
  const normalized = String(value ?? '').trim().toUpperCase().replace(/^1(?=D)/, '');
  return ACERTO_DADO_OPTIONS.some((option) => option.value === normalized)
    ? normalized as DadoAcerto
    : '';
};

export const ARMA_TIPO_OPTIONS: { value: ArmaTipo; label: string }[] = [
  { value: 'pistola_revolver', label: 'Arma de fogo — Pistola / Revólver' },
  { value: 'smg', label: 'Arma de fogo — SMG' },
  { value: 'rifle_assalto', label: 'Arma de fogo — Rifle de assalto' },
  { value: 'shotgun', label: 'Arma de fogo — Shotgun' },
  { value: 'rifle_atirador', label: 'Arma de fogo — Rifle de atirador' },
  { value: 'rifle_precisao', label: 'Arma de fogo — Rifle de precisão' },
  { value: 'arma_branca_comum', label: 'Arma branca — Comum' },
  { value: 'arma_branca_menor', label: 'Arma branca — Menor' },
  { value: 'arma_energizada', label: 'Arma branca — Energizada' },
  { value: 'arma_fotons', label: 'Arma branca — Fótons' },
  { value: 'sabre_luz', label: 'Arma branca — Sabre de luz' },
  { value: 'desarmado', label: 'Corpo a corpo — Desarmado' },
  { value: 'protese', label: 'Corpo a corpo — Prótese' },
  { value: 'soco_ingles', label: 'Corpo a corpo — Soco inglês' },
  { value: 'dano_continuo', label: 'Arma de dano contínuo' },
  { value: 'arco', label: 'Arco' },
  { value: 'crossbow', label: 'Crossbow / Besta' },
  { value: 'arma_pesada', label: 'Arma pesada' },
  { value: 'arma_pesada_area', label: 'Arma pesada — Dano em área' },
];

export const ARMA_TIPO_DANO_OPTIONS: { value: ArmaTipoDano; label: string }[] = [
  { value: 'cortante', label: 'Cortante' },
  { value: 'impacto_projetil', label: 'Projétil' },
  { value: 'perfuracao', label: 'Perfurante' },
  { value: 'continuo', label: 'Contínuo' },
  { value: 'impacto', label: 'Impacto' },
  { value: 'magico', label: 'Mágico' },
  { value: 'area', label: 'Área' },
  { value: 'verdadeiro', label: 'Verdadeiro' },
  { value: 'queda', label: 'Queda' },
];

export type ArmaDamageField = 'base' | 'curta' | 'media' | 'longa' | 'emArea' | 'preciso';

export interface ArmaDamageDisplayConfig {
  fields: readonly ArmaDamageField[];
  scaleMaximum: number;
  scaleMaximumByField?: Partial<Record<ArmaDamageField, number>>;
  commonMaximum?: number;
  commonMaximumByField?: Partial<Record<ArmaDamageField, number>>;
}

/**
 * A escala representa o teto do arquétipo amplo, enquanto commonMaximum marca
 * o maior valor encontrado nos itens comuns daquela categoria específica.
 */
export const ARMA_DAMAGE_DISPLAY_CONFIG: Record<ArmaTipo, ArmaDamageDisplayConfig> = {
  pistola_revolver: {
    fields: ['curta', 'media', 'longa'],
    scaleMaximum: 1000,
    scaleMaximumByField: { curta: 1000, media: 350, longa: 500 },
    commonMaximumByField: { curta: 250, media: 120, longa: 150 },
  },
  smg: {
    fields: ['curta', 'media', 'longa'],
    scaleMaximum: 1000,
    scaleMaximumByField: { curta: 1000, media: 350, longa: 500 },
    commonMaximumByField: { curta: 150, media: 125, longa: 80 },
  },
  rifle_assalto: {
    fields: ['curta', 'media', 'longa'],
    scaleMaximum: 1000,
    scaleMaximumByField: { curta: 1000, media: 350, longa: 500 },
    commonMaximumByField: { curta: 80, media: 200, longa: 125 },
  },
  shotgun: {
    fields: ['curta', 'media'],
    scaleMaximum: 1000,
    scaleMaximumByField: { curta: 1000, media: 350 },
    commonMaximumByField: { curta: 550, media: 100 },
  },
  rifle_atirador: {
    fields: ['curta', 'media', 'longa'],
    scaleMaximum: 1000,
    scaleMaximumByField: { curta: 1000, media: 350, longa: 500 },
    commonMaximumByField: { curta: 500, media: 350, longa: 450 },
  },
  rifle_precisao: {
    fields: ['curta', 'media', 'longa'],
    scaleMaximum: 1000,
    scaleMaximumByField: { curta: 1000, media: 350, longa: 500 },
    commonMaximumByField: { curta: 1000, media: 200, longa: 500 },
  },
  arma_branca_comum: { fields: ['base'], scaleMaximum: 700, commonMaximum: 250 },
  arma_branca_menor: { fields: ['base'], scaleMaximum: 700, commonMaximum: 150 },
  arma_energizada: { fields: ['base'], scaleMaximum: 700, commonMaximum: 400 },
  arma_fotons: { fields: ['base'], scaleMaximum: 700, commonMaximum: 500 },
  sabre_luz: { fields: ['base'], scaleMaximum: 700, commonMaximum: 700 },
  desarmado: { fields: ['base'], scaleMaximum: 700, commonMaximum: 100 },
  protese: { fields: ['base'], scaleMaximum: 700, commonMaximum: 200 },
  soco_ingles: { fields: ['base'], scaleMaximum: 700, commonMaximum: 200 },
  dano_continuo: { fields: ['base'], scaleMaximum: 400, commonMaximum: 400 },
  arco: {
    fields: ['curta', 'media', 'longa'],
    scaleMaximum: 400,
    scaleMaximumByField: { curta: 100, media: 300, longa: 400 },
    commonMaximumByField: { curta: 100, media: 300, longa: 400 },
  },
  crossbow: {
    fields: ['curta', 'media', 'longa'],
    scaleMaximum: 400,
    scaleMaximumByField: { curta: 100, media: 300, longa: 400 },
    commonMaximumByField: { curta: 100, media: 250, longa: 350 },
  },
  arma_pesada: {
    fields: ['curta', 'media', 'longa'],
    scaleMaximum: 1800,
    scaleMaximumByField: { curta: 1800, media: 800, longa: 400 },
    commonMaximumByField: { curta: 1800, media: 800, longa: 400 },
  },
  arma_pesada_area: {
    fields: ['emArea', 'preciso'],
    scaleMaximum: 6000,
    scaleMaximumByField: { emArea: 2000, preciso: 6000 },
    commonMaximumByField: { emArea: 2000, preciso: 6000 },
  },
};

export const ARMA_DAMAGE_FALLBACK_CONFIG: ArmaDamageDisplayConfig = {
  fields: ['base', 'curta', 'media', 'longa', 'emArea', 'preciso'],
  scaleMaximum: 6000,
  scaleMaximumByField: {
    base: 700,
    curta: 1800,
    media: 800,
    longa: 500,
    emArea: 2000,
    preciso: 6000,
  },
};

const ARMA_TIPO_ALIASES: Partial<Record<string, ArmaTipo>> = {
  pistola: 'pistola_revolver',
  pistolas: 'pistola_revolver',
  revolver: 'pistola_revolver',
  revolveres: 'pistola_revolver',
  pistola_revolver: 'pistola_revolver',
  pistolas_revolveres: 'pistola_revolver',
  rifle_de_assalto: 'rifle_assalto',
  rifle_de_atirador: 'rifle_atirador',
  rifle_de_precisao: 'rifle_precisao',
  arma_branca: 'arma_branca_comum',
  arma_de_dano_continuo: 'dano_continuo',
  besta: 'crossbow',
  arma_pesada_dano_em_area: 'arma_pesada_area',
};

const normalizeOptionKey = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

export const normalizeArmaTipo = (value: unknown): ArmaTipo | undefined => {
  if (typeof value === 'number') return ARMA_TIPO_OPTIONS[value]?.value;
  if (typeof value !== 'string' || !value.trim()) return undefined;

  const normalized = normalizeOptionKey(value);
  const direct = ARMA_TIPO_OPTIONS.find((option) => normalizeOptionKey(option.value) === normalized);
  if (direct) return direct.value;

  const byLabel = ARMA_TIPO_OPTIONS.find((option) => normalizeOptionKey(option.label) === normalized);
  return byLabel?.value ?? ARMA_TIPO_ALIASES[normalized];
};

export const ARMA_TIPOS_DE_FOGO: readonly ArmaTipo[] = [
  'pistola_revolver',
  'smg',
  'rifle_assalto',
  'shotgun',
  'rifle_atirador',
  'rifle_precisao',
  'arma_pesada',
  'arma_pesada_area',
];

export const isArmaDeFogo = (tipo?: ArmaTipo) => (
  tipo ? ARMA_TIPOS_DE_FOGO.includes(tipo) : false
);

export const getPrimeiroAtaqueComGastoEstamina = (tipo?: ArmaTipo) => (
  isArmaDeFogo(tipo) ? 2 : 1
);

// Race Attributes - Used in FormRace
export const ATRIBUTO_OPTIONS = [
  { value: 'Força', label: 'Força' },
  { value: 'Agilidade', label: 'Agilidade' },
  { value: 'Resistência', label: 'Resistência' },
  { value: 'Sabedoria', label: 'Sabedoria' },
  { value: 'Precisão', label: 'Precisão' },
  { value: 'Inteligência', label: 'Inteligência' },
];

// Total steps for character creation
export const TOTAL_STEPS = 2;
