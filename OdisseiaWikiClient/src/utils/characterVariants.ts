import type { PersonagemStatus, PersonagemVariante } from '../models/Characters';
import { isJSONContent } from './richTextHelpers';
import { normalizeCharacterStatusExtras } from './characterStatus';

export type CharacterVariantSheet = Omit<PersonagemVariante, 'id' | 'nome'>;

export function normalizeVariantForEditing(variant: PersonagemVariante): PersonagemVariante {
  const parseRichText = (value: unknown) => {
    if (typeof value !== 'string') return isJSONContent(value) ? value : '';
    try {
      const parsed = JSON.parse(value);
      return isJSONContent(parsed) ? parsed : value;
    } catch { return value; }
  };
  return {
    ...variant,
    inventarioJson: variant.inventarioJson.map(item => ({ ...item, descricao: parseRichText(item.descricao) })),
    skills: variant.skills.map(skill => ({ ...skill, efeito: parseRichText(skill.efeito ?? skill.atributos?.__efeitoRichText) })),
    magia: variant.magia.map(spell => ({ ...spell, efeito: parseRichText(spell.efeito ?? spell.atributos?.__efeitoRichText) })),
  };
}

/** Old characters have no variant metadata and remain unique. */
export function getCharacterVariants(value: unknown): PersonagemVariante[] {
  try {
    const status = (typeof value === 'string' ? JSON.parse(value) : value) as PersonagemStatus | null;
    return status?.generico && Array.isArray(status.variantes) ? status.variantes : [];
  } catch {
    return [];
  }
}

export function createCharacterVariant(sheet: CharacterVariantSheet): PersonagemVariante {
  const { generico: _generic, variantes: _variants, ...status } = sheet.statusJson as PersonagemStatus;
  return structuredClone({ ...sheet, statusJson: status, id: crypto.randomUUID(), nome: '' });
}

export function findInvalidVariant(variants: PersonagemVariante[]): number {
  return variants.findIndex(variant => !variant.nome.trim() || variant.nome.trim().length > 100);
}

/** The first sheet stays available to existing catalogs/comparisons and API consumers. */
export function buildCharacterVariantFields(variants: PersonagemVariante[]) {
  if (!variants.length) throw new Error('Adicione uma variante.');
  return {
    statusJson: { ...variants[0].statusJson, ...normalizeCharacterStatusExtras(variants[0].statusJson), generico: true, variantes: variants },
    inventarioJson: variants[0].inventarioJson,
    skills: variants[0].skills,
    magia: variants[0].magia,
  };
}
