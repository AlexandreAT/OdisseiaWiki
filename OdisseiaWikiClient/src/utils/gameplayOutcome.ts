import type { GameplayEvent, GameplayRollResult } from '../models/Gameplay';

export type GameplayOutcomeTone = 'success' | 'failure' | 'neutral';

type RollOutcomeInput = Pick<GameplayRollResult, 'codigoResultado' | 'nomeResultado'> | null | undefined;

const normalize = (value: string | null | undefined) => (value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, ' ')
  .trim();

const hasOutcomeWord = (value: string, words: string[]) => words.some((word) =>
  new RegExp(`(?:^| )${word}(?: |$)`).test(value));

const FAILURE_WORDS = ['FALHA', 'FRACASSO', 'ERRO', 'DESASTRE', 'INSUCESSO'];
const SUCCESS_WORDS = ['SUCESSO', 'ACERTO', 'CRITICO', 'EXITO'];

/** Only a declared test outcome determines the color; a large roll is not necessarily a success. */
export const getGameplayRollOutcome = (
  roll: RollOutcomeInput,
  actionCode?: string | null,
): GameplayOutcomeTone => {
  if (normalize(actionCode).startsWith('XP ') || !roll) return 'neutral';

  const code = normalize(roll.codigoResultado);
  if (code === 'XP CALCULADO' || code === 'RESULTADO MANUAL') return 'neutral';

  const semantic = `${code} ${normalize(roll.nomeResultado)}`.trim();
  if (hasOutcomeWord(semantic, FAILURE_WORDS)) return 'failure';
  if (hasOutcomeWord(semantic, SUCCESS_WORDS)) return 'success';
  return 'neutral';
};

export const getGameplayEventOutcome = (
  event: Pick<GameplayEvent, 'rolagem' | 'codigoAcao' | 'oculto' | 'manual'>,
): GameplayOutcomeTone => (
  event.oculto || event.manual
    ? 'neutral'
    : getGameplayRollOutcome(event.rolagem, event.codigoAcao)
);
