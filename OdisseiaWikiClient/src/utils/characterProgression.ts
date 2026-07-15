export const DEFAULT_MAX_CHARACTER_LEVEL = 20;

export const getDefaultXpRequiredForLevel = (level: number): number => {
  const normalizedLevel = Number.isFinite(level)
    ? Math.max(1, Math.trunc(level))
    : 1;

  if (normalizedLevel >= DEFAULT_MAX_CHARACTER_LEVEL) return 0;
  if (normalizedLevel >= 16) return 40;
  if (normalizedLevel >= 13) return 30;
  if (normalizedLevel >= 10) return 25;
  if (normalizedLevel >= 7) return 20;
  return 10;
};
