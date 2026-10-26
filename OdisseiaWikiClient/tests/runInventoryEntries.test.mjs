import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRunInventoryEntries, stackRunConsumables } from '../src/routes/Game/GameRunShell/runInventoryEntries.ts';

test('prótese conserva bônus, alcance, teste e defesa restante sem confundir com consumível', () => {
  const [entry] = parseRunInventoryEntries({ implantes: [{ id: 'torso', nome: 'Torso', tipo: 'implante', atributos: {
    bonus: { vida: 200, precisao: 2 }, protecaoBase: 300, escudoBase: 50, armaduraBase: 5,
    __runDefenseRemaining: { protecao: 10, escudo: 0 }, __vistaExplodida: { equippedSlot: 'run-defense' },
    tipoArma: 'rifle_assalto', danoPorAlcance: { curta: 80, media: 50, longa: 30 },
    teste: { codigoTeste: 'ATAQUE_COMUM', modo: 'Normal' }, capacidadeMunicao: 10, controlaMunicao: true,
  } }] }, 'PROTESE');
  assert.equal(entry.ranged, true); assert.equal(entry.hasDeclaredTest, true);
  assert.equal(entry.damageByRange.media, 50); assert.equal(entry.controlsAmmo, true);
  assert.deepEqual(entry.passiveBonuses, { vida: 200, precisao: 2 });
  assert.deepEqual(entry.defenseRemaining, { protecao: 10, escudo: 0 });
  assert.equal(entry.defenseEquipped, true); assert.equal(stackRunConsumables([entry, entry]).length, 2);
});

test('magia ofensiva conserva dano para prévia do loadout', () => {
  const [magic] = parseRunInventoryEntries([
    { id: 'fogo-1', nome: 'Chama', tipo: 'ataque', custo: '2',
      atributos: { acerto: '1D20', dano: 150 } },
  ], 'MAGIA');
  assert.equal(magic.damageByRange.base, 150);
  assert.equal(magic.maxAttacks, 1);
});

test('magia criada no Sábio respeita ataques por turno e custos sem herdar limites de arma', () => {
  const [magic] = parseRunInventoryEntries([{ id: 'pulso', nome: 'Pulso', tipo: 'ataque', atributos: {
    dano: 35, limiteAtaquesPorTurno: 3, custoMana: 2, custoEstamina: 4, cooldownTurnos: 2,
    teste: { codigoTeste: 'ATAQUE_COMUM' } } }], 'MAGIA');
  assert.equal(magic.maxAttacks, 3); assert.equal(magic.staminaPerUse, 4);
  assert.equal(magic.manaPerUse, 2); assert.equal(magic.cooldownTurns, 2);
  assert.equal(magic.quantityLimits[0].source, 'Item');
});

test('consumíveis iguais formam um card; armas mantêm cards separados', () => {
  const items = [
    { id: 'kit-1', idItemBase: 'kit', nome: 'Kit', tipo: 'consumiveis', quantidade: 2,
      atributos: { restaura: { vida: 10 } } },
    { id: 'kit-2', idItemBase: 'kit', nome: 'Kit', tipo: 'consumiveis', quantidade: 1,
      atributos: { restaura: { vida: 10 } } },
    { id: 'kit-3', idItemBase: 'kit', nome: 'Kit', tipo: 'consumiveis', quantidade: 1,
      atributos: { restaura: { vida: 20 } } },
    { id: 'arma-1', nome: 'Aquila', tipo: 'arma' },
    { id: 'arma-2', nome: 'Aquila', tipo: 'arma' },
  ];
  const cards = stackRunConsumables(parseRunInventoryEntries(items, 'ITEM'));
  assert.equal(cards.length, 4);
  assert.equal(cards.find((card) => card.idInstancia === 'kit-1').quantity, 3);
  assert.equal(cards.filter((card) => card.subtype === 'arma').length, 2);
});

test('posição visual da ficha não separa consumíveis mecanicamente iguais', () => {
  const cards = stackRunConsumables(parseRunInventoryEntries([
    { id: 'kit-1', nome: 'Kit', tipo: 'consumiveis', quantidade: 1,
      atributos: { restaura: { vida: 5 }, __vistaExplodida: { gridPosition: 1 } } },
    { id: 'kit-2', nome: 'Kit', tipo: 'consumiveis', quantidade: 1,
      atributos: { restaura: { vida: 5 }, __vistaExplodida: { gridPosition: 3 } } },
  ], 'ITEM'));
  assert.equal(cards.length, 1);
  assert.equal(cards[0].quantity, 2);
});

test('outros defensivos não são empilhados como consumíveis puros', () => {
  const cards = stackRunConsumables(parseRunInventoryEntries([
    { id: 'a', nome: 'Artefato', tipo: 'outro', atributos: { escudo: 50, recuperacaoVida: 10 } },
    { id: 'b', nome: 'Artefato', tipo: 'outro', atributos: { escudo: 50, recuperacaoVida: 10 } },
  ], 'ITEM'));
  assert.equal(cards.length, 2);
  assert.equal(cards[0].defense.escudo, 50);
});

test('traje conserva a proteção original e mostra a proteção restante da run', () => {
  const [traje] = parseRunInventoryEntries([{
    id: 'traje-1', nome: 'Colete', tipo: 'traje',
    atributos: { protecaoBase: 200, __runDefenseRemaining: { protecao: 80 },
      __vistaExplodida: { equippedSlot: 'run-defense' } },
  }], 'ITEM');
  assert.equal(traje.defense.protecao, 200);
  assert.equal(traje.defenseRemaining.protecao, 80);
  assert.equal(traje.defenseEquipped, true);
});

test('traje desequipado mantém proteção e escudo gastos separados dos valores originais', () => {
  const [traje] = parseRunInventoryEntries([{
    id: 'traje-2', nome: 'Colete', tipo: 'traje',
    atributos: { protecaoBase: 200, escudoBase: 40,
      __runDefenseRemaining: { protecao: 80, escudo: 0 } },
  }], 'ITEM');
  assert.equal(traje.defenseEquipped, false);
  assert.deepEqual(traje.defense, { protecao: 200, escudo: 40, armadura: 0 });
  assert.deepEqual(traje.defenseRemaining, { protecao: 80, escudo: 0 });
});
