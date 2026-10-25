import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import React from 'react';
import { act, create } from 'react-test-renderer';

const bundle = await build({ stdin: { contents: `export * from './src/routes/Game/GameRunShell/RunTraining/RunTraining';`,
  resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node',
  jsx: 'automatic', mainFields: ['module', 'main'], external: ['react', 'react/jsx-runtime'], loader: { '.svg': 'text' },
  banner: { js: `import {createRequire} from 'node:module'; const require=createRequire(${JSON.stringify(import.meta.url)});` },
  plugins: [{ name: 'training-surfaces', setup(builder) {
    const stub = (filter, name, contents) => {
      builder.onResolve({ filter }, () => ({ path: name, namespace: name }));
      builder.onLoad({ filter: /.*/, namespace: name }, () => ({ contents, loader: 'js' }));
    };
    stub(/^@mui\/icons-material\//, 'icon', `import {createElement} from 'react'; export default ()=>createElement('svg');`);
    stub(/\/services\/gameBattlePreviewService$/, 'service', `
      export const getGameTrainingEnemies=(...args)=>globalThis.__trainingList(...args);
      export const createGameBattlePreview=(...args)=>globalThis.__trainingStart(...args);`);
    stub(/\/BattleReplay\/BattleReplay$/, 'replay', `import {createElement} from 'react'; export const BattleReplay=props=>createElement('test-replay',props);`);
    stub(/\/RunResourceBar\/RunResourceBar$/, 'bar', `import {createElement} from 'react'; export const RunResourceBar=props=>createElement('test-bar',props);`);
  } }],
});
const source = bundle.outputFiles[0].text.replace(/((?:from|import)\s*)(["'])(react(?:\/jsx-runtime)?)\2/g,
  (_, prefix, _quote, name) => prefix + JSON.stringify(import.meta.resolve(name)));
const api = await import(`data:text/javascript;base64,${Buffer.from(source + '\n//# sourceURL=run-training.test-bundle.js').toString('base64')}`)
  .catch(error => { throw new Error(error.message.replace(/data:text\/javascript;base64,[A-Za-z0-9+/=]+/g, '[test bundle]')); });
const enemies = [
  { key: 'default', nome: 'Sentinela', vida: 300, mana: 0, estamina: 100 },
  { key: 'mage', nome: 'Maga de fogo', imagem: '/mage.png', vida: 400, mana: 200, estamina: 50 },
];
const props = { runId: 12, theme: 'dark', neon: 'on', playerImage: '/player.png' };
const choices = renderer => renderer.root.findAllByType('button').filter(node => node.props['aria-label']?.startsWith('Treinar contra'));
const text = node => typeof node === 'string' ? node : (node.children ?? []).map(text).join('');

test('escolher inimigo inicia treino direto, reutiliza barras e impede cliques concorrentes', async () => {
  let renderer, finish;
  const requests = [];
  globalThis.__trainingList = async id => { assert.equal(id, 12); return enemies; };
  globalThis.__trainingStart = (...args) => { requests.push(args); return new Promise(resolve => { finish = resolve; }); };
  await act(async () => { renderer = create(React.createElement(api.RunTraining, props)); });
  assert.equal(choices(renderer).length, 2);
  assert.equal(renderer.root.findAllByType('img').length, 1);
  assert.deepEqual(renderer.root.findAllByType('test-bar').map(node => [node.props.label, node.props.value]),
    [['Vida', 300], ['Mana', 0], ['Estamina', 100], ['Vida', 400], ['Mana', 200], ['Estamina', 50]]);
  let pending;
  act(() => { pending = choices(renderer)[1].props.onClick(); choices(renderer)[0].props.onClick(); });
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0].slice(0, 2), [12, 'mage']);
  assert.ok(choices(renderer).every(node => node.props.disabled));
  const battle = { resultado: { events: [] } };
  await act(async () => { finish(battle); await pending; });
  assert.equal(renderer.root.findByType('test-replay').props.savedBattle, battle);
  assert.equal(renderer.root.findByType('test-replay').props.isHistoricalReplay, true);
  act(() => renderer.root.findAllByType('button').find(node => text(node) === 'Escolher oponente').props.onClick());
  assert.equal(choices(renderer).length, 2);
  act(() => renderer.root.findByType('img').props.onError());
  assert.equal(renderer.root.findAllByType('img').length, 0);
  act(() => renderer.unmount());
});

test('fechar o modal cancela a preparação e ignora resposta tardia', async () => {
  let renderer, finish, signal;
  globalThis.__trainingList = async () => enemies;
  globalThis.__trainingStart = (_run, _key, value) => { signal = value; return new Promise(resolve => { finish = resolve; }); };
  await act(async () => { renderer = create(React.createElement(api.RunTraining, props)); });
  act(() => choices(renderer)[0].props.onClick());
  act(() => renderer.unmount());
  assert.equal(signal.aborted, true);
  await act(async () => { finish({ resultado: { events: [] } }); });
  assert.equal(renderer.toJSON(), null);
});

test('erro ao carregar o catálogo pode ser tentado novamente', async () => {
  let renderer, calls = 0;
  globalThis.__trainingList = async () => { if (++calls === 1) throw new Error('offline'); return enemies; };
  await act(async () => { renderer = create(React.createElement(api.RunTraining, props)); });
  assert.equal(choices(renderer).length, 0);
  await act(async () => renderer.root.findAllByType('button').find(node => text(node) === 'Tentar novamente').props.onClick());
  assert.equal(choices(renderer).length, 2);
  act(() => renderer.unmount());
});
