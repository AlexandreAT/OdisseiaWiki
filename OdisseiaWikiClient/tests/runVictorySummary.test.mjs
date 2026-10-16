import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeRunVictory } from '../src/routes/Game/GameRunShell/runVictorySummary.ts';

test('vitória soma inimigos, áreas, itens e XP persistidos sem contar derrotas', () => {
  const actor = { id: 'player' };
  const enemy = (nome) => ({ nome });
  const battle = (winner, names, xpConcedido) => ({
    personagem: actor, oponente: enemy(names[0]), oponentes: names.map(enemy),
    resultado: { winnerActorId: winner }, xpConcedido,
  });
  const run = {
    fase: 2, snapshotInicial: { inventario: [], implantes: [] },
    estadoAtual: { status: { lootItensObtidos: 3, xpConquistadoRun: 50 }, inventario: [], implantes: [] },
    mapa: { nodes: [{ state: 'CONCLUIDO', areaName: 'Floresta' },
      { state: 'CONCLUIDO', areaName: 'Montanha' }] },
  };
  const records = [
    { battle: battle('player', ['Lobo', 'Lobo'], 20) },
    { battle: battle('enemy', ['Dragão'], 0) },
    { battle: battle('player', ['Guardião'], 30) },
  ];
  assert.deepEqual(summarizeRunVictory(run, records), {
    defeated: 3, areas: 2, items: 3, xp: 50, enemyNames: ['Lobo', 'Guardião'],
  });
});

test('vitória recupera XP persistido e itens recebidos no inventário sem depender do histórico', () => {
  const run = {
    fase: 1,
    mapa: { nodes: [] },
    snapshotInicial: { inventario: [{ id: 'arma-original', nome: 'Espada', quantidade: 1 }], implantes: [] },
    estadoAtual: {
      status: { xp: 2, xpConquistadoRun: 85 },
      inventario: [
        { id: 'arma-original', nome: 'Espada', quantidade: 1 },
        { id: 'loot-a', nome: 'Poção', quantidade: 2 },
      ],
      implantes: [{ id: 'loot-b', nome: 'Prótese', quantidade: 1 }],
    },
  };
  assert.equal(summarizeRunVictory(run, []).xp, 85);
  assert.equal(summarizeRunVictory(run, []).items, 3);
});

test('run antiga usa XP do combate salvo e compara o inventário inicial com o final', () => {
  const run = {
    fase: 1,
    mapa: { nodes: [] },
    snapshotInicial: { inventario: JSON.stringify([{ id: 'base', nome: 'Espada', quantidade: 1 }]), implantes: [] },
    estadoAtual: {
      status: { xp: 0 },
      inventario: [{ id: 'base', nome: 'Espada', quantidade: 1 }, { id: 'novo', nome: 'Poção', quantidade: 2 }],
      implantes: [],
    },
  };
  const records = [{ battle: {
    personagem: { id: 'player' }, oponente: { nome: 'Lobo' },
    resultado: { winnerActorId: 'player' }, xpConcedido: 40,
  } }];
  const summary = summarizeRunVictory(run, records);
  assert.equal(summary.xp, 40);
  assert.equal(summary.items, 2);
});
