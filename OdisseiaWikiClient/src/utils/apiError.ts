interface ApiErrorResponse {
  status?: number;
  data?: unknown;
}

const getValidationErrors = (value: unknown): string[] => {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.filter((message): message is string =>
    typeof message === 'string' && Boolean(message.trim()));

  return Object.entries(value as Record<string, unknown>).flatMap(([field, errors]) => {
    if (!Array.isArray(errors)) return [];

    return errors.flatMap((message) => {
      if (typeof message !== 'string' || !message.trim()) return [];
      const readableField = field
        .replace(/\[(\d+)\]/g, (_match, index: string) => ` (item ${Number(index) + 1})`)
        .replace(/\./g, ' › ');
      return [`${readableField}: ${message.trim()}`];
    });
  });
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const response = (error as { response?: ApiErrorResponse } | null)?.response;
  const data = response?.data;

  // Respostas 5xx podem conter detalhes internos no ambiente de desenvolvimento.
  if (response?.status !== undefined && response.status >= 500) {
    const traceId = data && typeof data === 'object'
      ? (data as Record<string, unknown>).traceId : undefined;
    return typeof traceId === 'string' && /^[\w:.-]{1,150}$/.test(traceId)
      ? `${fallback} Referência do erro: ${traceId}.` : fallback;
  }

  if (typeof data === 'string' && data.trim()) return data;

  if (data && typeof data === 'object') {
    const payload = data as Record<string, unknown>;
    const validationErrors = getValidationErrors(payload.errors ?? payload.Errors);
    if (validationErrors.length > 0) return validationErrors.join(' ');

    const candidate = payload.mensagemErro ?? payload.mensagem ?? payload.MensagemErro ?? payload.Mensagem
      ?? payload.detail ?? payload.title;
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  }

  if (!response && error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};
