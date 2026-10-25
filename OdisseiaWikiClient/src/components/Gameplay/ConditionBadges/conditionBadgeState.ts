export interface ActiveConditionDisplay {
  code: string;
  name: string;
  image?: string | null;
  remainingTurns?: number | null;
  remainingHours?: number | null;
}

export const snapshotConditions = (raw: unknown): ActiveConditionDisplay[] => {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry) => entry && typeof entry === 'object' && entry.rule?.code ? [{
    code: String(entry.rule.code), name: String(entry.rule.name || entry.rule.code),
    image: typeof entry.rule.image === 'string' ? entry.rule.image : null,
    remainingTurns: entry.remainingTurns, remainingHours: entry.remainingHours,
  }] : []);
};
