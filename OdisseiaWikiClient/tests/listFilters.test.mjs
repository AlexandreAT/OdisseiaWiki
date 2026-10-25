import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import React from 'react';
import { act, create } from 'react-test-renderer';

const bundle = await build({
  stdin: { contents: `export * from './src/utils/listFilters';
    export * from './src/hooks/useStoredPreferences';
    export * from './src/routes/Management/ManagementWiki/WikiForms/FormBuscarConteúdo/useFormBuscarConteúdo';
    export * from './src/routes/Management/ManagementWiki/WikiForms/FormBuscarConteúdo/ResultCard/ResultCard.style';`,
    loader: 'ts', resolveDir: process.cwd() },
  plugins: [{ name: 'management-list-services', setup(builder) {
    builder.onResolve({ filter: /\/services\/.*Service$/ }, ({ path }) => ({ path, namespace: 'test-api' }));
    builder.onLoad({ filter: /.*/, namespace: 'test-api' }, () => ({ loader: 'js', contents: `
      export const globalSearch = async () => ({
        cidades: [{id:1,nome:'Cidade',tipoEntidade:'Cidade',visivel:true,destaque:true}],
        personagens: [], infoLores: [], racas: [], pages: [],
        itens: [{id:2,nome:'Seringa',tipoEntidade:'Item',visivel:true,destaque:false},
          {id:3,nome:'Espada',tipoEntidade:'Item',visivel:false,destaque:true}]
      });
      export const excluirItem=async()=>true;
      export const deleteCidade=async()=>true;
      export const deleteRaca=async()=>true;
      export const deletePersonagem=async()=>true;
      export const deletePage=async()=>true;` }));
    builder.onResolve({ filter: /^react-hot-toast$/ }, () => ({ path: 'toast', namespace: 'test-toast' }));
    builder.onLoad({ filter: /.*/, namespace: 'test-toast' }, () => ({ loader: 'js', contents: 'export default {success(){},error(){}};' }));
  } }],
  bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic', mainFields: ['module', 'main'],
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  banner: { js: `import {createRequire} from 'node:module'; const require=createRequire(${JSON.stringify(import.meta.url)});` },
});
const source = bundle.outputFiles[0].text.replace(/((?:from|import)\s*)(["'])(react(?:-dom|\/jsx-runtime)?)\2/g,
  (_, prefix, _quote, name) => prefix + JSON.stringify(import.meta.resolve(name)));
const api = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
  .catch(error => { throw new Error(error.message.replace(/data:text\/javascript;base64,[A-Za-z0-9+/=]+/g, '[test bundle]')); });

const previousStorage = globalThis.localStorage;
let saved;
beforeEach(() => {
  saved = new Map();
  globalThis.localStorage = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) };
});
afterEach(() => { if (previousStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = previousStorage; });

test('wiki combina entidade, visibilidade e destaque, inclusive conteúdos sem destaque definido', () => {
  const items = [
    { id: 1, tipoEntidade: 'Item', visivel: true, destaque: true },
    { id: 2, tipoEntidade: 'Item', visivel: false, destaque: true },
    { id: 3, tipoEntidade: 'Cidade', visivel: true },
    { id: 4, tipoEntidade: 'Item', visivel: true },
  ];
  const find = filters => api.filterWikiResults(items, { ...api.DEFAULT_WIKI_FILTERS, ...filters }).map(item => item.id);
  assert.deepEqual(find({}), [1, 2, 3, 4]);
  assert.deepEqual(find({ entity: 'Item', visibility: 'yes', featured: 'yes' }), [1]);
  assert.deepEqual(find({ visibility: 'no', featured: 'yes' }), [2]);
  assert.deepEqual(find({ featured: 'no' }), [3, 4]);
});

test('preferências inválidas recuperam padrões e não reativam filtros ou valores arbitrários', () => {
  assert.deepEqual(api.normalizeWikiFilters({ entity: 'inexistente', visibility: 'talvez', featured: true }), api.DEFAULT_WIKI_FILTERS);
  assert.deepEqual(api.normalizeCharacterFilters(null), api.DEFAULT_CHARACTER_FILTERS);
  assert.deepEqual(api.normalizeCharacterFilters({ orderBy: 'date', filterBy: 'mesa', filterValue: '12' }),
    { orderBy: 'date', filterBy: 'mesa', filterValue: '12' });
  assert.equal(api.normalizeCharacterFilters({ filterBy: 'mesa', filterValue: '-3' }).filterValue, '');
  assert.equal(api.normalizeCharacterFilters({ filterBy: 'none', filterValue: '12' }).filterValue, '');
});

test('filtros persistem após remontar a tela, sem misturar preferências de usuários', () => {
  let state;
  let update;
  function Host({ userId }) {
    [state, update] = api.useStoredPreferences(api.characterFiltersKey(userId), api.DEFAULT_CHARACTER_FILTERS, api.normalizeCharacterFilters);
    return null;
  }
  let renderer;
  act(() => { renderer = create(React.createElement(Host, { userId: 7 })); });
  act(() => update(previous => ({ ...previous, filterBy: 'mesa', filterValue: '12', orderBy: 'date' })));
  const expected = { orderBy: 'date', filterBy: 'mesa', filterValue: '12' };
  assert.deepEqual(JSON.parse(saved.get(api.characterFiltersKey(7))), expected);
  act(() => renderer.unmount());
  act(() => { renderer = create(React.createElement(Host, { userId: 7 })); });
  assert.deepEqual(state, expected);
  act(() => renderer.update(React.createElement(Host, { userId: 8 })));
  assert.deepEqual(state, api.DEFAULT_CHARACTER_FILTERS);
  assert.deepEqual(JSON.parse(saved.get(api.characterFiltersKey(7))), expected);
  act(() => renderer.unmount());
});

test('JSON corrompido e armazenamento bloqueado não impedem alterar filtros', () => {
  saved.set(api.WIKI_LIST_FILTERS_KEY, '{invalid');
  let state;
  let update;
  function Host() {
    [state, update] = api.useStoredPreferences(api.WIKI_LIST_FILTERS_KEY, api.DEFAULT_WIKI_FILTERS, api.normalizeWikiFilters);
    return null;
  }
  let renderer;
  act(() => { renderer = create(React.createElement(Host)); });
  assert.deepEqual(state, api.DEFAULT_WIKI_FILTERS);
  globalThis.localStorage = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('full'); } };
  act(() => update(previous => ({ ...previous, visibility: 'yes' })));
  assert.equal(state.visibility, 'yes');
  act(() => renderer.unmount());
});

test('hook da busca mantém filtros salvos, aplica contagens combinadas e preserva a busca', async () => {
  saved.set(api.WIKI_LIST_FILTERS_KEY, JSON.stringify({ entity: 'Item', visibility: 'no', featured: 'yes' }));
  let state;
  function Probe() { state = api.useFormBuscarConteúdo(); return null; }
  let renderer;
  act(() => { renderer = create(React.createElement(Probe)); });
  assert.equal(state.selectedFilter, 'Item');
  act(() => state.setTermo('item'));
  await act(async () => state.handleSearch());
  assert.deepEqual(state.getFilteredResults().map(item => item.nome), ['Espada']);
  assert.equal(state.getResultCountByType('Todos'), 1);
  assert.equal(state.getResultCountByType('Cidade'), 0);
  act(() => { state.setVisibilityFilter('yes'); state.setFeaturedFilter('no'); });
  assert.deepEqual(state.getFilteredResults().map(item => item.nome), ['Seringa']);
  assert.deepEqual(JSON.parse(saved.get(api.WIKI_LIST_FILTERS_KEY)), { entity: 'Item', visibility: 'yes', featured: 'no' });
  act(() => renderer.unmount());
  act(() => { renderer = create(React.createElement(Probe)); });
  assert.equal(state.selectedFilter, 'Item');
  assert.equal(state.visibilityFilter, 'yes');
  assert.equal(state.featuredFilter, 'no');
  act(() => renderer.unmount());
});

test('busca de personagens responde ao texto, sem acentos, combinada ao filtro e à ordenação', () => {
  const characters = [
    { nome: 'Zélia', idmesa: 1, idraca: 3, idcidade: 8, mesaNome: 'Campanha', dataCriacao: '2026-01-01' },
    { nome: 'Áquila', idmesa: 1, idraca: 3, idcidade: 9, mesaNome: 'Campanha', dataCriacao: '2026-02-01' },
    { nome: 'Zélia', idmesa: 2, idraca: 4, idcidade: 8, dataCriacao: '2026-03-01' },
  ];
  const filters = { ...api.DEFAULT_CHARACTER_FILTERS, filterBy: 'mesa', filterValue: '1' };
  assert.deepEqual(api.filterCharacterResults(characters, filters, ' ZELIA ').map(character => character.idmesa), [1]);
  assert.deepEqual(api.filterCharacterResults(characters, filters, '').map(character => character.nome), ['Áquila', 'Zélia']);
  assert.deepEqual(api.filterCharacterResults(characters, filters, 'aquila campanha').map(character => character.nome), ['Áquila']);
  assert.equal(api.filterCharacterResults(characters, filters, 'sem correspondência').length, 0);
  assert.equal(api.filterCharacterResults(characters, { ...filters, orderBy: 'date' }, '')[0].nome, 'Áquila');
  assert.equal(api.filterCharacterResults(characters, api.DEFAULT_CHARACTER_FILTERS, '').length, 3);
  assert.equal(characters[0].nome, 'Zélia', 'a ordenação não modifica a lista original');
});

test('cards crescem para comportar tags completas e filtros/busca ficam nas posições solicitadas', () => {
  const rules = component => component.componentStyle.rules.join('');
  assert.match(rules(api.CardContainer), /min-height: 415px/);
  assert.doesNotMatch(rules(api.CardContainer), /(?:^|[\s;])height:/);
  assert.match(rules(api.CardContent), /flex: 1 0 auto/);
  assert.match(rules(api.TagsContainer), /flex-wrap: wrap/);
  assert.match(rules(api.TagsContainer), /flex-shrink: 0/);
  assert.doesNotMatch(rules(api.TagsContainer), /overflow: hidden/);
  assert.match(rules(api.CardActions), /flex-shrink: 0/);
  const wiki = readFileSync('src/routes/Management/ManagementWiki/WikiForms/FormBuscarConteúdo/FormBuscarConteúdo.tsx', 'utf8');
  assert.ok(wiki.indexOf('</FilterContainer>') < wiki.indexOf('<StatusFilters>'));
  assert.ok(wiki.indexOf('</StatusFilters>') < wiki.indexOf('<ResultsInfo'));
  const characters = readFileSync('src/routes/Hub/UserCharacters/UserCharacters.tsx', 'utf8');
  assert.ok(characters.indexOf('</ListHeaderTools>') < characters.indexOf('<CharacterSearch>'));
  assert.match(characters, /<Search theme=\{theme\} neon=\{neon\} width="100%"/);
});
