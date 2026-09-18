import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({
  stdin: { contents: `export * from './src/utils/characterVariants'; export * from './src/utils/normalizePersonagem';`, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const { getCharacterVariants, createCharacterVariant, findInvalidVariant, buildCharacterVariantFields,
  normalizeVariantForEditing, normalizePersonagem } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);

const sheet = () => ({
  statusJson: { status: { vida: 20, vidaMaxima: 30, energia: 7 },
    atributos: { principais: { forca: 2 }, secundarios: { sorte: 4 } },
    defesas: { armadura: 5 }, nivel: 3, xp: 10, pontosSkill: 2, condicioes: ['Atento'] },
  inventarioJson: [
    { id: 'arma', nome: 'Espada', tipo: 'arma', quantidade: 1, atributos: { modificadores: { ataque: -2 } } },
    { id: 'protese', nome: 'Braço', tipo: 'implante', quantidade: 1 },
  ],
  skills: [{ id: 'skill', nome: 'Ataque', tipo: 'ataque', atributos: { dano: 10 } }],
  magia: [{ id: 'magia', nome: 'Cura', tipo: 'suporte', atributos: { custo: 5 } }],
});

test('personagens antigos permanecem únicos, inclusive JSON ausente ou inválido', () => {
  for (const value of [null, undefined, '', '{', {}, sheet().statusJson, { generico: false, variantes: [{}] }]) {
    assert.deepEqual(getCharacterVariants(value), []);
  }
});

test('nova variante copia a ficha inteira sem compartilhar objetos ou metadados recursivos', () => {
  const original = sheet();
  original.statusJson.generico = true;
  original.statusJson.variantes = [{ id: 'não copiar' }];
  const copy = createCharacterVariant(original);
  assert.equal(copy.nome, '');
  assert.ok(copy.id);
  assert.equal(copy.statusJson.variantes, undefined);
  copy.statusJson.status.vida = 100;
  copy.statusJson.atributos.principais.forca = 8;
  copy.statusJson.defesas.armadura = 99;
  copy.statusJson.condicioes.push('Outro');
  copy.inventarioJson[0].atributos.modificadores.ataque = 9;
  copy.inventarioJson[1].nome = 'Outra prótese';
  copy.skills[0].atributos.dano = 99;
  copy.magia[0].atributos.custo = 99;
  assert.equal(original.statusJson.status.vida, 20);
  assert.equal(original.statusJson.atributos.principais.forca, 2);
  assert.equal(original.statusJson.defesas.armadura, 5);
  assert.deepEqual(original.statusJson.condicioes, ['Atento']);
  assert.equal(original.inventarioJson[0].atributos.modificadores.ataque, -2);
  assert.equal(original.inventarioJson[1].nome, 'Braço');
  assert.equal(original.skills[0].atributos.dano, 10);
  assert.equal(original.magia[0].atributos.custo, 5);
});

test('nome obrigatório é validado em todas as variantes, não só na ficha aberta', () => {
  const variants = [{ ...createCharacterVariant(sheet()), nome: 'Arqueiro' }, createCharacterVariant(sheet())];
  assert.equal(findInvalidVariant(variants), 1);
  variants[1].nome = '   ';
  assert.equal(findInvalidVariant(variants), 1);
  variants[1].nome = 'a'.repeat(101);
  assert.equal(findInvalidVariant(variants), 1);
  variants[1].nome = 'Espadachim';
  assert.equal(findInvalidVariant(variants), -1);
});

test('salvar e reabrir preserva cada ficha e mantém a primeira nos campos legados', () => {
  const variants = [{ ...createCharacterVariant(sheet()), nome: 'Arqueiro' }, { ...createCharacterVariant(sheet()), nome: 'Veterano' }];
  variants[1].statusJson.status.vida = 80;
  variants[1].inventarioJson = [];
  const fields = buildCharacterVariantFields(variants);
  const saved = JSON.parse(JSON.stringify(fields));
  const reopened = normalizePersonagem({ ...saved, idpersonagemJogador: 1, nome: 'Guarda' });
  const restored = getCharacterVariants(reopened.statusJson);
  assert.equal(restored.length, 2);
  assert.equal(restored[1].statusJson.status.vida, 80);
  assert.equal(restored[1].inventarioJson.length, 0);
  assert.equal(reopened.statusJson.status.vida, 20);
  assert.equal(reopened.inventarioJson.length, 2);
  assert.equal(restored[1].statusJson.status.energia, 7);
  assert.equal(restored[1].statusJson.pontosSkill, 2);
});

test('reabrir para edição recupera rich text sem serializar duas vezes', () => {
  const variant = { ...createCharacterVariant(sheet()), nome: 'Arqueiro' };
  const richText = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bônus' }] }] };
  variant.inventarioJson[0].descricao = JSON.stringify(richText);
  variant.skills[0].atributos.__efeitoRichText = JSON.stringify(richText);
  variant.magia[0].efeito = JSON.stringify(richText);
  const normalized = normalizeVariantForEditing(variant);
  assert.deepEqual(normalized.inventarioJson[0].descricao, richText);
  assert.deepEqual(normalized.skills[0].efeito, richText);
  assert.deepEqual(normalized.magia[0].efeito, richText);
  assert.deepEqual(normalizeVariantForEditing(normalized), normalized);
});

test('visibilidade pode omitir status e habilidades sem quebrar a projeção da ficha', () => {
  const hidden = { id: 'a', statusJson: { status: {} }, inventarioJson: [] };
  const read = normalizePersonagem({ ...hidden, nome: '', idpersonagemJogador: 1 });
  assert.equal(read.statusJson.status.vida, 0);
  assert.deepEqual(read.skills, []);
  assert.deepEqual(read.magia, []);
});
