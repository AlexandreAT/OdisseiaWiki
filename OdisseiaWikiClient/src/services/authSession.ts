import { jwtDecode } from 'jwt-decode';

const SESSION_EXPIRED_MESSAGE_KEY = 'odisseia:session-expired-message';
const SESSION_EXPIRED_MESSAGE = 'Sua sessão expirou. Entre novamente para continuar.';

let sessionExpirationInProgress = false;

interface JwtAuthPayload {
  exp?: number;
  role?: string | string[];
}

export type AuthSession =
  | { status: 'anonymous'; roles: [] }
  | { status: 'authenticated'; roles: string[] };

export const clearAuthSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
};

export const isTokenExpired = (token: string) => {
  try {
    const { exp } = jwtDecode<JwtAuthPayload>(token);
    return typeof exp !== 'number' || exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

export const getAuthSession = (token: string | null): AuthSession => {
  if (!token || isTokenExpired(token)) {
    return { status: 'anonymous', roles: [] };
  }

  try {
    const { role } = jwtDecode<JwtAuthPayload>(token);
    const roles = (Array.isArray(role) ? role : [role])
      .filter((claim): claim is string => typeof claim === 'string')
      .map((claim) => claim.trim())
      .filter(Boolean);

    return { status: 'authenticated', roles };
  } catch {
    return { status: 'anonymous', roles: [] };
  }
};

export const isAuthSessionExpirationInProgress = () => sessionExpirationInProgress;

export const expireAuthSession = () => {
  if (sessionExpirationInProgress) return;

  sessionExpirationInProgress = true;
  clearAuthSession();
  sessionStorage.setItem(SESSION_EXPIRED_MESSAGE_KEY, SESSION_EXPIRED_MESSAGE);
  window.location.replace('/login');
};

export const consumeSessionExpiredMessage = () => {
  const message = sessionStorage.getItem(SESSION_EXPIRED_MESSAGE_KEY);
  sessionStorage.removeItem(SESSION_EXPIRED_MESSAGE_KEY);
  return message;
};
