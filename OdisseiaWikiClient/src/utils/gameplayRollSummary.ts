import type { GameplayRollResult } from '../models/Gameplay';
import { getLegacyAttributeFormulaOutcome } from './gameplayOutcome';

const signedOperation = (value: number) => value >= 0 ? `+ ${value}` : `− ${Math.abs(value)}`;

export const getGameplayRollCalculation = (roll: GameplayRollResult) => {
  const detailedModifiers = (roll.modificadores ?? [])
    .map((modifier) => Number(modifier.valor))
    .filter((value) => Number.isFinite(value) && value !== 0);
  const detailedTotal = detailedModifiers.reduce((total, value) => total + value, 0);
  const remainingModifier = Number(roll.modificador) - detailedTotal;
  const modifiers = remainingModifier !== 0
    ? [...detailedModifiers, remainingModifier]
    : detailedModifiers;

  if (modifiers.length === 0) return String(roll.total);
  const subtotal = Number.isFinite(Number(roll.subtotal))
    ? Number(roll.subtotal)
    : Number(roll.total) - Number(roll.modificador || 0);
  return `${subtotal} ${modifiers.map(signedOperation).join(' ')} = ${roll.total}`;
};

export const getGameplayRollSummary = (roll: GameplayRollResult) => {
  const legacyOutcome = getLegacyAttributeFormulaOutcome(roll);
  const outcome = legacyOutcome === 'success' ? 'Sucesso'
    : legacyOutcome === 'failure' ? 'Falha'
      : roll.codigoResultado?.trim().toUpperCase() === 'FORMULA' ? ''
        : roll.nomeResultado?.trim();
  const calculation = getGameplayRollCalculation(roll);
  return outcome ? `${outcome}: ${calculation}` : calculation;
};

export const getGameplayModifierSummary = (roll: GameplayRollResult) => (
  (roll.modificadores ?? [])
    .filter((modifier) => Number.isFinite(modifier.valor) && modifier.valor !== 0)
    .map((modifier) => `${modifier.nome || modifier.codigo || 'Modificador'} ${modifier.valor > 0 ? '+' : ''}${modifier.valor}`)
    .join(' · ')
);
