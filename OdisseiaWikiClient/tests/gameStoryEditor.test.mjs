import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import React, { useState } from 'react';
import { act, create } from 'react-test-renderer';
import { renderToStaticMarkup } from 'react-dom/server';

const mocks = [
  [/^@mui\/icons-material\//, `import {createElement} from 'react'; export default function Icon(props){return createElement('svg',props);}`],
  [/\/Generic\/Modal\/Modal$/, `import {createElement} from 'react'; export const Modal=({children,...props})=>createElement('story-editor-modal',props,children);`],
  [/\/services\/sistemasRpgService$/, `export const obterConfiguracaoSobrevivenciaSistemaRpg=async()=>({condicoes:[]});`],
  [/\/services\/assetsService$/, `export const saveAsset=async()=>({path:'/image.png'});`],
  [/\/useGameItemCatalog$/, `export const useGameItemCatalog=()=>({items:[],loading:false,error:null});`],
  [/\/ManagementGameNpcServices$/, `export const ManagementGameNpcServices=()=>null;`],
  [/\/ManagementGameVendorOffers$/, `export const ManagementGameVendorOffers=()=>null;`],
  [/\/ManagementGameStoryEffects$/, `export const StoryCostEditor=()=>null; export const StoryOutcomeEditor=()=>null;`],
  [/\/ImageUploader\/ImageUploader$/, `export const ImageUploader=()=>null;`],
];
const bundle = await build({
  stdin: { contents: `export * from './src/routes/Management/ManagementGame/ManagementGameStoryEditor';
    export * from './src/routes/Management/ManagementGame/ManagementGameStoryEditor.style';
    export * from './src/content/gameConfigurationHelp'; export { ServerStyleSheet } from 'styled-components';`,
  loader: 'ts', resolveDir: process.cwd() },
  plugins: [{ name: 'story-editor-services', setup(builder) {
    mocks.forEach(([filter, contents], index) => {
      builder.onResolve({ filter }, () => ({ path: String(index), namespace: 'story-editor-test' }));
      builder.onLoad({ filter: new RegExp(`^${index}$`), namespace: 'story-editor-test' }, () => ({ contents, loader: 'js' }));
    });
  } }],
  bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic', mainFields: ['module', 'main'],
  loader: { '.svg': 'text' },
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  banner: { js: `import {createRequire} from 'node:module'; const require=createRequire(${JSON.stringify(import.meta.url)});` },
});
const source = bundle.outputFiles[0].text.replace(/((?:from|import)\s*)(["'])(react(?:-dom|\/jsx-runtime)?)\2/g,
  (_, prefix, _quote, name) => prefix + JSON.stringify(import.meta.resolve(name)));
const api = await import(`data:text/javascript;base64,${Buffer.from(source + '\n//# sourceURL=game-story-editor.test.bundle.js').toString('base64')}`)
  .catch(error => { throw new Error(error.message.replace(/data:text\/javascript;base64,[A-Za-z0-9+/=]+/g, '[editor bundle]')); });
const text = node => typeof node === 'string' ? node : (Array.isArray(node) ? node : node?.children ?? []).map(text).join('');
const button = (view, label) => view.root.findAllByType('button').find(node => text(node) === label);
const props = { areas: [], encounters: {}, systemVersionId: 7, theme: 'dark', neon: 'off', editable: true };

test('encontro desconhecido vazio abre compacto, com ajuda e ações juntas; adicionar/remover redimensiona sem perder dados', async () => {
  let view, current;
  function Editor() {
    const [option, setOption] = useState({ type: 'SURPRESA', encounterCode: '', weight: 3, label: 'Sinal oculto', surpriseOptions: [] });
    current = option;
    return React.createElement(api.ManagementGameStoryEditor, { ...props, option, onChange: setOption });
  }
  act(() => { view = create(React.createElement(Editor)); });
  assert.match(text(view.toJSON()), /Possíveis encontros/);
  assert.doesNotMatch(text(view.toJSON()), /Surpresa/);
  await act(async () => { view.root.findByType('button').props.onClick(); });
  let modal = view.root.findByType('story-editor-modal');
  assert.equal(modal.props.title, 'Possíveis encontros');
  assert.equal(modal.props.width, '620px');
  assert.equal(view.root.findByType(api.StoryEditorBody).props.$compact, true);
  assert.match(text(view.toJSON()), /só descobre o que encontrará/);
  assert.deepEqual(view.root.findByType(api.StoryEditorActions).findAllByType('button').map(text), ['Adicionar resultado', 'Concluir']);
  await act(async () => { button(view, 'Adicionar resultado').props.onClick(); });
  assert.equal(current.surpriseOptions.length, 1);
  assert.equal(current.type, 'SURPRESA');
  assert.equal(current.weight, 3);
  assert.equal(current.label, 'Sinal oculto');
  assert.equal(view.root.findByType('story-editor-modal').props.width, '1100px');
  assert.equal(view.root.findByType(api.StoryEditorBody).props.$compact, false);
  assert.match(text(view.toJSON()), /1 encontro possível/);
  await act(async () => { button(view, 'Remover resultado').props.onClick(); });
  assert.equal(view.root.findByType('story-editor-modal').props.width, '620px');
  assert.equal(current.surpriseOptions.length, 0);
  act(() => button(view, 'Concluir').props.onClick());
  assert.equal(view.root.findAllByType('story-editor-modal').length, 0);
  act(() => view.unmount());
});

test('modo somente leitura mantém conclusão disponível e bloqueia inclusão; dez encontros respeitam o teto', async () => {
  for (const [editable, count] of [[false, 0], [true, 10]]) {
    let view;
    const option = { type: 'SURPRESA', encounterCode: '', weight: 1,
      surpriseOptions: Array.from({ length: count }, (_, index) => ({ type: 'COMBATE', encounterCode: '', weight: 1, label: `Encontro ${index}` })) };
    act(() => { view = create(React.createElement(api.ManagementGameStoryEditor, { ...props, editable, option, onChange() {} })); });
    await act(async () => { view.root.findByType('button').props.onClick(); });
    assert.equal(button(view, 'Adicionar resultado').props.disabled, true);
    assert.equal(button(view, 'Concluir').props.disabled, false);
    assert.equal(view.root.findByType('story-editor-modal').props.width, count ? '1100px' : '620px');
    act(() => view.unmount());
  }
});

test('evento e missão não herdam o tamanho compacto e escolhas também compartilham a linha de ações', async () => {
  for (const type of ['EVENTO', 'MISSAO']) {
    let view;
    act(() => { view = create(React.createElement(api.ManagementGameStoryEditor, {
      ...props, option: { type, encounterCode: '', weight: 1 }, onChange() {},
    })); });
    await act(async () => { view.root.findByType('button').props.onClick(); });
    assert.equal(view.root.findByType('story-editor-modal').props.width, '1100px');
    assert.equal(view.root.findByType(api.StoryEditorBody).props.$compact, false);
    assert.deepEqual(view.root.findByType(api.StoryEditorActions).findAllByType('button').map(text),
      type === 'EVENTO' ? ['Adicionar escolha', 'Concluir'] : ['Concluir']);
    act(() => view.unmount());
  }
});

test('estado vazio centraliza conteúdo sem alterar o preenchido; ações reutilizam a quebra responsiva padrão', () => {
  const css = compact => {
    const sheet = new api.ServerStyleSheet();
    try {
      renderToStaticMarkup(sheet.collectStyles(React.createElement(api.StoryEditorBody, { $compact: compact },
        React.createElement('h4', null, 'Possíveis encontros'),
        React.createElement(api.StoryEditorActions, null, React.createElement('button', null, 'Adicionar resultado'),
          React.createElement('button', null, 'Concluir')))));
      return sheet.getStyleTags();
    } finally { sheet.seal(); }
  };
  assert.match(css(true), /justify-items:center/);
  assert.match(css(true), /text-align:center/);
  assert.doesNotMatch(css(false), /justify-items:center/);
  assert.match(css(true), /@media\s*\(max-width:\s*600px\).*?flex-direction:column/s);
  const management = readFileSync('src/routes/Management/ManagementGame/ManagementGame.tsx', 'utf8');
  assert.match(management, /value: 'SURPRESA', label: 'Encontro desconhecido'/);
  assert.equal(api.gameConfigurationHelp.surpriseResults.title, 'Encontro desconhecido');
  assert.match(api.gameConfigurationHelp.surpriseResults.text, /depois de escolher esse caminho/);
});
