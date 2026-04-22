/**
 * Global Form Constants - Shared across all forms in the application
 * This is the single source of truth for form option values
 */

import { ItemTipo } from './models/Itens';

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
  { value: 'outro', label: 'Outro' },
];

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
