export interface CharacterStatusExtras {
  pontos: number;
  pontosAtributo: number;
  pontosSkill: number;
  pontosUltimate: number;
  condicioes: string[];
}

export const DEFAULT_CHARACTER_STATUS_EXTRAS: CharacterStatusExtras = {
  pontos: 0,
  pontosAtributo: 0,
  pontosSkill: 0,
  pontosUltimate: 0,
  condicioes: [],
};

export const normalizeCharacterStatusExtras = (status: unknown): CharacterStatusExtras => {
  const source = status && typeof status === 'object' ? status as Record<string, unknown> : {};
  const toNumber = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;

  return {
    pontos: toNumber(source.pontos),
    pontosAtributo: toNumber(source.pontosAtributo),
    pontosSkill: toNumber(source.pontosSkill),
    pontosUltimate: toNumber(source.pontosUltimate),
    condicioes: Array.isArray(source.condicioes)
      ? source.condicioes.filter((condition): condition is string => typeof condition === 'string')
      : [],
  };
};
