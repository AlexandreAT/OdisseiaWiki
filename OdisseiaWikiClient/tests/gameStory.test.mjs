import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { renderToStaticMarkup } from 'react-dom/server';

const bundle = await build({
  stdin: { contents: `export * from './src/utils/gameStory';
    export * from './src/routes/Game/GameRunShell/RunStoryDialog';
    export * from './src/routes/Game/GameRunShell/RunStoryJournal';
    export * from './src/routes/Game/RunMapCanvas/RunMapCanvas';`, loader: 'ts', resolveDir: process.cwd() },
  plugins: [{ name: 'story-surfaces', setup(builder) {
    builder.onResolve({ filter: /\/Generic\/Modal\/Modal$/ }, () => ({ path: 'modal', namespace: 'story-test' }));
    builder.onLoad({ filter: /modal/, namespace: 'story-test' }, () => ({ loader: 'js', contents: `import {createElement} from 'react';
      export const Modal=({children,...props})=>createElement('story-modal',props,children);` }));
    builder.onResolve({ filter: /\/GameRunShell.style$/ }, () => ({ path: 'footer', namespace: 'story-test' }));
    builder.onLoad({ filter: /footer/, namespace: 'story-test' }, () => ({ loader: 'js', contents: "import {createElement} from 'react'; export const RunFooterActions=({children})=>createElement('div',null,children);" }));
  } }], bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic',
  external: ['react', 'react/jsx-runtime'], mainFields: ['module', 'main'], loader: { '.svg': 'text' },
  banner: { js: `import {createRequire} from 'node:module'; const require=createRequire(${JSON.stringify(import.meta.url)});` },
});
const source = bundle.outputFiles[0].text.replace(/((?:from|import)\s*)(["'])(react(?:\/jsx-runtime)?)\2/g,
  (_, prefix, _quote, name) => prefix + JSON.stringify(import.meta.resolve(name)));
const api = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
  .catch(error => { throw new Error(error.message.replace(/data:text\/javascript;base64,[A-Za-z0-9+/=]+/g, '[story bundle]')); });
const text = node => typeof node === 'string' ? node : (node.children ?? []).map(text).join('');
const cost = values => ({ ...api.emptyStoryCost(), ...values });
const outcome = values => ({ ...api.emptyStoryOutcome(), ...values });
const state = { economy: { balance: 10 }, status: { status: { vida: 20, mana: 5, estamina: 8 } } };

test('custos e efeitos distinguem pagamento, percentuais, penalidades, duração e recompensas exatas', () => {
  assert.equal(api.storyCostText(cost()), 'Sem custo');
  assert.match(api.storyCostText(cost({ currency: 1234, life: 2 })), /1.234 moedas · 2 vida/);
  assert.equal(api.storyCannotPay(cost({ currency: 11 }), state), 'Moedas insuficientes');
  assert.equal(api.storyCannotPay(cost({ life: 20 }), state), 'Vida insuficiente');
  assert.equal(api.storyCannotPay(cost({ mana: 6 }), state), 'Mana insuficiente');
  assert.equal(api.storyCannotPay(cost({ stamina: 9 }), state), 'Estamina insuficiente');
  assert.equal(api.storyCannotPay(cost({ life: 19, currency: 10 }), state), null);
  assert.deepEqual(api.storyOutcomeText(outcome({ life: -25, mana: 10, percentage: true, xp: 3, gameMinutes: 60,
    items: [{ itemId: 'cura', quantity: 2, snapshot: { nome: 'Seringa' } }], conditions: [{ code: 'REGEN', duration: 4, durationUnit: 'Turno' }] })),
    ['+3 XP', '-25% vida', '+10% mana', '2× Seringa', 'REGEN (4 turnos)', 'Avança 60 min']);
  const first = api.emptyStoryOutcome(); first.items.push({});
  assert.deepEqual(api.emptyStoryOutcome().items, []);
});

test('resultado distingue vitória, derrota e retirada e referências incluem conteúdo oculto da surpresa', () => {
  assert.equal(api.runResultPresentation('Vitoria').title, 'Parabéns!');
  assert.equal(api.runResultPresentation('Derrota').title, 'Fim da jornada');
  assert.equal(api.runResultPresentation('Abandonada').title, 'Retirada');
  const routes = api.storyRoutes([{ options: [{ type: 'SURPRESA', surpriseOptions: [
    { type: 'COMBATE', encounterCode: 'NPC' }, { type: 'MISSAO', mission: { areaCode: 'LAB' } }] }] }]);
  assert.ok(routes.some(route => route.encounterCode === 'NPC')); assert.ok(routes.some(route => route.mission?.areaCode === 'LAB'));
  const hook = readFileSync('src/routes/Game/GameRunShell/useGameRun.ts', 'utf8');
  const abandon = hook.slice(hook.indexOf('const abandon ='), hook.indexOf('const restart ='));
  assert.match(abandon, /setRun\(abandoned\)/); assert.doesNotMatch(abandon, /navigate\('\/jogo'/);
});

test('evento mostra consequências antes da confirmação, mantém saída gratuita e não antecipa comando', async () => {
  const calls = []; let closed = 0, view;
  const props = { run: { estadoAtual: state }, node: { name: 'Laboratório', description: 'Escolha seu caminho.', payload: { choices: [
    { code: 'pagar', label: 'Tratamento', cost: cost({ currency: 20 }), outcome: outcome({ life: 100 }) },
    { code: 'sair', label: 'Seguir em frente', cost: cost(), outcome: outcome() }] } }, theme: 'dark', neon: 'on', busy: false,
    onChoose: async code => { calls.push(code); return true; }, onClose: () => closed++ };
  act(() => { view = create(React.createElement(api.RunStoryDialog, props)); });
  assert.deepEqual(calls, []); assert.match(text(view.toJSON()), /Moedas insuficientes/);
  let buttons = view.root.findAllByType('button');
  assert.equal(buttons[0].props.disabled, true); assert.equal(buttons[1].props.disabled, false);
  await act(async () => { await buttons[1].props.onClick(); }); assert.deepEqual(calls, ['sair']);
  act(() => view.update(React.createElement(api.RunStoryDialog, { ...props, busy: true })));
  buttons = view.root.findAllByType('button'); assert.ok(buttons.every(button => button.props.disabled));
  act(() => view.root.findByType('story-modal').props.onClose()); assert.equal(closed, 0);
  act(() => view.unmount());
});

test('missão permite recusar sem cobrar, mostra recompensa posterior e respeita obrigação publicada', async () => {
  const calls = []; let view;
  const props = { run: { estadoAtual: state }, node: { name: 'Resgate', payload: { mission: {
    areaCode: 'LAB', canDecline: true, cost: cost({ currency: 5 }), reward: outcome({ currency: 50, xp: 10 }) } } },
    theme: 'dark', neon: 'off', busy: false, onClose() {}, onChoose: async code => { calls.push(code); return true; } };
  act(() => { view = create(React.createElement(api.RunStoryDialog, props)); });
  assert.match(text(view.toJSON()), /Conclua a área/); assert.match(text(view.toJSON()), /\+50 moedas/);
  await act(async () => { view.root.findAllByType('button')[0].props.onClick(); }); assert.deepEqual(calls, ['DECLINE']);
  act(() => view.update(React.createElement(api.RunStoryDialog, { ...props, node: { ...props.node,
    payload: { mission: { ...props.node.payload.mission, canDecline: false } } } })));
  assert.equal(view.root.findAllByType('button').length, 1);
  await act(async () => { view.root.findAllByType('button')[0].props.onClick(); }); assert.deepEqual(calls, ['DECLINE', 'ACCEPT']);
  act(() => view.unmount());
});

test('objetivos encadeados e registro da jornada sobrevivem ao estado serializado sem anunciar missão incompleta como concluída', () => {
  const outer = { id: 'outer', name: 'Resgate', type: 'MISSAO', payload: { storyChoice: 'ACCEPT' } };
  const inner = { id: 'inner', name: 'Investigar', type: 'MISSAO', payload: { storyChoice: 'ACCEPT' } };
  const map = JSON.parse(JSON.stringify({ nodes: [], secretReturnNodeId: 'inner', parentMap: {
    nodes: [inner], secretReturnNodeId: 'outer', parentMap: { nodes: [outer] } } }));
  assert.deepEqual(api.activeStoryMissions(map), ['Resgate', 'Investigar']);
  const record = { nodeId: 'outer', name: 'Resgate', type: 'MISSAO_ACEITA', choice: 'Aceitar', items: [], conditions: [], currency: -5, xp: 0, life: 0, mana: 0, stamina: 0 };
  const markup = props => renderToStaticMarkup(React.createElement(api.RunStoryJournal, props));
  assert.match(markup({ records: [record] }), /em andamento/);
  assert.match(markup({ records: [record], ended: true }), /não concluída/);
  assert.doesNotMatch(markup({ records: [record, { ...record, type: 'MISSAO_CONCLUIDA' }] }), /em andamento/);
  assert.equal(markup({ records: [] }), '');
});

test('mapa oferece alternativa textual operável e mantém surpresa oculta até a revelação persistida', () => {
  const nodes = [{ id: 'start', type: 'INICIO', name: 'Início', state: 'CONCLUIDO', fase: 1, layer: 0, position: 0, connections: ['mystery'] },
    { id: 'mystery', type: 'SURPRESA', name: 'Sinal desconhecido', state: 'DISPONIVEL', fase: 1, layer: 1, position: 0, connections: [],
      payload: { surpriseOptions: [{ type: 'COMBATE', label: 'Segredo oculto' }] } }];
  const calls = []; let view;
  const props = { map: { schemaVersion: 5, nodes }, config: {}, neon: true, active: true, acting: false, onSelect: id => calls.push(id) };
  act(() => { view = create(React.createElement(api.RunMapCanvas, props)); });
  assert.doesNotMatch(text(view.toJSON()), /Segredo oculto/);
  assert.match(text(view.toJSON()), /Rotas em texto/);
  act(() => view.root.findByType('button').props.onClick()); assert.deepEqual(calls, ['mystery']);
  act(() => view.update(React.createElement(api.RunMapCanvas, { ...props, acting: true })));
  assert.equal(view.root.findByType('button').props.disabled, true);
  act(() => view.unmount());
});

test('editores usam componentes centrais, opções publicadas e ajuda concisa, sem regras por texto livre', () => {
  const editor = readFileSync('src/routes/Management/ManagementGame/ManagementGameStoryEditor.tsx', 'utf8');
  const effects = readFileSync('src/routes/Management/ManagementGame/ManagementGameStoryEffects.tsx', 'utf8');
  assert.match(editor, /<Modal/); assert.match(editor, /<ManagementGameNpcServices/);
  assert.match(editor, /<ImageUploader/); assert.ok(editor.includes('aspectRatio: 1'));
  assert.match(effects, /<Search/); assert.match(effects, /<HelpHeading/);
  assert.match(effects, /durationUnit/); assert.match(effects, /'Turno'/); assert.match(effects, /'Hora'/);
});
