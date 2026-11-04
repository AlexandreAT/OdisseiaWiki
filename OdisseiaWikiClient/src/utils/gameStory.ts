import type { GameStoryCost, GameStoryOutcome } from '../models/GameStory';
import type { GameRunMap } from '../models/GameRun';
import type { GameModeArea } from '../models/GameModeManagement';

export const storyRoutes = (areas: GameModeArea[]) => areas.flatMap(area =>
  area.options.flatMap(option => [option, ...(option.surpriseOptions ?? [])]));

export const runResultPresentation = (status: string) => status === 'Vitoria'
  ? { title: 'Parabéns!', label: 'Jornada concluída', description: 'venceu esta jornada.' }
  : status === 'Abandonada'
    ? { title: 'Retirada', label: 'Jornada abandonada', description: 'deixou esta jornada.' }
    : { title: 'Fim da jornada', label: 'Jornada encerrada', description: 'não sobreviveu a esta jornada.' };

export function activeStoryMissions(map: GameRunMap): string[] {
  const missions: string[] = [];
  let current: GameRunMap | null | undefined = map;
  while (current) {
    const portal = (current.parentMap?.nodes ?? current.parentNodes)?.find(node => node.id === current?.secretReturnNodeId);
    if (portal?.type === 'MISSAO' && portal.payload?.storyChoice === 'ACCEPT' && !portal.payload.missionCompleted)
      missions.push(portal.name ?? 'Missão');
    current = current.parentMap;
  }
  return missions.reverse();
}

export const emptyStoryCost = (): GameStoryCost => ({ currency: 0, life: 0, mana: 0, stamina: 0 });
export const emptyStoryOutcome = (): GameStoryOutcome => ({ ...emptyStoryCost(), xp: 0, percentage: false, gameMinutes: 0, items: [], conditions: [] });
export function storyCostText(cost: GameStoryCost): string {
  return ([[cost.currency, 'moedas'], [cost.life, 'vida'], [cost.mana, 'mana'], [cost.stamina, 'estamina']] as const)
    .filter(([value]) => value > 0).map(([value, name]) => `${value.toLocaleString('pt-BR')} ${name}`).join(' · ') || 'Sem custo';
}
export function storyOutcomeText(outcome: GameStoryOutcome): string[] {
  return [outcome.currency ? `+${outcome.currency} moedas` : '', outcome.xp ? `+${outcome.xp} XP` : '',
    ...([[outcome.life, 'vida'], [outcome.mana, 'mana'], [outcome.stamina, 'estamina']] as const)
      .filter(([amount]) => amount !== 0).map(([amount, name]) => `${amount > 0 ? '+' : ''}${amount}${outcome.percentage ? '%' : ''} ${name}`),
    ...outcome.items.map(item => `${item.quantity}× ${String(item.snapshot?.nome ?? item.itemId)}`),
    ...outcome.conditions.map(condition => `${condition.name || condition.code}${condition.duration ? ` (${condition.duration} ${condition.durationUnit === 'Hora' ? 'h' : condition.durationUnit === 'Turno' ? 'turnos' : 'duração padrão'})` : ''}`),
    outcome.gameMinutes ? `Avança ${outcome.gameMinutes} min` : ''].filter(Boolean);
}
export function storyCannotPay(cost: GameStoryCost, state: { economy?: { balance: number } | null; status: { status?: { vida?: number; mana?: number; estamina?: number } } }): string | null {
  if ((state.economy?.balance ?? 0) < cost.currency) return 'Moedas insuficientes';
  const resources = state.status.status;
  if (cost.life > 0 && (resources?.vida ?? 0) <= cost.life) return 'Vida insuficiente';
  if ((resources?.mana ?? 0) < cost.mana) return 'Mana insuficiente';
  if ((resources?.estamina ?? 0) < cost.stamina) return 'Estamina insuficiente';
  return null;
}
