import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

// Usa o compilador já fornecido pelo Vite, sem gerar arquivos no projeto.
const bundle = await build({
  stdin: { contents: `export * from './src/utils/weaponModifiers'; export * from './src/utils/mapItem'; export * from './src/components/ItemComparison/itemComparison.utils';`, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const { resolveWeaponModifiers, getEffectiveWeaponAttributes, getEffectiveItemAttributes,
  createAccessorySnapshot, getWeaponModifierMode, getAttachedAccessories, describeModifiers, mapToItem, mapToPayload,
  buildItemComparisonModel } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);

const accessory = (modificadores, compatibilidade = 'corpo_a_corpo', id = 'grip') => ({
  idItemBase: id, nome: 'Empunhadura', atributos: { modificadores, compatibilidade },
});
const sword = (extra = {}) => ({ tipoArma: 'arma_branca_comum', danoBase: 120, gastoEstaminaPorAtaque: 6, modificadores: { ataque: 1 }, ...extra });
const item = (atributos, tipo = 'arma') => ({ id: 'sword', nome: 'Espada', tipo, quantidade: 1, atributos });

test('soma bônus da arma e acessórios sem alterar a origem; remover restaura a base', () => {
  const weapon = sword({ acessorios: [accessory({ ataque: 2, revidar: -1 })] });
  const before = JSON.stringify(weapon);
  assert.deepEqual(resolveWeaponModifiers(weapon), { ataque: 3, revidar: -1, efeitos: [] });
  assert.equal(JSON.stringify(weapon), before);
  assert.equal(resolveWeaponModifiers({ ...weapon, acessorios: [] }).ataque, 1);
  assert.equal(resolveWeaponModifiers(weapon).ataque, 3);
});

test('mira em espada permanece anexada, sem bônus numéricos ou especiais', () => {
  const weapon = sword({ acessorios: [accessory({ longa: 2, dano: 100, ataque: 8, efeitos: ['Paralisante'] }, 'distancia')] });
  assert.deepEqual(resolveWeaponModifiers(weapon), { ataque: 1, efeitos: [] });
  assert.equal(getEffectiveWeaponAttributes(weapon).danoBase, 120);
  assert.equal(weapon.acessorios.length, 1);
});

test('acessório universal só aplica condições do modo de combate correto', () => {
  const attachment = accessory({ curta: 1, media: -1, longa: 3, ataque: 2, revidar: 1 }, 'todas');
  assert.deepEqual(resolveWeaponModifiers(sword({ acessorios: [attachment] })), { ataque: 3, revidar: 1, efeitos: [] });
  assert.deepEqual(resolveWeaponModifiers({ tipoArma: 'pistola_revolver', acessorios: [attachment] }), { curta: 1, media: -1, longa: 3, efeitos: [] });
});

test('dano e estamina alteram os valores preenchidos e respeitam o piso zero', () => {
  const weapon = sword({ danoPorAlcance: { curta: 50 }, acessorios: [accessory({ ataque: -3, dano: 100, estamina: -10 })] });
  const effective = getEffectiveWeaponAttributes(weapon);
  assert.equal(effective.danoBase, 220);
  assert.deepEqual(effective.danoPorAlcance, { curta: 150 });
  assert.equal(effective.gastoEstaminaPorAtaque, 0);
  assert.equal(effective.modificadores.ataque, -2);
  assert.equal(weapon.danoPorAlcance.curta, 50);
  assert.equal(getEffectiveWeaponAttributes(sword({ modificadores: { dano: -200 } })).danoBase, 0);
});

test('campos sem base não são inventados pelo modificador', () => {
  const effective = getEffectiveWeaponAttributes({ modificadores: { dano: 100, estamina: -1 } });
  assert.equal(effective.danoBase, undefined);
  assert.equal(effective.danoPorAlcance, undefined);
  assert.equal(effective.gastoEstaminaPorAtaque, undefined);
});

test('persistência e reabertura mantêm base e anexo, sem aplicar o bônus duas vezes', () => {
  const original = item(sword({ acessorios: [accessory({ ataque: 2, dano: 100 })], __explodedView: { gridPosition: 2 } }));
  for (let index = 0; index < 3; index++) {
    const restored = mapToItem(JSON.parse(JSON.stringify(mapToPayload(original))));
    assert.equal(restored.atributos.danoBase, 120);
    assert.equal(restored.atributos.modificadores.ataque, 1);
    assert.equal(getEffectiveItemAttributes(restored).danoBase, 220);
    assert.equal(getEffectiveItemAttributes(restored).modificadores.ataque, 3);
    assert.equal(restored.atributos.__explodedView.gridPosition, 2);
  }
});

test('anexo é uma cópia independente, mesmo após mudanças no catálogo', () => {
  const catalog = { ...item({ modificadores: { ataque: 2, efeitos: ['Paralisante'] }, bonus: ['Legado'] }, 'acessorio'), id: 'grip' };
  const attached = createAccessorySnapshot(catalog);
  catalog.atributos.modificadores.ataque = 90;
  catalog.atributos.modificadores.efeitos.push('Outro');
  catalog.atributos.bonus.push('Outro');
  assert.equal(attached.atributos.modificadores.ataque, 2);
  assert.deepEqual(attached.atributos.modificadores.efeitos, ['Paralisante']);
  assert.deepEqual(attached.atributos.bonus, ['Legado']);
  assert.equal(createAccessorySnapshot(item({})), undefined);
});

test('itens legados e outras categorias conservam seus atributos', () => {
  assert.deepEqual(getAttachedAccessories(null), []);
  assert.deepEqual(getAttachedAccessories(undefined), []);
  assert.equal(getEffectiveItemAttributes(item(null)).danoBase, undefined);
  const legacy = sword({ modificadores: undefined, bonus: ['+3 narrativo'], municao: { capacidade: 6, atual: 4 } });
  const effective = getEffectiveWeaponAttributes(legacy);
  assert.equal(effective.danoBase, legacy.danoBase);
  assert.deepEqual(effective.bonus, legacy.bonus);
  assert.deepEqual(effective.municao, legacy.municao);
  for (const type of ['traje', 'consumiveis', 'implante', 'outro', 'acessorio']) {
    const original = item({ protecaoBase: 10, modificadores: { dano: 100 } }, type);
    assert.equal(getEffectiveItemAttributes(original), original.atributos);
  }
});

test('aliases legados e modo explícito de arquétipos personalizados', () => {
  assert.equal(getWeaponModifierMode({ tipoArma: 'arma_branca', modoModificadores: null }), 'corpo_a_corpo');
  assert.equal(getWeaponModifierMode({ tipoArma: 'REVOLVER' }), 'distancia');
  assert.equal(getWeaponModifierMode({ tipoArma: 'arma_branca' }), 'corpo_a_corpo');
  assert.equal(getWeaponModifierMode({ tipoArma: 'custom', modoModificadores: 'distancia' }), 'distancia');
  assert.equal(resolveWeaponModifiers({ tipoArma: 'custom', modoModificadores: 'distancia', modificadores: { longa: 3 } }).longa, 3);
});

test('valores não finitos são ignorados e efeitos duplicados não se repetem', () => {
  const weapon = sword({ modificadores: { ataque: NaN, dano: Infinity, efeitos: ['Paralisante', ''] }, acessorios: [accessory({ efeitos: ['Paralisante', 'Queimadura'] })] });
  assert.deepEqual(resolveWeaponModifiers(weapon), { efeitos: ['Paralisante', 'Queimadura'] });
  assert.deepEqual(describeModifiers({ ataque: 3, revidar: -1 }), ['+3 ao atacar', '-1 ao revidar']);
});

test('comparação utiliza os mesmos totais da visualização', () => {
  const original = item(sword({ acessorios: [accessory({ ataque: 2, dano: 100, estamina: -2 })] }));
  const comparison = buildItemComparisonModel(original);
  assert.equal(comparison.metrics.find((metric) => metric.key === 'dano.base').value, 220);
  assert.equal(comparison.details.find((detail) => detail.key === 'modificador.ataque').numericValue, 3);
  assert.equal(comparison.details.find((detail) => detail.key === 'estamina').numericValue, 4);
  assert.equal(original.atributos.danoBase, 120);
});
