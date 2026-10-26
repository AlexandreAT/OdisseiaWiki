import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
const bundle = await build({ stdin: { contents: `export * from './src/routes/Game/GameRunShell/runEconomy';
  export * from './src/routes/Game/GameRunShell/runRewardActions';`, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node' });
const { canAccessRunStash, createRunSaleLines, runSaleUnitPrice, canManageRunItem } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);

test('preço de venda usa desconto, arredonda por unidade e aceita item sem preço', () => {
  assert.equal(runSaleUnitPrice(1000, 50), 500);
  assert.equal(runSaleUnitPrice(90.9, 50), 45);
  assert.equal(runSaleUnitPrice(0.58, 0), 0);
  assert.equal(runSaleUnitPrice(3.5, 20), 2);
  assert.equal(runSaleUnitPrice(null, 50), 0);
  assert.equal(runSaleUnitPrice(undefined), 0);
  assert.equal(runSaleUnitPrice(100, 100), 0);
  assert.equal(runSaleUnitPrice(100, 0), 100);
  assert.equal(runSaleUnitPrice(9.999999999, 0), 9);
  assert.equal(runSaleUnitPrice(1e-7, 50), 0);
  assert.equal(runSaleUnitPrice(1e9, 50), 500_000_000);
});

const consumable = (id, quantity = 1, overrides = {}) => ({ tipo: 'ITEM', subtype: 'consumiveis',
  idInstancia: id, quantity, baseItemId: 'seringa', name: 'Seringa', image: null, value: 100,
  stackSignature: 'restaura=100', restore: { vida: 100, mana: 0, estamina: 0 }, useConditions: [],
  damageByRange: { base: 0 }, defense: { protecao: 0, escudo: 0, armadura: 0 }, ...overrides });

test('venda de stack distribui a quantidade por instâncias reais sem incluir cópia editada', () => {
  const first = consumable('a', 2);
  const all = [first, consumable('editada', 5, { stackSignature: 'restaura=200' }), consumable('b', 3)];
  const selection = { ...first, quantity: 5 };
  assert.deepEqual(createRunSaleLines(selection, all, 4), [{ itemId: 'b', quantity: 3 }, { itemId: 'a', quantity: 1 }]);
  assert.deepEqual(createRunSaleLines(selection, all, 2), [{ itemId: 'b', quantity: 2 }], 'preserva o representante equipado');
  for (const count of [0, -1, 1.5, 6, NaN, 1_000_001]) assert.deepEqual(createRunSaleLines(selection, all, count), []);
  assert.equal(first.quantity, 2);
});

test('armas e próteses são vendidas pela própria instância; stash é uma origem independente', () => {
  const weapon = consumable('espada', 1, { subtype: 'arma' });
  const other = { ...weapon, idInstancia: 'outra' };
  assert.deepEqual(createRunSaleLines(weapon, [weapon, other], 2), []);
  assert.deepEqual(createRunSaleLines(weapon, [weapon, other], 1), [{ itemId: 'espada', quantity: 1 }]);
  assert.deepEqual(createRunSaleLines(weapon, [], 1), []);
  const prosthesis = { ...weapon, tipo: 'PROTESE' };
  assert.deepEqual(createRunSaleLines(prosthesis, [prosthesis], 1), [{ itemId: 'espada', quantity: 1 }]);
});

test('depósito só é liberado no ponto atual de uma Base ou Mercador durante a run', () => {
  const run = { status: 'Ativa', noAtualId: null, mapa: { nodes: [
    { id: 'inicio', type: 'INICIO', state: 'CONCLUIDO', layer: 0 },
    { id: 'base', type: 'BASE', state: 'CONCLUIDO', layer: 1 },
    { id: 'combate', type: 'COMBATE', state: 'DISPONIVEL', layer: 2 },
  ] } };
  assert.equal(canAccessRunStash(run), true);
  run.noAtualId = 'combate'; run.mapa.nodes[2].state = 'SELECIONADO';
  assert.equal(canAccessRunStash(run), false);
  run.noAtualId = null; run.mapa.nodes[2].state = 'CONCLUIDO';
  assert.equal(canAccessRunStash(run), false);
  run.mapa.nodes.push({ id: 'loja', type: 'VENDEDOR', state: 'SELECIONADO', layer: 3 });
  run.noAtualId = 'loja';
  assert.equal(canAccessRunStash(run), true);
  run.status = 'Vitoria';
  assert.equal(canAccessRunStash(run), true);
  run.status = 'Derrota';
  assert.equal(canAccessRunStash(run), false);
});

test('Base final mantém depósito ao encerrar a run e ignora o início automático da próxima fase', () => {
  const run = { status: 'Vitoria', noAtualId: null, mapa: { nodes: [
    { id: 'base', type: 'BASE', state: 'CONCLUIDO', layer: 2 },
    { id: 'inicio-2', type: 'INICIO', state: 'CONCLUIDO', layer: 3 },
  ] } };
  assert.equal(canAccessRunStash(run), true);
  run.mapa.nodes.push({ id: 'luta', type: 'COMBATE', state: 'CONCLUIDO', layer: 4 });
  assert.equal(canAccessRunStash(run), false);
});

test('NPC Mercador só libera depósito depois de uma visita de serviço, não no resgate', () => {
  const run = { status: 'Ativa', noAtualId: null, mapa: { nodes: [
    { id: 'npc', type: 'NPC', state: 'CONCLUIDO', layer: 1,
      payload: { npcType: 'MERCADOR', npcRescued: true, npcServiceVisited: false } },
  ] } };
  assert.equal(canAccessRunStash(run), false);
  run.mapa.nodes[0].payload.npcServiceVisited = true;
  assert.equal(canAccessRunStash(run), true);
  run.mapa.nodes[0].payload.npcType = 'MEDICO';
  assert.equal(canAccessRunStash(run), false);
});

test('loot final permite ação somente no item recebido e revelado, nunca reabre derrota/abandono', () => {
  const run = { status: 'Vitoria', estadoAtual: { loot: { roll: 2, rewards: [{ id: 'cura' }] } } };
  assert.equal(canManageRunItem(run, 'cura'), true);
  assert.equal(canManageRunItem(run, 'outro-item'), false);
  run.estadoAtual.loot.roll = null;
  assert.equal(canManageRunItem(run, 'cura'), false);
  run.estadoAtual.loot.roll = 2;
  for (const status of ['Derrota', 'Abandonada']) {
    run.status = status;
    assert.equal(canManageRunItem(run, 'cura'), false);
  }
});
