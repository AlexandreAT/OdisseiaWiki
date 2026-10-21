import type { GameBattleEvent, GameBattlePreview, GameBattlePreviewActor } from '../../../models/GameBattlePreview';

export type BattleResource = 'hitPoints' | 'mana' | 'stamina';
export type BattleDefense = 'shield' | 'protection';

export const visibleActorDefense = (
  preview: GameBattlePreview, actor: GameBattlePreviewActor, defense: BattleDefense, eventCount: number,
): number => {
  let value = defense === 'shield' ? actor.defesas.shield ?? actor.defesas.shieldCharges ?? 0
    : actor.defesas.protection;
  for (const event of preview.resultado.events.slice(0, eventCount)) {
    if (event.type === 'DEFENSE_APPLIED' && event.targetId === actor.id &&
        event.payload.defense?.toLowerCase() === defense && typeof event.payload.defenseAfter === 'number') {
      value = event.payload.defenseAfter;
    }
  }
  return value;
};

const initialResourceField: Record<BattleResource, 'vida' | 'mana' | 'estamina'> = {
  hitPoints: 'vida',
  mana: 'mana',
  stamina: 'estamina',
};

/** Reads only events already revealed by the replay; the server remains the source of truth. */
export const visibleActorResource = (
  preview: GameBattlePreview,
  actor: GameBattlePreviewActor,
  resource: BattleResource,
  eventCount: number,
): number => {
  let value = actor[initialResourceField[resource]];
  for (const event of preview.resultado.events.slice(0, eventCount)) {
    if (event.type === 'RESOURCE_CHANGED' && event.payload.resource === resource &&
        (event.targetId ?? event.actorId) === actor.id && typeof event.payload.after === 'number') {
      value = event.payload.after;
    }
  }
  return value;
};

/** The replay cursor, rather than the final battle result, determines the active card. */
export const activeBattleActor = (preview: GameBattlePreview, eventCount: number): string | null => {
  let active: string | null = null;
  for (const event of preview.resultado.events.slice(0, eventCount)) {
    if (event.type === 'TURN_STARTED' || event.type === 'ACTION_SELECTED') active = event.actorId;
    if (event.type === 'BATTLE_ENDED') active = null;
  }
  return active;
};

/** Returns the last revealed effect on a target, so card impacts never precede the replay. */
export const latestBattleImpact = (preview: GameBattlePreview, actorId: string, eventCount: number): number | null => {
  let sequence: number | null = null;
  for (const event of preview.resultado.events.slice(0, eventCount)) {
    if (event.targetId !== actorId && !(event.type === 'RESOURCE_CHANGED' &&
      event.payload.resource === 'hitPoints' && event.actorId === actorId && !event.targetId)) continue;
    if ((event.type === 'RESOURCE_CHANGED' && event.payload.before !== event.payload.after) ||
      (event.type === 'DEFENSE_APPLIED' && (event.payload.absorbed ?? 0) > 0) ||
      event.type === 'ACTOR_DEFEATED' || event.type.includes('EFFECT') || event.type.includes('CONDITION')) {
      sequence = event.sequence;
    }
  }
  return sequence;
};

export interface BattleBeat {
  throughIndex: number;
  sequence: number;
  round: number;
  turn: number | null;
  phase: 'start' | 'initiative' | 'action' | 'end';
  text: string;
  actorName?: string;
  playerActor?: boolean;
  action?: BattleActionDisplay;
}

export type BattleTone = 'positive' | 'negative' | 'warning' | 'neutral';

export interface BattleActionDisplay {
  actor: string;
  playerActor: boolean;
  failed: boolean;
  name: string;
  result: string;
  die: number | string;
  advantageDice?: { value: number; selected: boolean }[];
  damage: number;
  absorbed: number;
  blocked: boolean;
  resourceEffects: string[];
  ammoRemaining: number | null;
  tone: BattleTone;
  critical: boolean;
}

const actorName = (preview: GameBattlePreview, id: string | null): string => {
  if (id === preview.personagem.id) return preview.personagem.nome;
  if (id === preview.oponente.id) return preview.oponente.nome;
  const enemy = preview.oponentes?.find((actor) => actor.id === id);
  if (enemy) return enemy.nome;
  return 'Combate';
};

const resultLabel = (code?: string): string => ({
  FALHA_CRITICA: 'falha crítica', ERRO: 'erro', ACERTO: 'acerto',
  ERRO_CRITICO: 'falha crítica', ACERTO_PRECISO: 'ataque preciso',
  CRITICO: 'crítico', ACERTO_CRITICO: 'crítico',
}[code ?? ''] ?? 'resultado');

const endingLabel = (reason: GameBattlePreview['resultado']['endReason']): string => ({
  ActorDefeated: 'um combatente foi derrotado',
  RoundLimit: 'encerrado',
  EventLimit: 'limite de eventos',
  NoDamage: 'sem progresso no combate',
}[reason]);

const actionPresentation = (preview: GameBattlePreview, event: GameBattleEvent, following: GameBattleEvent[]): {
  text: string;
  action?: BattleActionDisplay;
} => {
  const name = actorName(preview, event.actorId);
  const quantity = event.payload.quantity ?? 1;
  const action = `${event.payload.actionName ?? 'ação'}${quantity > 1 ? ` ×${quantity}` : ''}`;
  const resourceEffects = ([['mana', 'mana'], ['stamina', 'estamina']] as const)
    .map(([resource, label]) => {
      const delta = following.filter((item) => item.type === 'RESOURCE_CHANGED' &&
        item.payload.resource === resource && (item.targetId ?? item.actorId) === event.actorId)
        .reduce((total, item) => total + (item.payload.after ?? 0) - (item.payload.before ?? 0), 0);
      return delta === 0 ? null : `${delta > 0 ? '+' : ''}${delta} ${label}`;
    })
    .filter((effect): effect is string => effect !== null);
  const resourceText = resourceEffects.length > 0 ? ` · ${resourceEffects.join(', ')}` : '';
  const appliedConditions = following.filter((item) => item.type === 'CONDITION_APPLIED')
    .map((item) => item.payload.name ?? item.payload.code ?? 'condição');
  const conditionText = appliedConditions.length ? ` · aplicou ${appliedConditions.join(', ')}` : '';
  if (following.some((item) => item.type === 'REST_PERFORMED'))
    return { text: `${name} — descanso curto${resourceText}.` };
  if (following.some((item) => item.type === 'RELOAD_PERFORMED'))
    return { text: `${name} — ${action}: recarregou${resourceText}.` };

  if (event.payload.directUse) {
    const lifeRestored = following.filter((item) => item.type === 'RESOURCE_CHANGED' &&
      item.payload.resource === 'hitPoints' && (item.targetId ?? item.actorId) === event.actorId)
      .reduce((sum, item) => sum + Math.max(0, (item.payload.after ?? 0) - (item.payload.before ?? 0)), 0);
    const lifeText = lifeRestored > 0 ? ` · +${lifeRestored} vida` : '';
    const remaining = following.find((item) => item.type === 'ITEM_CONSUMED')?.payload.remainingQuantity;
    return { text: `${name} — usou ${action}${lifeText}${resourceText}${conditionText}` +
      `${remaining === undefined ? '' : ` · restam ${remaining}`}.` };
  }

  const roll = following.find((item) => item.type === 'DICE_ROLLED');
  if (!roll) return { text: `${name} — ${action}${resourceText}.` };
  const ammoRemaining = following.find((item) => item.type === 'RESOURCE_CHANGED' &&
    item.payload.resource === 'loadedAmmo' && typeof item.payload.after === 'number')
    ?.payload.after ?? null;
  const die = roll.payload.roll?.valorNatural ?? roll.payload.roll?.total ?? '?';
  const advantageDice = roll.payload.mode === 'Vantagem'
    ? roll.payload.roll?.grupos?.flatMap((group) => group.valores.map((value, index) => ({
      value, selected: group.indicesMantidos.includes(index),
    }))) : undefined;
  const code = roll.payload.resultCode?.toUpperCase() ?? '';
  const classification = roll.payload.resultName?.trim().toLocaleLowerCase('pt-BR') || resultLabel(code);
  const damage = following.find((item) => item.type === 'DAMAGE_CALCULATED')?.payload.damage ?? 0;
  const absorbed = following.filter((item) => item.type === 'DEFENSE_APPLIED')
    .reduce((total, item) => total + (item.payload.absorbed ?? 0), 0);
  // O HP do alvo é limitado a zero no evento de recurso. O dano do golpe,
  // porém, não deve ser reduzido só porque o alvo tinha menos vida restante.
  const dealtDamage = Math.max(0, damage - absorbed);
  const effect = dealtDamage > 0 ? `, ${dealtDamage} de dano${absorbed ? ` (${absorbed} absorvido)` : ''}`
    : damage > 0 && absorbed > 0 ? `, dano bloqueado (${absorbed} absorvido)` : '';
  const criticalSuccess = roll.payload.critical ?? (code === 'CRITICO' || code === 'ACERTO_CRITICO');
  const criticalFailure = roll.payload.criticalFailure ?? (code === 'FALHA_CRITICA' || code === 'ERRO_CRITICO');
  const failure = criticalFailure || code === 'ERRO';
  const success = !failure && (criticalSuccess || code === 'ACERTO' ||
    code === 'ACERTO_PRECISO' || damage > 0);
  const playerAttacked = event.actorId === preview.personagem.id;
  const tone: BattleTone = criticalFailure ? (playerAttacked ? 'negative' : 'positive')
    : failure ? 'warning'
      : success ? (playerAttacked ? 'positive' : 'negative') : 'neutral';
  return {
    text: `${name} — ${action}: ${classification} (D20 ${die})${effect}${conditionText}${resourceText}${ammoRemaining === null ? '' : ` · ${ammoRemaining} munições restantes`}.`,
    action: {
      actor: name,
      playerActor: playerAttacked,
      failed: failure,
      name: action,
      result: classification,
      die,
      advantageDice,
      damage: dealtDamage,
      absorbed,
      blocked: dealtDamage === 0 && damage > 0 && absorbed > 0,
      resourceEffects,
      ammoRemaining,
      tone,
      critical: criticalSuccess || criticalFailure,
    },
  };
};

/** Groups the authoritative event log into readable, atomic actions without changing its data. */
export const buildBattleBeats = (preview: GameBattlePreview): BattleBeat[] => {
  const events = preview.resultado.events;
  const beats: BattleBeat[] = [];
  let turn = 0;
  for (let index = 0; index < events.length; index++) {
    const event = events[index];
    if (event.type === 'TURN_STARTED') turn++;
    let text: string | null = null;
    let action: BattleActionDisplay | undefined;
    let phase: BattleBeat['phase'] = 'action';
    let throughIndex = index + 1;
    if (event.type === 'BATTLE_STARTED') {
      text = 'A batalha começou.';
      phase = 'start';
    }
    if (event.type === 'INITIATIVE_ROLLED') {
      const dice = event.payload.dice?.join(' + ') ?? '?';
      const modifier = event.payload.modifier ?? 0;
      text = `${actorName(preview, event.actorId)}: iniciativa ${dice}${modifier ?
        ` ${modifier > 0 ? '+' : '-'} ${Math.abs(modifier)}` : ''} = ${event.payload.total ?? '?'}.`;
      phase = 'initiative';
    }
    if (event.type === 'ACTION_SELECTED') {
      let end = index + 1;
      while (end < events.length && !['ACTION_SELECTED', 'TURN_STARTED', 'BATTLE_ENDED',
        'RESISTANCE_ROLLED'].includes(events[end].type)) end++;
      const presentation = actionPresentation(preview, event, events.slice(index + 1, end));
      text = presentation.text;
      action = presentation.action;
      throughIndex = end;
      index = end - 1;
    }
    if (event.type === 'TURN_PASSED') text = `${actorName(preview, event.actorId)} passou o turno.`;
    if (event.type === 'RESISTANCE_ROLLED') {
      const dice = event.payload.dice?.join(' + ') ?? '?';
      const alternative = event.payload.alternativeDice?.join(' + ');
      const rolls = alternative ? `${dice} / ${alternative} (${event.payload.mode === 'Vantagem' ? 'vantagem' : 'desvantagem'})` : dice;
      const modifier = event.payload.modifier ?? 0;
      text = `${actorName(preview, event.actorId)}: reação de ${event.payload.attributeCode ?? 'atributo'} ` +
        `${rolls}${modifier ? ` ${modifier > 0 ? '+' : '-'} ${Math.abs(modifier)}` : ''} ` +
        `= ${event.payload.total ?? '?'} contra ${event.payload.difficulty ?? '?'} — ` +
        `${event.payload.passed ? 'resistiu' : 'foi afetado'}.`;
    }
    if (event.type === 'CONDITION_APPLIED') text = `${actorName(preview, event.targetId)} recebeu ${event.payload.name ?? 'uma condição'}.`;
    if (event.type === 'CONDITION_EXPIRED') text = `${event.payload.name ?? 'Condição'} terminou em ${actorName(preview, event.actorId)}.`;
    if (event.type === 'BATTLE_ENDED') {
      text = preview.resultado.winnerActorId
        ? `${actorName(preview, preview.resultado.winnerActorId)} venceu o combate.`
        : `Combate encerrado: ${endingLabel(preview.resultado.endReason)}.`;
      phase = 'end';
    }
    if (text) {
      const eventActorId = event.type === 'BATTLE_ENDED' ? preview.resultado.winnerActorId : event.actorId;
      const name = eventActorId ? actorName(preview, eventActorId) : undefined;
      beats.push({ throughIndex, sequence: event.sequence, round: event.round,
        turn: phase === 'action' ? turn : null, phase, text, action,
        actorName: name && text.startsWith(name) ? name : undefined,
        playerActor: eventActorId === preview.personagem.id });
    }
  }
  return beats;
};
