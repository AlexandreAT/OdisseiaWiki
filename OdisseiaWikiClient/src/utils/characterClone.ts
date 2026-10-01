import type { PersonagemVariante } from '../models/Characters';

export const cloneCharacterName = (name: string) => {
  const prefix = 'Clone ';
  return `${prefix}${name.trim().slice(0, 100 - prefix.length).trimEnd()}`;
};

/** Entries belong to the new sheet, even when they refer to the same catalog item. */
export const cloneCharacterEntries = <T extends { id?: string }>(entries: T[]): T[] =>
  entries.map((entry) => ({ ...structuredClone(entry), id: crypto.randomUUID() }));

/** A copied item keeps its snapshot but must not point to a missing catalog entry. */
export const detachUnavailableBaseItems = <T extends { idItemBase?: string }>(
  entries: T[], availableIds: ReadonlySet<string>,
): T[] => entries.map((entry) => entry.idItemBase && !availableIds.has(String(entry.idItemBase))
  ? { ...entry, idItemBase: undefined }
  : entry);

export const cloneCharacterVariants = (variants: PersonagemVariante[]): PersonagemVariante[] =>
  variants.map((variant) => ({
    ...structuredClone(variant),
    id: crypto.randomUUID(),
    inventarioJson: cloneCharacterEntries(variant.inventarioJson),
    skills: cloneCharacterEntries(variant.skills),
    magia: cloneCharacterEntries(variant.magia),
  }));
