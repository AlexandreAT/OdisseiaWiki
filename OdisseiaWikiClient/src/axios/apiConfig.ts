const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

if (!configuredApiUrl && import.meta.env.PROD) {
  throw new Error('VITE_API_URL não foi configurada para o build de produção.');
}

export const apiUrl = (configuredApiUrl || 'http://localhost:5146/api').replace(/\/$/, '');

if (!/^https?:\/\//i.test(apiUrl)) {
  throw new Error('VITE_API_URL deve ser uma URL HTTP(S) absoluta.');
}

export const healthUrl = `${new URL(apiUrl).origin}/health`;
export const API_REQUEST_TIMEOUT_MS = 20_000;
