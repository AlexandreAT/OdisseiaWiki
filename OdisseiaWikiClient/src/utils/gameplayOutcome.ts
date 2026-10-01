import type { GameplayEvent, GameplayRollResult } from '../models/Gameplay';

export type GameplayOutcomeTone = 'success' | 'failure' | 'neutral';

type RollOutcomeInput = (Pick<GameplayRollResult, 'codigoResultado' | 'nomeResultado'>
  & Partial<Pick<GameplayRollResult, 'total' | 'dificuldade' | 'origemAcao'>>)
  | null | undefined;

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

/** Compatibilidade com eventos antigos de atributo gravados como FORMULA. */
export const getLegacyAttributeFormulaOutcome = (roll: RollOutcomeInput): GameplayOutcomeTone => {
  if (!roll || normalize(roll.codigoResultado) !== 'FORMULA'
    || normalize(roll.origemAcao?.tipo) !== 'ATRIBUTO') return 'neutral';
  const target = roll.dificuldade?.alvo;
  const total = roll.total;
  if (typeof target !== 'number' || !Number.isFinite(target)
    || typeof total !== 'number' || !Number.isFinite(total)) return 'neutral';
  const success = (() => {
    switch (roll.dificuldade?.comparador) {
      case '>': return total > target;
      case '>=': return total >= target;
      case '<': return total < target;
      case '<=': return total <= target;
      default: return null;
    }
  })();
  return success === null ? 'neutral' : success ? 'success' : 'failure';
};

/** Only a declared test outcome determines the color; a large roll is not necessarily a success. */
export const getGameplayRollOutcome = (
  roll: RollOutcomeInput,
  actionCode?: string | null,
): GameplayOutcomeTone => {
  if (normalize(actionCode).startsWith('XP ') || !roll) return 'neutral';

  const code = normalize(roll.codigoResultado);
  if (code === 'XP CALCULADO' || code === 'RESULTADO MANUAL') return 'neutral';
  if (code === 'FORMULA') return getLegacyAttributeFormulaOutcome(roll);

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
