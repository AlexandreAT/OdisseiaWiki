import type { GameplayRollResult } from '../../../models/Gameplay';

export interface VisualDieResult {
  value: number;
  kept: boolean;
  discarded: boolean;
}

// Preserve the server's original die order, including both values in advantage/disadvantage.
export const getVisualDiceResults = (roll: GameplayRollResult | null): VisualDieResult[] =>
  roll?.grupos.flatMap((group) => group.valores.map((value, index) => ({
    value,
    kept: group.indicesMantidos.includes(index),
    discarded: group.indicesDescartados.includes(index),
  }))) ?? [];
