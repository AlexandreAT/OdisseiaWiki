const REMEMBERED_LOGIN_COOKIE = 'odisseia:last-manual-login';
const LEGACY_REMEMBERED_LOGIN_KEY = 'odisseia:last-manual-user';
const REMEMBERED_LOGIN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const readCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;

  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));

  if (!cookie) return null;

  try {
    return decodeURIComponent(cookie.slice(prefix.length));
  } catch {
    return null;
  }
};

const writeCookie = (value: string, maxAge: number) => {
  if (typeof document === 'undefined') return;

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${REMEMBERED_LOGIN_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
};

export const getRememberedManualLogin = (): string => {
  const rememberedLogin = readCookie(REMEMBERED_LOGIN_COOKIE)?.trim();
  if (rememberedLogin) return rememberedLogin;

  if (typeof window === 'undefined') return '';

  const legacyLogin = localStorage.getItem(LEGACY_REMEMBERED_LOGIN_KEY)?.trim();
  if (!legacyLogin) return '';

  writeCookie(legacyLogin, REMEMBERED_LOGIN_MAX_AGE_SECONDS);
  localStorage.removeItem(LEGACY_REMEMBERED_LOGIN_KEY);
  return legacyLogin;
};

export const rememberManualLogin = (login: string) => {
  const normalizedLogin = login.trim();
  if (!normalizedLogin) {
    forgetRememberedManualLogin();
    return;
  }

  writeCookie(normalizedLogin, REMEMBERED_LOGIN_MAX_AGE_SECONDS);
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LEGACY_REMEMBERED_LOGIN_KEY);
  }
};

export const forgetRememberedManualLogin = () => {
  writeCookie('', 0);
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LEGACY_REMEMBERED_LOGIN_KEY);
  }
};
