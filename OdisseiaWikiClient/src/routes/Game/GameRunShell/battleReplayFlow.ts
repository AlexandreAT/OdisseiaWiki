export type CombatOrigin = 'current' | 'history';

export const shouldAutoCloseCombat = (origin: CombatOrigin, speed: 1 | 2): boolean =>
  origin === 'current' && speed === 2;
