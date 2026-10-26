import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import React from 'react';
import { act, create } from 'react-test-renderer';

const bundle = await build({
  entryPoints: ['src/routes/Game/GameRunShell/RunVictoryProtectedItems.tsx'],
  bundle: true, write: false, format: 'cjs', platform: 'node', jsx: 'automatic',
  mainFields: ['module', 'main'], external: ['react', 'react-dom', 'react/jsx-runtime'],
  loader: { '.svg': 'text' },
  plugins: [{ name: 'deposit-api', setup(builder) {
    builder.onResolve({ filter: /^@mui\/icons-material\// }, args => ({ path: args.path, namespace: 'icons' }));
    builder.onLoad({ filter: /.*/, namespace: 'icons' }, () => ({ contents: 'export default function Icon(){return null;}', loader: 'js' }));
    builder.onResolve({ filter: /services\/gameRunService$/ }, () => ({ path: 'deposit', namespace: 'test' }));
    builder.onLoad({ filter: /.*/, namespace: 'test' }, () => ({
      contents: 'export const getGameRunProtectedDeposit=(...args)=>globalThis.__victoryDeposit(...args);', loader: 'js',
    }));
  } }],
});
const module = { exports: {} };
new Function('require', 'module', 'exports', bundle.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
const { RunVictoryProtectedItems } = module.exports;
let view;
afterEach(() => { if (view) act(() => view.unmount()); view = null; delete globalThis.__victoryDeposit; });
const run = { idGameRun: 7, revisao: 10 };
const protectedData = { slots: 3, cost: 0, items: [{ itemId: 'seguro', compatible: true,
  snapshot: { id: 'seguro', nome: 'Seringa regenerativa', tipo: 'consumiveis', quantidade: 3 } }] };
const text = node => typeof node === 'string' ? node : Array.isArray(node) ? node.map(text).join(' ')
  : node?.children ? text(node.children) : '';

test('resumo consulta o depósito protegido e mostra nome e quantidade após carregar', async () => {
  let resolve;
  let request;
  globalThis.__victoryDeposit = (id, signal) => {
    request = { id, signal };
    return new Promise(done => { resolve = done; });
  };
  await act(async () => { view = create(React.createElement(RunVictoryProtectedItems, { run, theme: 'dark', neon: 'on' })); });
  assert.equal(request.id, 7);
  assert.match(text(view.toJSON()), /Consultando depósito protegido/);
  await act(async () => { resolve(protectedData); });
  const output = text(view.toJSON());
  assert.match(output, /Levados para casa/);
  assert.match(output, /Seringa regenerativa/);
  assert.match(output, /3\s+unidades protegidas/);
  assert.match(output, /mochila ou no depósito comum não são levados/);
  assert.equal(view.root.findAllByType('li').length, 1);
});

test('erro de consulta não se passa por depósito vazio e permite tentar novamente', async () => {
  let calls = 0;
  globalThis.__victoryDeposit = () => ++calls === 1 ? Promise.reject(Error('offline')) : Promise.resolve({ ...protectedData, items: [] });
  await act(async () => { view = create(React.createElement(RunVictoryProtectedItems, { run, theme: 'dark', neon: 'off' })); });
  assert.equal(view.root.findAllByProps({ role: 'alert' }).length, 1);
  assert.doesNotMatch(text(view.toJSON()), /Nenhum item protegido/);
  await act(async () => { view.root.findByType('button').props.onClick(); });
  assert.equal(calls, 2);
  assert.match(text(view.toJSON()), /Nenhum item protegido/);
});

test('fechar o resumo aborta a consulta e ignora uma resposta atrasada', async () => {
  let resolve;
  let signal;
  globalThis.__victoryDeposit = (_, received) => { signal = received; return new Promise(done => { resolve = done; }); };
  await act(async () => { view = create(React.createElement(RunVictoryProtectedItems, { run, theme: 'dark', neon: 'on' })); });
  act(() => view.unmount()); view = null;
  assert.equal(signal.aborted, true);
  await act(async () => { resolve(protectedData); });
});
