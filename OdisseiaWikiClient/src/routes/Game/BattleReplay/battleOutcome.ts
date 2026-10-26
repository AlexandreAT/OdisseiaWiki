import type { GameBattlePreview } from '../../../models/GameBattlePreview';

export const endingLabel = (reason: GameBattlePreview['resultado']['endReason']): string => ({
  ActorDefeated: 'um combatente foi derrotado',
  RoundLimit: 'o combate foi encerrado',
  EventLimit: 'o limite de eventos foi alcançado',
  NoDamage: '10 turnos consecutivos sem alteração de status',
}[reason]);

export const battleWinner = (preview: GameBattlePreview): string | null =>
  preview.resultado.endReason && preview.resultado.endReason !== 'ActorDefeated'
    ? null : preview.resultado.winnerActorId;
