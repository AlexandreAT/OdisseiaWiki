interface ApiErrorResponse {
  status?: number;
  data?: unknown;
}

const getFirstValidationError = (value: unknown): string | undefined => {
  if (!value || typeof value !== 'object') return undefined;

  for (const errors of Object.values(value as Record<string, unknown>)) {
    if (Array.isArray(errors) && typeof errors[0] === 'string' && errors[0].trim()) {
      return errors[0];
    }
  }

  return undefined;
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const response = (error as { response?: ApiErrorResponse } | null)?.response;
  const data = response?.data;

  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  // Respostas 5xx podem conter detalhes internos no ambiente de desenvolvimento.
  if (response?.status !== undefined && response.status >= 500) {
    return fallback;
  }

  if (data && typeof data === 'object') {
    const payload = data as Record<string, unknown>;
    const candidate = payload.mensagemErro ?? payload.mensagem ?? payload.detail ?? payload.title;
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }

    const validationError = getFirstValidationError(payload.errors);
    if (validationError) return validationError;
  }

  if (!response && error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};
