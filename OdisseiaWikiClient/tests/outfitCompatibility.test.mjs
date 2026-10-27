import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

const bundled = await build({ stdin: { contents: `export * from './src/utils/outfitCompatibility';`,
  resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node' });
const api = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
const path = code => `TRAJE/PROTECOES/${code}`;
const scope = (codigo, nivel, filhos = [], allowed) => ({ codigo, nome: codigo, nivel, filhos,
  ativo: true, codigoCaminho: '', ...(allowed === undefined ? {} : { arquetiposCompativeis: allowed }) });
const fixture = () => [scope('TRAJE', 'Tipo', [scope('PROTECOES', 'Categoria', [
  scope('COLETE', 'Arquetipo', [], [path('OUTROS')]), scope('TRAJE', 'Arquetipo', [], []),
  scope('OUTROS', 'Arquetipo', [], [path('COLETE')]),
])])];
const entry = (code, id = code) => ({ idInstancia: id, name: id, tipo: 'ITEM', subtype: 'traje', outfitArchetype: code });
const check = (a, b, types = fixture()) => api.outfitCompatibilityError(a, [a, b], [b.idInstancia], { tipos: types });

test('equipamento aplica compatibilidade recíproca e não depende da ordem das peças', () => {
  for (const [first, second, allowed] of [['COLETE','OUTROS',true],['COLETE','TRAJE',false],['TRAJE','OUTROS',false],['COLETE','COLETE',false]]) {
    for (const [a,b] of [[entry(first,'a'),entry(second,'b')], [entry(second,'b'),entry(first,'a')]]) {
      const error = check(a,b); assert.equal(error === null, allowed);
      if (!allowed) { assert.match(error, /a/); assert.match(error, /b/); assert.match(error, /não podem ser usados juntos/); }
    }
  }
  const types = fixture(); types[0].filhos[0].filhos[2].arquetiposCompativeis = [];
  assert.match(check(entry('COLETE'), entry('OUTROS'), types), /não podem/);
});

test('arquétipo próprio libera repetição; peças guardadas e próteses não bloqueiam', () => {
  let types = fixture();
  types = api.setOutfitCompatibility(types, [0,0,0], [path('OUTROS'),path('COLETE')]);
  assert.equal(check(entry('COLETE','a'),entry('COLETE','b'),types),null);
  assert.equal(api.outfitCompatibilityError(entry('TRAJE'), [entry('COLETE')], [], {tipos:types}),null);
  assert.equal(check({...entry('TRAJE'),tipo:'PROTESE',subtype:'implante'},entry('COLETE'),types),null);
});

test('arquétipos novos aparecem imediatamente e seleção atualiza as duas pontas sem mutar a origem', () => {
  const original = fixture(), before = structuredClone(original);
  original[0].filhos[0].filhos.push(scope('OCULOS','Arquetipo',[],[]));
  assert.equal(api.outfitArchetypes(original).length,4);
  const next = api.setOutfitCompatibility(original,[0,0,0],[path('OUTROS'),path('OCULOS')]);
  assert.deepEqual(original[0].filhos[0].filhos.slice(0,3),before[0].filhos[0].filhos);
  assert.deepEqual(api.outfitCompatibilitySelection(api.outfitArchetypes(next)[3],api.outfitArchetypes(next)),[path('COLETE')]);
  const removed = api.setOutfitCompatibility(next,[0,0,3],[]);
  assert.deepEqual(removed[0].filhos[0].filhos[0].arquetiposCompativeis,[path('OUTROS')]);
});

test('editar códigos, inclusive apagando antes de digitar, mantém os vínculos; excluir remove referências', () => {
  let before = fixture(), next = structuredClone(before);
  next[0].filhos[0].filhos[2].codigo = '';
  next = api.reconcileOutfitLinks(before,next,true);
  assert.deepEqual(next[0].filhos[0].filhos[0].arquetiposCompativeis,[path('OUTROS')]);
  before = next; next = structuredClone(before); next[0].filhos[0].filhos[2].codigo = 'Óculos';
  next = api.reconcileOutfitLinks(before,next,true);
  assert.deepEqual(next[0].filhos[0].filhos[0].arquetiposCompativeis,[path('OCULOS')]);
  before = next; next = structuredClone(before); next[0].filhos[0].codigo = 'ROUPAS';
  next = api.reconcileOutfitLinks(before,next,true);
  assert.deepEqual(next[0].filhos[0].filhos[2].arquetiposCompativeis,['TRAJE/ROUPAS/COLETE']);
  before = next; next = structuredClone(before); next[0].filhos[0].filhos.splice(2,1);
  next = api.reconcileOutfitLinks(before,next);
  assert.deepEqual(next[0].filhos[0].filhos[0].arquetiposCompativeis,[]);
});

test('versões sem configuração mantêm legado; vazio explícito significa usar sozinho', () => {
  const types = fixture(); types[0].filhos[0].filhos.forEach(scope => {scope.arquetiposCompativeis = null;});
  assert.equal(check(entry('COLETE','a'),entry('COLETE','b'),types),null);
  let next = api.setOutfitCompatibility(types,[0,0,1],[]);
  assert.equal(check(entry('COLETE'),entry('OUTROS'),next),null);
  assert.match(check(entry('TRAJE'),entry('OUTROS'),next), /não podem/);
  assert.deepEqual(types[0].filhos[0].filhos.map(scope=>scope.arquetiposCompativeis),[null,null,null]);
  next = api.setOutfitCompatibility(next,[0,0,0],[]);
  assert.match(check(entry('COLETE'),entry('OUTROS'),next), /não podem/);
});

test('subcategoria inválida, inativa ou ambígua exige correção e aceita categoria explícita', () => {
  let types = fixture();
  assert.match(check(entry('NOVA'),entry('COLETE'),types), /subcategoria/);
  types[0].filhos[0].filhos[0].ativo = false;
  assert.match(check(entry('COLETE'),entry('OUTROS'),types), /subcategoria/);
  types = fixture(); types[0].filhos.push(scope('ROUPAS','Categoria',[scope('COLETE','Arquetipo',[],[])]));
  assert.match(check(entry('COLETE'),entry('OUTROS'),types), /subcategoria/);
  assert.equal(check({...entry('COLETE'),outfitCategory:'PROTECOES'},entry('OUTROS'),types),null);
});

test('aliases antigos preservam compatibilidade, mas não substituem código personalizado existente', () => {
  const types = fixture();
  assert.equal(check(entry('vest'),entry('OUTROS'),types),null);
  assert.match(check(entry('vest'),entry('traje_completo'),types), /não podem/);
  types[0].filhos[0].filhos.push(scope('VEST','Arquetipo',[],[]));
  assert.match(check(entry('vest'),entry('OUTROS'),types), /não podem/);
});

test('regras continuam ativas com subcategorias desativadas e catálogo público filtrado', () => {
  for (const part of ['tipo', 'categoria', 'arquetipos']) {
    const types = fixture();
    if (part === 'tipo') types[0].ativo = false;
    else if (part === 'categoria') types[0].filhos[0].ativo = false;
    else types[0].filhos[0].filhos.forEach(scope => { scope.ativo = false; });
    assert.match(check(entry('COLETE'), entry('OUTROS'), types), /subcategoria/);
  }
  assert.match(api.outfitCompatibilityError(entry('COLETE'), [], [], {
    tipos: [], regrasTrajeConfiguradas: true, arquetiposTrajeConhecidos: [path('COLETE')],
  }), /subcategoria/);
});

test('alias não reativa código personalizado desativado, mesmo omitido da árvore pública', () => {
  const types = fixture();
  types[0].filhos[0].filhos.push({...scope('VEST','Arquetipo',[],[]), ativo: false});
  assert.match(check(entry('VEST'), entry('OUTROS'), types), /subcategoria/);
  assert.match(api.outfitCompatibilityError(entry('VEST'), [], [], {
    tipos: fixture(), regrasTrajeConfiguradas: true, arquetiposTrajeConhecidos: [path('VEST')],
  }), /subcategoria/);
});
