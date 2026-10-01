/** Contexto de rota da Wiki. Mantém os formulários e leitores reutilizáveis
 * sem permitir que uma tela de Mesa use acidentalmente os endpoints globais. */
export const getMesaWikiIdFromPath = (): number | null => {
  if (typeof window === 'undefined') return null;
  const match = window.location.pathname.match(/^\/mesa\/(\d+)\/wiki(?:\/|$)/i);
  const idMesa = Number(match?.[1]);
  return Number.isInteger(idMesa) && idMesa > 0 ? idMesa : null;
};

export const getMesaWikiApiPath = (resource: string, fallback: string): string => {
  const idMesa = getMesaWikiIdFromPath();
  return idMesa ? `/mesas/${idMesa}/wiki/${resource}` : fallback;
};

export const getMesaWikiApiPathForMesa = (idMesa: number, resource: string): string =>
  `/mesas/${idMesa}/wiki/${resource}`;

export const getMesaWikiRoute = (route: string): string => {
  const idMesa = getMesaWikiIdFromPath();
  if (!idMesa) return route;

  const normalized = route.startsWith('/') ? route : `/${route}`;
  if (normalized === '/wiki' || normalized === '/wiki/') return `/mesa/${idMesa}/wiki`;
  if (normalized.startsWith('/wiki/')) return `/mesa/${idMesa}/wiki/${normalized.slice('/wiki/'.length)}`;
  return `/mesa/${idMesa}/wiki${normalized}`;
};
