import type { GameRunConsumeItemResult } from '../../../models/GameRun';
import type { RunInventoryEntry } from './runInventoryEntries';

export const isHealingConsumable = (entry: RunInventoryEntry): boolean =>
  entry.tipo === 'ITEM' && ['consumiveis', 'outro'].includes(entry.subtype) &&
  Object.values(entry.restore).some((value) => value > 0);

export const describeConsumableResult = (result: GameRunConsumeItemResult): string =>
  `${result.nomeItem}: ${[
    result.vidaRecuperada > 0 && `+${result.vidaRecuperada} vida`,
    result.manaRecuperada > 0 && `+${result.manaRecuperada} mana`,
    result.estaminaRecuperada > 0 && `+${result.estaminaRecuperada} estamina`,
  ].filter(Boolean).join(', ')}. ${result.quantidadeRestante > 0
    ? `Restam ${result.quantidadeRestante}.` : 'Última unidade consumida.'}`;
