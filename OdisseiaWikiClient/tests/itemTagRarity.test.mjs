import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { act, create } from 'react-test-renderer';

const bundle = await build({
  stdin: { contents: `export * from './src/utils/itemTagRarity';
    export { ItemTag } from './src/components/Generic/ItemTag/ItemTag.style';
    export { Tag } from './src/routes/Management/ManagementWiki/WikiForms/FormBuscarConteúdo/ResultCard/ResultCard.style';
    export { ResultCard } from './src/routes/Management/ManagementWiki/WikiForms/FormBuscarConteúdo/ResultCard/ResultCard';
    export { ServerStyleSheet } from 'styled-components';`, loader: 'ts', resolveDir: process.cwd() },
  plugins: [{ name: 'decorative-comparison', setup(builder) {
    builder.onResolve({ filter: /\/components\/CharacterComparison$/ }, () => ({ path: 'comparison', namespace: 'test-leaf' }));
    builder.onLoad({ filter: /.*/, namespace: 'test-leaf' }, () => ({ loader: 'js',
      contents: 'export function CharacterComparisonButton(){return null;} export function CharacterComparisonModal(){return null;}' }));
  } }],
  bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic', mainFields: ['module', 'main'],
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  banner: { js: `import {createRequire} from 'node:module'; const require=createRequire(${JSON.stringify(import.meta.url)});` },
});
const source = bundle.outputFiles[0].text.replace(/((?:from|import)\s*)(["'])(react(?:-dom|\/jsx-runtime)?)\2/g,
  (_, prefix, _quote, name) => prefix + JSON.stringify(import.meta.resolve(name)));
const api = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
  .catch(error => { throw new Error(error.message.replace(/data:text\/javascript;base64,[A-Za-z0-9+/=]+/g, '[test bundle]')); });

test('raridades reconhecem acentos, caixa, gênero e plural sem classificar tags comuns', () => {
  for (const tag of ['Único', 'unico', 'ÚNICA', 'Itens únicos']) assert.equal(api.getItemTagRarity(tag), 'unique');
  for (const tag of ['Lendário', 'lendario', ' LENDÁRIA ', 'Armas lendárias']) assert.equal(api.getItemTagRarity(tag), 'legendary');
  for (const tag of ['Comum', 'Consumível', 'Item', 'comunicação']) assert.equal(api.getItemTagRarity(tag), undefined);
});

test('cards da pesquisa passam raridade e estado do neon para cada tag', () => {
  const item = { id: 1, nome: 'Seringa', tipoEntidade: 'Item', visivel: true, tags: ['Único', 'Lendário', 'Suporte', 'Outro'] };
  let renderer;
  act(() => { renderer = create(React.createElement(api.ResultCard, { item, theme: 'dark', neon: 'off' })); });
  let tags = renderer.root.findAllByType(api.Tag);
  assert.deepEqual(tags.map(tag => tag.props.$rarity), ['unique', 'legendary', undefined, undefined]);
  assert.equal(tags[0].props.$neon, false);
  assert.equal(tags[1].props.$neon, false);
  assert.equal(React.Children.toArray(tags[3].props.children).join(''), '+1');
  act(() => renderer.update(React.createElement(api.ResultCard, { item, theme: 'light', neon: 'on' })));
  tags = renderer.root.findAllByType(api.Tag);
  assert.equal(tags[0].props.$neon, true);
  assert.equal(tags[1].props.$neon, true);
  act(() => renderer.unmount());
});

test('tags da busca herdam a paleta pública com cores mesmo sem neon e animação apenas com neon', () => {
  for (const neon of [false, true]) {
    const sheet = new api.ServerStyleSheet();
    try {
      renderToStaticMarkup(sheet.collectStyles(React.createElement(React.Fragment, null,
        React.createElement(api.Tag, { $rarity: 'unique', $neon: neon }, 'Único'),
        React.createElement(api.Tag, { $rarity: 'legendary', $neon: neon }, 'Lendário'))));
      const css = sheet.getStyleTags();
      assert.match(css, /--tag-accent:var\(--clearneonGreen\)/);
      assert.match(css, /--tag-accent:#ffd52d/);
      assert.match(css, /color:var\(--tag-accent\)!important/);
      assert.match(css, /:root\[data-motion='reduced'\]/);
      assert.equal(/1\.75s linear infinite/.test(css), neon);
      assert.ok(api.Tag.foldedComponentIds.includes(api.ItemTag.styledComponentId));
    } finally { sheet.seal(); }
  }
});
