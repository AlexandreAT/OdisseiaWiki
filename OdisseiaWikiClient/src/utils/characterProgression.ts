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

export interface CharacterProgressionConfig {
  nivelMaximo?: number;
  permiteXpExcedente?: boolean;
  niveis?: Array<{
    nivel: number;
    xpParaProximoNivel: number;
  }>;
}

export interface CharacterProgressionSnapshot {
  level: number;
  xp: number;
  maximumLevel: number;
  isMaximumLevel: boolean;
  requiredXp: number;
  progress: number;
  readyToLevel: boolean;
  usesLegacyFallback: boolean;
}

export const resolveCharacterProgression = (
  level: number,
  xp: number,
  config?: CharacterProgressionConfig | null,
): CharacterProgressionSnapshot => {
  const normalizedLevel = Math.max(1, Math.trunc(Number(level) || 1));
  const normalizedXp = Math.max(0, Number(xp) || 0);
  const configuredMaximum = Math.trunc(Number(config?.nivelMaximo));
  const maximumLevel = configuredMaximum > 0 ? configuredMaximum : DEFAULT_MAX_CHARACTER_LEVEL;
  const isMaximumLevel = normalizedLevel >= maximumLevel;
  const levelReference = config?.niveis?.find((reference) => reference.nivel === normalizedLevel);
  const configuredRequiredXp = Number(levelReference?.xpParaProximoNivel);
  const usesLegacyFallback = !isMaximumLevel && !(configuredRequiredXp > 0);
  const requiredXp = isMaximumLevel
    ? 0
    : usesLegacyFallback
      ? getDefaultXpRequiredForLevel(normalizedLevel)
      : configuredRequiredXp;
  const progress = isMaximumLevel
    ? 100
    : Math.min(100, Math.max(0, (normalizedXp / Math.max(requiredXp, 1)) * 100));

  return {
    level: normalizedLevel,
    xp: normalizedXp,
    maximumLevel,
    isMaximumLevel,
    requiredXp,
    progress,
    readyToLevel: !isMaximumLevel && normalizedXp >= requiredXp,
    usesLegacyFallback,
  };
};
