const configuration = (json?: string | null): Record<string, unknown> => {
  try {
    const value: unknown = JSON.parse(json || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  } catch { return {}; }
};

/** Presentation metadata lives beside the condition's existing versioned effects. */
export const conditionImage = (json?: string | null): string | undefined => {
  const value = configuration(json).imagem;
  return typeof value === 'string' && value.trim() ? value : undefined;
};

export const withConditionImage = (json: string | null | undefined, image?: string): string => {
  const value = configuration(json);
  if (image) value.imagem = image;
  else delete value.imagem;
  return JSON.stringify(value);
};
