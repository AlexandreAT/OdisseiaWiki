import assert from 'node:assert/strict';
import test from 'node:test';
import { activeBattleActor, buildBattleBeats, latestBattleImpact, visibleActorDefense, visibleActorResource } from '../src/routes/Game/BattleReplay/battlePresentation.ts';

test('escudo e proteção aparecem somente quando o impacto correspondente é revelado', () => {
  const actor = { id: 'hero', defesas: { shield: 500, protection: 200, armor: 25 } };
  const preview = { resultado: { events: [
    { type: 'DEFENSE_APPLIED', targetId: 'hero', payload: { defense: 'Shield', defenseAfter: 0 } },
    { type: 'DEFENSE_APPLIED', targetId: 'hero', payload: { defense: 'Protection', defenseAfter: 120 } },
  ] } };
  assert.equal(visibleActorDefense(preview, actor, 'shield', 0), 500);
  assert.equal(visibleActorDefense(preview, actor, 'shield', 1), 0);
  assert.equal(visibleActorDefense(preview, actor, 'protection', 1), 200);
  assert.equal(visibleActorDefense(preview, actor, 'protection', 2), 120);
});

test('turno e impacto seguem somente os eventos revelados', () => {
  const preview = { resultado: { events: [
    { sequence: 1, type: 'TURN_STARTED', actorId: 'hero', targetId: null, payload: {} },
    { sequence: 2, type: 'RESOURCE_CHANGED', actorId: 'hero', targetId: null,
      payload: { resource: 'loadedAmmo', before: 5, after: 4 } },
    { sequence: 3, type: 'RESOURCE_CHANGED', actorId: 'hero', targetId: 'enemy',
      payload: { resource: 'hitPoints', before: 100, after: 70 } },
    { sequence: 4, type: 'TURN_STARTED', actorId: 'enemy', targetId: null, payload: {} },
    { sequence: 5, type: 'RESOURCE_CHANGED', actorId: 'enemy', targetId: 'hero',
      payload: { resource: 'hitPoints', before: 100, after: 90 } },
    { sequence: 6, type: 'BATTLE_ENDED', actorId: null, targetId: null, payload: {} },
  ] } };
  assert.equal(activeBattleActor(preview, 1), 'hero');
  assert.equal(activeBattleActor(preview, 4), 'enemy');
  assert.equal(activeBattleActor(preview, 6), null);
  assert.equal(latestBattleImpact(preview, 'hero', 2), null);
  assert.equal(latestBattleImpact(preview, 'enemy', 2), null);
  assert.equal(latestBattleImpact(preview, 'enemy', 3), 3);
  assert.equal(latestBattleImpact(preview, 'hero', 5), 5);
});

test('vida, mana e estamina só mudam quando o evento correspondente é revelado', () => {
  const actor = { id: 'hero', vida: 100, mana: 50, estamina: 30 };
  const preview = { resultado: { events: [
    { type: 'RESOURCE_CHANGED', actorId: 'enemy', targetId: 'hero',
      payload: { resource: 'hitPoints', before: 100, after: 65 } },
    { type: 'RESOURCE_CHANGED', actorId: 'hero', targetId: null,
      payload: { resource: 'mana', before: 50, after: 42 } },
    { type: 'RESOURCE_CHANGED', actorId: 'hero', targetId: null,
      payload: { resource: 'stamina', before: 30, after: 20 } },
  ] } };

  assert.equal(visibleActorResource(preview, actor, 'hitPoints', 0), 100);
  assert.equal(visibleActorResource(preview, actor, 'hitPoints', 1), 65);
  assert.equal(visibleActorResource(preview, actor, 'mana', 1), 50);
  assert.equal(visibleActorResource(preview, actor, 'mana', 2), 42);
  assert.equal(visibleActorResource(preview, actor, 'stamina', 2), 30);
  assert.equal(visibleActorResource(preview, actor, 'stamina', 3), 20);
});

test('o replay apresenta as iniciativas de cada participante sem antecipar ações', () => {
  const preview = {
    personagem: { id: 'hero', nome: 'Herói' },
    oponente: { id: 'enemy', nome: 'Lobo 1' },
    oponentes: [{ id: 'enemy', nome: 'Lobo 1' }, { id: 'enemy-2', nome: 'Lobo 2' }],
    resultado: { winnerActorId: null, endReason: 'RoundLimit', events: [
      { sequence: 1, round: 0, type: 'BATTLE_STARTED', actorId: null, targetId: null,
        payload: { actorOrder: ['enemy-2', 'hero', 'enemy'] } },
      { sequence: 2, round: 0, type: 'INITIATIVE_ROLLED', actorId: 'hero', targetId: null,
        payload: { formula: '1D6 + Agilidade', dice: [3], modifier: 2, total: 5 } },
      { sequence: 3, round: 0, type: 'INITIATIVE_ROLLED', actorId: 'enemy', targetId: null,
        payload: { formula: '1D6 + Agilidade', dice: [1], modifier: 0, total: 1 } },
      { sequence: 4, round: 0, type: 'INITIATIVE_ROLLED', actorId: 'enemy-2', targetId: null,
        payload: { formula: '1D6 + Agilidade', dice: [6], modifier: 0, total: 6 } },
    ] },
  };

  const beats = buildBattleBeats(preview);
  assert.deepEqual(beats.map((beat) => beat.phase),
    ['start', 'initiative', 'initiative', 'initiative']);
  assert.match(beats[1].text, /Herói: iniciativa 3 \+ 2 = 5/);
  assert.match(beats[3].text, /Lobo 2: iniciativa 6 = 6/);
  assert.equal(beats[1].playerActor, true);
  assert.equal(beats[3].playerActor, false);
});

test('reação defensiva aparece fora do turno e não some dentro da ação de área', () => {
  const preview = {
    personagem: { id: 'hero', nome: 'Herói' },
    oponente: { id: 'enemy', nome: 'Lobo' },
    resultado: { winnerActorId: null, endReason: 'RoundLimit', events: [
      { sequence: 1, round: 1, type: 'TURN_STARTED', actorId: 'hero', targetId: null, payload: {} },
      { sequence: 2, round: 1, type: 'ACTION_SELECTED', actorId: 'hero', targetId: 'enemy',
        payload: { actionName: 'Granada' } },
      { sequence: 3, round: 1, type: 'DICE_ROLLED', actorId: 'hero', targetId: 'enemy',
        payload: { resultCode: 'ACERTO', roll: { valorNatural: 12, total: 12 } } },
      { sequence: 4, round: 1, type: 'DAMAGE_CALCULATED', actorId: 'hero', targetId: 'enemy',
        payload: { damage: 0 } },
      { sequence: 5, round: 1, type: 'RESISTANCE_ROLLED', actorId: 'enemy', targetId: 'hero',
        payload: { attributeCode: 'AGILIDADE', dice: [2], alternativeDice: [4], mode: 'Desvantagem',
          modifier: 1, total: 3, difficulty: 5, passed: false } },
      { sequence: 6, round: 1, type: 'CONDITION_APPLIED', actorId: 'hero', targetId: 'enemy',
        payload: { name: 'Cegueira' } },
      { sequence: 7, round: 1, type: 'TURN_STARTED', actorId: 'enemy', targetId: null, payload: {} },
      { sequence: 8, round: 1, type: 'TURN_PASSED', actorId: 'enemy', targetId: null,
        payload: { reason: 'CONDITION' } },
    ] },
  };

  const beats = buildBattleBeats(preview);
  assert.deepEqual(beats.map((beat) => beat.turn), [1, 1, 1, 2]);
  assert.match(beats[1].text, /reação de AGILIDADE/);
  assert.match(beats[1].text, /desvantagem/);
  assert.match(beats[2].text, /Cegueira/);
});

test('vários disparos aparecem como uma ação com quantidade e dano total', () => {
  const preview = previewFor('hero', 'ACERTO', 160, false, false);
  preview.resultado.events[1].payload.actionName = 'Pistola';
  preview.resultado.events[1].payload.quantity = 2;

  const beats = buildBattleBeats(preview);

  assert.equal(beats.length, 1);
  assert.equal(beats[0].action?.name, 'Pistola ×2');
  assert.equal(beats[0].action?.damage, 160);
});

test('consumível equipado mostra cura e quantidade restante sem inventar rolagem D20', () => {
  const preview = {
    personagem: { id: 'hero', nome: 'Herói' },
    oponente: { id: 'enemy', nome: 'Inimigo' },
    resultado: { winnerActorId: null, endReason: 'NoDamage', events: [
      { sequence: 1, round: 1, type: 'TURN_STARTED', actorId: 'hero', targetId: null, payload: {} },
      { sequence: 2, round: 1, type: 'ACTION_SELECTED', actorId: 'hero', targetId: 'enemy',
        payload: { actionName: 'Seringa', directUse: true } },
      { sequence: 3, round: 1, type: 'ITEM_CONSUMED', actorId: 'hero', targetId: null,
        payload: { actionId: 'item:seringa', remainingQuantity: 1 } },
      { sequence: 4, round: 1, type: 'RESOURCE_CHANGED', actorId: 'hero', targetId: null,
        payload: { resource: 'hitPoints', before: 40, after: 65 } },
    ] },
  };

  const beats = buildBattleBeats(preview);
  assert.equal(beats.length, 1);
  assert.match(beats[0].text, /usou Seringa/);
  assert.match(beats[0].text, /\+25 vida/);
  assert.match(beats[0].text, /restam 1/);
  assert.doesNotMatch(beats[0].text, /D20/);
});

test('o replay mostra munição restante após tiro e rajada, inclusive quando erram', () => {
  for (const [quantity, before, after] of [[1, 5, 4], [3, 60, 30]]) {
    const preview = previewFor('hero', 'ERRO', 0, false, false);
    preview.resultado.events[1].payload.quantity = quantity;
    preview.resultado.events.splice(2, 0, {
      sequence: 20, round: 1, type: 'RESOURCE_CHANGED', actorId: 'hero', targetId: null,
      payload: { resource: 'loadedAmmo', before, after, actionId: 'item:arma' },
    });

    const [beat] = buildBattleBeats(preview);
    assert.equal(beat.action?.ammoRemaining, after);
    assert.equal(beat.action?.failed, true);
    assert.match(beat.text, new RegExp(`${after} munições restantes`));
  }
});

const previewFor = (actorId, resultCode, damage, critical, criticalFailure) => ({
  personagem: { id: 'hero', nome: 'Herói' },
  oponente: { id: 'enemy', nome: 'Inimigo' },
  resultado: {
    winnerActorId: null,
    endReason: 'RoundLimit',
    events: [
      { sequence: 1, round: 1, type: 'TURN_STARTED', actorId, targetId: null, payload: {} },
      { sequence: 2, round: 1, type: 'ACTION_SELECTED', actorId, targetId: null,
        payload: { actionName: 'Ataque' } },
      { sequence: 3, round: 1, type: 'DICE_ROLLED', actorId, targetId: null,
        payload: { resultCode, resultName: resultCode, critical, criticalFailure,
          roll: { valorNatural: critical ? 20 : criticalFailure ? 1 : 12, total: 12 } } },
      { sequence: 4, round: 1, type: 'DAMAGE_CALCULATED', actorId, targetId: null,
        payload: { damage } },
      ...(damage ? [{ sequence: 5, round: 1, type: 'RESOURCE_CHANGED', actorId,
        targetId: actorId === 'hero' ? 'enemy' : 'hero',
        payload: { resource: 'hitPoints', before: 20, after: 20 - damage } }] : []),
    ],
  },
});

test('o destaque dos quatro críticos segue a perspectiva do jogador', () => {
  for (const [actor, code, damage, critical, failure, tone] of [
    ['hero', 'CRITICO', 8, true, false, 'positive'],
    ['hero', 'FALHA_CRITICA', 0, false, true, 'negative'],
    ['enemy', 'CRITICO', 8, true, false, 'negative'],
    ['enemy', 'FALHA_CRITICA', 0, false, true, 'positive'],
  ]) {
    const action = buildBattleBeats(previewFor(actor, code, damage, critical, failure))[0].action;
    assert.equal(action?.critical, true);
    assert.equal(action?.tone, tone);
    assert.equal(action?.damage, damage);
  }
});

test('logs antigos preservam o destaque pelos códigos publicados', () => {
  const preview = previewFor('enemy', 'CRITICO', 8, undefined, undefined);
  const action = buildBattleBeats(preview)[0].action;
  assert.equal(action?.tone, 'negative');
  assert.equal(action?.critical, true);
});

test('acerto, erro e dano também seguem a perspectiva do jogador', () => {
  for (const [actor, code, damage, tone] of [
    ['hero', 'ACERTO', 8, 'positive'],
    ['hero', 'ERRO', 0, 'warning'],
    ['enemy', 'ACERTO', 8, 'negative'],
    ['enemy', 'ERRO', 0, 'warning'],
  ]) {
    const action = buildBattleBeats(previewFor(actor, code, damage, false, false))[0].action;
    assert.equal(action?.tone, tone);
    assert.equal(action?.damage, damage);
    assert.equal(action?.critical, false);
    assert.equal(action?.failed, code === 'ERRO');
    assert.equal(action?.playerActor, actor === 'hero');
  }
});

test('o replay identifica os nomes dos combatentes sem alterar o texto dos eventos', () => {
  const preview = previewFor('hero', 'ACERTO', 8, false, false);
  const beat = buildBattleBeats(preview)[0];
  assert.equal(beat.actorName, 'Herói');
  assert.equal(beat.playerActor, true);
  assert.match(beat.text, /^Herói — Ataque:/);
});

test('o resumo mostra o dano do golpe mesmo quando ele excede a vida restante', () => {
  const preview = previewFor('hero', 'ACERTO', 100, false, false);
  preview.resultado.events[4].payload = { resource: 'hitPoints', before: 70, after: 0 };
  const beat = buildBattleBeats(preview)[0];
  assert.equal(beat.action?.damage, 100);
  assert.match(beat.text, /100 de dano/);
});
