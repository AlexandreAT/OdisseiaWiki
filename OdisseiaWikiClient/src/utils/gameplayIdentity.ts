/**
 * Character-sheet entries need an identity independent of their position in a
 * JSON array. It is used by the gameplay engine to snapshot an exact item,
 * skill or magia and remains stable when the player reorders the sheet.
 */
export const ensureGameplayEntryIds = <T extends { id?: string }>(entries: T[]): T[] => (
  entries.map((entry) => (
    typeof entry.id === 'string' && entry.id.trim()
      ? entry
      : { ...entry, id: crypto.randomUUID() }
  ))
);
