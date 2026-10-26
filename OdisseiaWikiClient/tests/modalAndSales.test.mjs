import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { act, create } from 'react-test-renderer';

const bundle = await build({
  stdin: { contents: `export * from './src/components/Generic/Modal/Modal';
    export * from './src/components/Generic/Modal/Modal.style';
    export * from './src/components/Gameplay/GameplayActionCenter.style';
    export * from './src/routes/Game/GameRunShell/RunEconomyDialog/RunEconomyDialog';
    export * from './src/routes/Game/GameRunShell/RunNpcServiceDialog';
    export * from './src/routes/Wiki/components/blocks/shared/Lightbox/Lightbox';
    export * from './src/routes/Wiki/components/blocks/shared/Lightbox/Lightbox.style';
    export * from './src/routes/Game/GameRunShell/RunEconomyDialog/RunEconomyDialog.style';
    export * from './src/routes/Game/GameRunShell/RunEconomyDialog/RunProtectedDeposit';
    export * from './src/routes/Game/GameRunShell/RunRewards.style';
    export {RunLootModal} from './src/routes/Game/GameRunShell/RunLootModal';
    export {LoadoutCard, LoadoutCardMedia} from './src/routes/Game/GameRunShell/RunLoadout.style';
    export {InputText} from './src/components/Generic/InputText/InputText';
    export {ServerStyleSheet} from 'styled-components';`, loader: 'ts', resolveDir: process.cwd() },
  plugins: [{ name: 'dialog-surfaces', setup(builder) {
    builder.onResolve({ filter: /\/DiceRollOverlay\/DiceRollOverlay$/ }, () => ({ path: 'dice', namespace: 'test-dice' }));
    builder.onLoad({ filter: /.*/, namespace: 'test-dice' }, () => ({ loader: 'js',
      contents: 'export const DiceRollOverlay=()=>null;' }));
    builder.onResolve({ filter: /\/services\/gameRunService$/ }, () => ({ path: 'service', namespace: 'test-service' }));
    builder.onLoad({ filter: /.*/, namespace: 'test-service' }, () => ({ loader: 'js',
      contents: 'export const getGameRun=async()=>{throw new Error("Unexpected request")}; export const rollGameRunLoot=getGameRun; export const getGameRunProtectedDeposit=(...args)=>globalThis.__protectedDepositRequest(...args);' }));
    builder.onResolve({ filter: /^@mui\/icons-material\// }, () => ({ path: 'icon', namespace: 'test-icon' }));
    builder.onLoad({ filter: /.*/, namespace: 'test-icon' }, () => ({ loader: 'js',
      contents: `import {createElement} from 'react'; export default function Icon(){return createElement('svg',{'aria-hidden':true});}` }));
    builder.onResolve({ filter: /^react-dom$/ }, () => ({ path: 'portal', namespace: 'test-portal' }));
    builder.onLoad({ filter: /.*/, namespace: 'test-portal' }, () => ({ loader: 'js',
      contents: 'export const createPortal=(children)=>children; export default {createPortal};' }));
    builder.onResolve({ filter: /\/GameRunShell.style$/ }, () => ({ path: 'shell', namespace: 'test-shell' }));
    builder.onLoad({ filter: /.*/, namespace: 'test-shell' }, () => ({ loader: 'js',
      contents: `import {createElement} from 'react';
        export const RunTrainingDialog=({children})=>createElement('section',null,children);
        export const RunTrainingPanel=({children})=>createElement('div',null,children);
        export const RunHudTopline=({children})=>createElement('header',null,children);` }));
    builder.onResolve({ filter: /\/RunInventoryActionDialog$/ }, () => ({ path: 'action', namespace: 'test-action' }));
    builder.onLoad({ filter: /.*/, namespace: 'test-action' }, () => ({ loader: 'js',
      contents: `import {createElement} from 'react'; export const RunInventoryActionDialog=({children,aboveModal})=>createElement('aside',{'data-item-dialog':true,'data-above-modal':aboveModal},children);` }));
    builder.onResolve({ filter: /\/RunResourceBar\/RunResourceBar$/ }, () => ({ path: 'bar', namespace: 'test-bar' }));
    builder.onLoad({ filter: /.*/, namespace: 'test-bar' }, () => ({ loader: 'js',
      contents: `import {createElement} from 'react'; export const RunResourceBar=props=>createElement('test-bar',props);` }));
  } }],
  bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic', mainFields: ['module', 'main'],
  loader: { '.svg': 'text' }, external: ['react', 'react/jsx-runtime'],
  banner: { js: `import {createRequire} from 'node:module'; const require=createRequire(${JSON.stringify(import.meta.url)});` },
});
const source = bundle.outputFiles[0].text.replace(/((?:from|import)\s*)(["'])(react(?:\/jsx-runtime)?)\2/g,
  (_, prefix, _quote, name) => prefix + JSON.stringify(import.meta.resolve(name)));
const api = await import(`data:text/javascript;base64,${Buffer.from(source + '\n//# sourceURL=modal-and-sales.test-bundle.js').toString('base64')}`)
  .catch(error => { throw new Error(error.message.replace(/data:text\/javascript;base64,[A-Za-z0-9+/=]+/g, '[test bundle]')); });
const oldWindow = globalThis.window, oldDocument = globalThis.document;
const listeners = new Map();
before(() => {
  globalThis.document = { getElementById: () => ({}), addEventListener() {}, removeEventListener() {} };
  globalThis.window = { addEventListener(type, fn) { const set = listeners.get(type) ?? new Set(); set.add(fn); listeners.set(type, set); },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); } };
});
after(() => {
  if (oldWindow === undefined) delete globalThis.window; else globalThis.window = oldWindow;
  if (oldDocument === undefined) delete globalThis.document; else globalThis.document = oldDocument;
});
const text = node => typeof node === 'string' ? node : (node.children ?? []).map(text).join('');
const button = (renderer, label) => renderer.root.findAllByType('button').find(node => text(node) === label);

test('Sábio apresenta ofertas fixadas, ensina pelo ID e respeita estoque e saldo', async () => {
  const calls = [];
  let renderer;
  const run = { noAtualId: 'sabio', estadoAtual: { economy: { balance: 100 } }, mapa: { nodes: [{ id: 'sabio', name: 'Oráculo',
    payload: { npcType: 'SABIO', offers: [{ itemId: 'pulso', price: 20, stock: 1, snapshot: {
      nome: 'Pulso', tipo: 'ataque', atributos: { dano: 50, teste: { codigoTeste: 'ATAQUE_COMUM' } } } }] } }] } };
  act(() => { renderer = create(React.createElement(api.RunNpcServiceDialog, { run, theme: 'dark', neon: 'on', busy: false, error: null,
    onBuy: async (...args) => { calls.push(args); return true; }, onUpgrade() { throw new Error('Wrong service'); }, onClose() {} })); });
  act(() => renderer.root.findByProps({ title: 'Pulso' }).props.onClick());
  assert.equal(button(renderer, 'Aprender').props.disabled, false);
  await act(async () => { await button(renderer, 'Aprender').props.onClick(); });
  assert.deepEqual(calls, [['pulso', false]]);
  assert.match(text(renderer.toJSON()), /Magia aprendida/);
  act(() => renderer.unmount());
});

test('Engenheiro mostra prévia por instância e envia melhoria sem preço no comando', async () => {
  const calls = [];
  let renderer;
  const run = { noAtualId: 'eng', estadoAtual: { economy: { balance: 100 }, inventario: [{ id: 'espada', nome: 'Espada',
    tipo: 'arma', __runEngineerUpgrades: 1, atributos: { danoBase: 20, modificadores: { dano: 7 } } }] },
    mapa: { nodes: [{ id: 'eng', name: 'Oficina', payload: { npcType: 'ENGENHEIRO', upgrade: { damage: 7, price: 10, maxUpgrades: 2 }, offers: [] } }] } };
  const props = { run, theme: 'dark', neon: 'off', busy: false, error: null,
    onUpgrade: async (...args) => { calls.push(args); return true; }, onBuy() {}, onClose() {} };
  act(() => { renderer = create(React.createElement(api.RunNpcServiceDialog, props)); });
  act(() => renderer.root.findByProps({ title: 'Espada' }).props.onClick());
  assert.match(text(renderer.toJSON()), /27 → 34/);
  await act(async () => { await button(renderer, 'Melhorar').props.onClick(); });
  assert.deepEqual(calls, [['espada']]);
  run.estadoAtual.inventario[0].__runEngineerUpgrades = 2;
  act(() => renderer.update(React.createElement(api.RunNpcServiceDialog, { ...props, run: { ...run } })));
  act(() => renderer.root.findByProps({ title: 'Espada' }).props.onClick());
  assert.equal(button(renderer, 'Melhorar').props.disabled, true);
  act(() => renderer.unmount());
});

test('retrato compartilhado mantém círculo, nome, fundo preto e Escape fecha só a imagem', () => {
  const original = globalThis.document;
  const handlers = [];
  globalThis.document = { body: { style: { overflow: 'auto' } },
    addEventListener: (...args) => handlers.push(args), removeEventListener() {} };
  let renderer, closed = 0, stopped = 0;
  const props = { isOpen: true, variant: 'portrait', images: [{ url: '/ada.png', caption: 'Ada', backgroundUrl: '/ada.png' }],
    onClose: () => { closed++; } };
  try {
    act(() => { renderer = create(React.createElement(api.Lightbox, props)); });
    assert.equal(globalThis.document.body.style.overflow, 'hidden');
    assert.equal(renderer.root.findByType('img').props.src, '/ada.png');
    assert.equal(renderer.root.findByProps({ role: 'dialog' }).props['aria-label'], 'Ada');
    const key = handlers.find(([name]) => name === 'keydown');
    assert.equal(key[2], true);
    act(() => key[1]({ key: 'Escape', preventDefault() {}, stopImmediatePropagation() { stopped++; } }));
    assert.equal(closed, 1); assert.equal(stopped, 1);
    const sheet = new api.ServerStyleSheet();
    try {
      renderToStaticMarkup(sheet.collectStyles(React.createElement(api.LightboxContent, { $portrait: true },
        React.createElement(api.LightboxImage, { $portrait: true, src: '/ada.png' }),
        React.createElement(api.LightboxCaption, { $portrait: true }, 'Ada'))));
      const css = sheet.getStyleTags();
      assert.match(css, /border-radius:50%/); assert.match(css, /DO Futuristic/); assert.match(css, /background:#000/);
    } finally { sheet.seal(); }
    act(() => renderer.unmount());
    assert.equal(globalThis.document.body.style.overflow, 'auto');
  } finally { globalThis.document = original; }
});

test('depósito protegido consulta memória, informa perda da garantia e envia IDs reais', async () => {
  const run = { idGameRun: 7, revisao: 2, status: 'Ativa', noAtualId: null,
    mapa: { nodes: [{ id: 'base', type: 'BASE', state: 'CONCLUIDO', layer: 1 }] } };
  const calls = [];
  globalThis.__protectedDepositRequest = async (id, signal) => {
    calls.push([id, signal]);
    return { slots: 2, cost: 10, items: [{ itemId: 'colete', systemVersionId: 7, compatible: true,
      snapshot: { id: 'colete', nome: 'Colete', tipo: 'traje', quantidade: 1, atributos: { protecaoBase: 300, __runDefenseRemaining: { protecao: 20, escudo: 0 } } } }] };
  };
  let renderer;
  const changes = [];
  await act(async () => { renderer = create(React.createElement(api.RunProtectedDeposit, { run, theme: 'dark', neon: 'on', busy: false,
    onProtect: async (...args) => { changes.push(args); return true; } })); });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 7);
  assert.ok(renderer.root.findAllByType('p').some(node => text(node).includes('Levar devolve à mochila e remove a proteção')));
  act(() => renderer.root.findAllByType('button').find(node => node.props.title === 'Colete').props.onClick());
  assert.ok(renderer.root.findAllByType('p').some(node => text(node).includes('Proteção 20 / 300')));
  assert.equal(button(renderer, 'Levar').props.disabled, false);
  await act(async () => button(renderer, 'Levar').props.onClick());
  await act(async () => button(renderer, 'Liberar').props.onClick());
  assert.deepEqual(changes, [['colete', 'TAKE'], ['colete', 'RELEASE']]);
  act(() => renderer.unmount());
  assert.equal(calls[0][1].aborted, true);
  delete globalThis.__protectedDepositRequest;
});

test('item protegido incompatível aparece preservado sem permitir retirada nem liberação', async () => {
  globalThis.__protectedDepositRequest = async () => ({ slots: 0, cost: 0, items: [
    { itemId: 'a', compatible: false, systemVersionId: 1, snapshot: { id: 'a', nome: 'Espada', tipo: 'arma', quantidade: 1 } }] });
  let renderer;
  await act(async () => { renderer = create(React.createElement(api.RunProtectedDeposit, {
    run: { idGameRun: 1, revisao: 0, status: 'Vitoria', noAtualId: null,
      mapa: { nodes: [{ id: 'base', type: 'BASE', state: 'CONCLUIDO', layer: 1 }] } },
    theme: 'dark', neon: 'off', busy: false, onProtect() { throw new Error('Incompatível'); },
  })); });
  assert.equal(button(renderer, 'Levar').props.disabled, true);
  assert.equal(button(renderer, 'Liberar').props.disabled, true);
  assert.ok(renderer.root.findAllByType('small').some(node => text(node).includes('Preservado em outra versão do Sistema')));
  act(() => renderer.unmount()); delete globalThis.__protectedDepositRequest;
});

test('modal mantém conteúdo, footer, ações, portal e fechamento; subtítulo é opcional', () => {
  let close = 0, submit = 0, extra = 0, focused = 0;
  const props = { title: 'Editar item', subtitle: 'Somente a cópia', theme: 'dark', neon: 'on', width: '800px',
    onClose: () => close++, onSubmit: () => submit++,
    headerActions: React.createElement('button', { onClick: () => extra++ }, 'Extra'),
    children: React.createElement('input', { defaultValue: 'Não alterar' }) };
  let renderer;
  act(() => { renderer = create(React.createElement(api.Modal, props), { createNodeMock: element =>
    element.type === 'button' ? { focus() { focused++; } } : null }); });
  assert.equal(renderer.root.findByType('input').props.defaultValue, 'Não alterar');
  assert.equal(renderer.root.findByType(api.ModalContainer).props.$width, '800px');
  assert.equal(renderer.root.findByType(api.ModalContainer).props.neon, true);
  assert.ok(renderer.root.findAllByType('p').some(node => text(node) === 'Somente a cópia'));
  assert.ok(focused > 0);
  act(() => button(renderer, 'Enviar').props.onClick());
  act(() => button(renderer, 'Extra').props.onClick());
  assert.equal(submit, 1); assert.equal(extra, 1); assert.equal(close, 0);
  const overlay = renderer.root.findByType(api.ModalOverlay);
  act(() => overlay.props.onClick({ target: {}, currentTarget: {} }));
  assert.equal(close, 0);
  act(() => renderer.root.findByProps({ 'aria-label': 'Fechar modal' }).props.onClick());
  act(() => button(renderer, 'Cancelar').props.onClick());
  const target = {};
  act(() => overlay.props.onClick({ target, currentTarget: target }));
  act(() => { for (const listener of listeners.get('keydown')) listener({ key: 'Escape' }); });
  assert.equal(close, 4);
  act(() => renderer.update(React.createElement(api.Modal, { ...props, subtitle: undefined, showFooter: false,
    onClose: () => close += 10 })));
  assert.equal(renderer.root.findAllByType(api.ModalFooterContainer).length, 0);
  assert.equal(renderer.root.findAllByType('p').length, 0);
  act(() => renderer.root.findByProps({ 'aria-label': 'Fechar modal' }).props.onClick());
  assert.equal(close, 14, 'usa o callback atual');
  act(() => renderer.update(React.createElement(api.Modal, { ...props,
    footer: React.createElement('button', { type: 'button' }, 'Rodapé próprio') })));
  assert.ok(button(renderer, 'Rodapé próprio'));
  assert.equal(button(renderer, 'Enviar'), undefined);
  act(() => renderer.unmount());
  assert.equal(listeners.get('keydown').size, 0);
});

test('modal padrão reutiliza a mesma superfície, SVG, neon, cabeçalho, X e scroll da Central', () => {
  const standard = readFileSync('src/components/Generic/Modal/Modal.style.tsx', 'utf8');
  const gameplay = readFileSync('src/components/Gameplay/GameplayActionCenter.style.ts', 'utf8');
  for (const shared of ['hudModalSurface', 'hudModalHeader', 'hudModalCloseButton', 'hudModalScrollbar']) {
    assert.ok(standard.includes(shared)); assert.ok(gameplay.includes(shared));
  }
  assert.match(standard, /ModalContainer = styled\(HudFrame\)/);
  const sheet = new api.ServerStyleSheet();
  try {
    const markup = renderToStaticMarkup(sheet.collectStyles(React.createElement(React.Fragment, null,
      ...[false, true].map(neon => React.createElement(api.ModalContainer, { key: String(neon), neon, $width: '800px' },
        React.createElement(api.ModalHeaderContainer, { theme: 'dark', neon: neon ? 'on' : 'off' },
          React.createElement('div', { className: 'modal-title' }, 'Editar item'),
          React.createElement('button', { className: 'modal-close' }, 'X')),
        React.createElement(api.ModalContentContainer, null, 'Conteúdo'))))));
    const css = sheet.getStyleTags();
    assert.equal((markup.match(/aria-hidden="true"/g) ?? []).length, 16, 'mesmos quatro cantos SVG e quatro linhas');
    assert.match(css, /mask:url/);
    assert.match(css, /rgba\(4, 22, 42, 0.99\)/);
    assert.match(css, /DO Futuristic/);
    assert.match(css, /width:44px/);
    assert.match(css, /scrollbar-color:var\(--clearneonBlue\)/);
    assert.match(css, /:root\[data-motion='reduced'\]/);
    assert.match(css, /height:100dvh/);
    assert.match(css, /z-index:10/);
  } finally { sheet.seal(); }
});

const syringe = (id, quantidade) => ({ id, nome: 'Seringa', tipo: 'consumiveis', idItemBase: 'cura',
  valor: 100, quantidade, atributos: { restaura: { vida: 100 } } });
const run = { status: 'Ativa', noAtualId: 'loja', configuracaoModo: { saleDiscountPercent: 50 },
  mapa: { nodes: [{ id: 'loja', type: 'VENDEDOR', name: 'Mercador', state: 'SELECIONADO' }] },
  estadoAtual: { inventario: [syringe('a', 2), syringe('b', 3)], economy: { balance: 10, stash: [syringe('c', 2)] } } };

test('loot preenche colunas iguais sem depender da imagem, texto ou etapa da animação', () => {
  const sheet = new api.ServerStyleSheet();
  try {
    renderToStaticMarkup(sheet.collectStyles(React.createElement(api.LootGrid, null,
      React.createElement('article', { style: { animationDelay: '130ms' } },
        React.createElement(api.LoadoutCard, { $neon: true },
          React.createElement(api.LoadoutCardMedia, null,
            React.createElement('img', { src: '/item.png', alt: '' })))))));
    const css = sheet.getStyleTags();
    assert.match(css, /grid-template-columns:repeat\(auto-fill,\s*minmax\(125px,\s*1fr\)\)/);
    assert.match(css, />article\{display:grid;grid-template-columns:minmax\(0,\s*1fr\);align-content:start;min-width:0;animation:/);
    assert.match(css, />article\s*>button\{width:100%;min-width:0;box-sizing:border-box/);
    assert.match(css, /\.5s ease-out both/);
    assert.match(css, /to\{opacity:1;transform:none;filter:brightness\(1\)/);
    assert.match(css, /:root\[data-motion='reduced'\]/);
  } finally { sheet.seal(); }
});

test('selecionar loot mantém os cards e seus atrasos de entrada, com e sem imagem', () => {
  const rewards = [
    { id: 'espada', nome: 'Espada', tipo: 'arma', imagem: '/espada.png', peso: 2 },
    { id: 'aquila', nome: 'Aquila com nome maior', tipo: 'arma', imagem: '/aquila.png', peso: 3 },
    { id: 'cura', nome: 'Seringa de cura', tipo: 'consumiveis', peso: 1 },
  ];
  let closed = 0, renderer;
  const props = { run: { ...run, revisao: 1, estadoAtual: { ...run.estadoAtual,
    loot: { faces: 4, roll: 2, rewards } } }, speed: 1, theme: 'dark', neon: 'on',
    onUpdate() { throw new Error('Loot já revelado não deve sortear novamente'); }, onClose() { closed++; } };
  act(() => { renderer = create(React.createElement(api.RunLootModal, props)); });
  const cards = renderer.root.findAllByType(api.LoadoutCard);
  const articles = renderer.root.findByType(api.LootGrid).findAllByType('article');
  assert.equal(cards.length, 3);
  assert.deepEqual(articles.map(node => node.props.style.animationDelay), ['0ms', '130ms', '260ms']);
  assert.equal(renderer.root.findAllByType('img').length, 2);
  act(() => cards[1].props.onClick());
  assert.equal(renderer.root.findAllByType(api.LoadoutCard)[1].props['aria-pressed'], true);
  assert.ok(text(renderer.toJSON()).includes('3 kg · Adicionado ao inventário da run'));
  assert.deepEqual(renderer.root.findByType(api.LootGrid).findAllByType('article'), articles);
  assert.deepEqual(renderer.root.findAllByType(api.LoadoutCard), cards);
  act(() => renderer.update(React.createElement(api.RunLootModal, { ...props, neon: 'off' })));
  assert.deepEqual(renderer.root.findByType(api.LootGrid).findAllByType('article'), articles);
  act(() => button(renderer, 'Continuar').props.onClick());
  assert.equal(closed, 1);
  act(() => renderer.unmount());
});

test('loot permite usar consumível e equipar traje pela mesma instância da mochila, inclusive na vitória final', async () => {
  const armor = { id: 'colete', nome: 'Colete', tipo: 'traje', atributos: { protecaoBase: 300 } };
  const potion = syringe('cura', 1);
  let current = { ...run, status: 'Vitoria', noAtualId: null, estadoAtual: { ...run.estadoAtual,
    status: { status: { vida: 10, vidaMaxima: 200, mana: 10, manaMaxima: 100, estamina: 10, estaminaMaxima: 100 } },
    inventario: [potion, armor], loot: { faces: 4, roll: 2, rewards: [potion, armor] } } };
  let renderer, finish;
  const uses = [], equipment = [];
  const props = { run: current, speed: 1, theme: 'dark', neon: 'on', onUpdate() {}, onClose() {},
    onUseItem: async (id, quantity) => { uses.push([id, quantity]); await new Promise(resolve => { finish = resolve; });
      current = { ...current, revisao: 1, estadoAtual: { ...current.estadoAtual,
        inventario: [armor], status: { status: { ...current.estadoAtual.status.status, vida: 110 } } } };
      renderer.update(React.createElement(api.RunLootModal, { ...props, run: current }));
      return { nomeItem: 'Seringa', quantidadeRestante: 0, vidaRecuperada: 100, manaRecuperada: 0, estaminaRecuperada: 0 };
    },
    onEquipDefense: async (id, equipped) => { equipment.push([id, equipped]);
      current = { ...current, revisao: 2, estadoAtual: { ...current.estadoAtual,
        inventario: [{ ...armor, atributos: { ...armor.atributos, __vistaExplodida: { equippedSlot: 'peito' } } }] } };
      renderer.update(React.createElement(api.RunLootModal, { ...props, run: current }));
      return true;
    } };
  act(() => { renderer = create(React.createElement(api.RunLootModal, props)); });
  act(() => renderer.root.findAllByType(api.LoadoutCard)[0].props.onClick());
  assert.equal(renderer.root.findByType('aside').props['data-above-modal'], true);
  assert.equal(button(renderer, 'Usar item').props.disabled, false);
  const useButton = button(renderer, 'Usar item');
  act(() => { useButton.props.onClick(); useButton.props.onClick(); });
  assert.equal(uses.length, 1, 'não consome duas vezes com cliques rápidos');
  assert.equal(button(renderer, 'Continuar').props.disabled, true);
  await act(async () => { finish(); });
  assert.deepEqual(uses, [['cura', 1]]);
  assert.equal(current.estadoAtual.inventario.length, 1);
  assert.ok(text(renderer.toJSON()).includes('Usado ou movido'));
  assert.equal(renderer.root.findAllByType('aside').length, 0);
  act(() => renderer.root.findAllByType(api.LoadoutCard)[1].props.onClick());
  assert.equal(button(renderer, 'Equipar defesa').props.disabled, false);
  await act(async () => { await button(renderer, 'Equipar defesa').props.onClick(); });
  assert.deepEqual(equipment, [['colete', true]]);
  assert.equal(renderer.root.findAllByType(api.LoadoutCard)[1].props['data-action-equipped'], 'true');
  assert.equal(renderer.root.findAllByType('aside').length, 0);
  act(() => renderer.unmount());
});

test('loja mantém scroll sem ancoragem automática e imagens não redimensionam os cards', () => {
  const sheet = new api.ServerStyleSheet();
  try {
    renderToStaticMarkup(sheet.collectStyles(React.createElement(api.EconomyBody, null,
      React.createElement(api.EconomyCards, null, ...[false, true].map(neon =>
        React.createElement(api.EconomyCard, { key: String(neon) },
          React.createElement(api.LoadoutCard, { $neon: neon },
            React.createElement(api.LoadoutCardMedia, null,
              React.createElement('img', { src: '/item.png', loading: 'lazy', alt: '' })))))))));
    const css = sheet.getStyleTags();
    assert.match(css, /overflow-y:auto;overflow-anchor:none;scrollbar-gutter:stable;overscroll-behavior-y:contain/);
    assert.match(css, /aspect-ratio:1/);
    assert.match(css, /img\{position:absolute;inset:0;width:100%;height:100%;object-fit:cover/);
    assert.match(css, /transform:scale\(1\.06\)/, 'zoom de hover preservado');
    assert.match(css, /drop-shadow\(0 0 6px/, 'neon de hover preservado');
  } finally { sheet.seal(); }
});

test('loja não remonta a área rolável ao atualizar saldo ou abrir a prévia', () => {
  const props = { run, vendor: true, busy: false, error: null, theme: 'dark', neon: 'on',
    onBuy: async () => true, onTransfer: async () => true, onSell: async () => true, onClose() {} };
  let renderer;
  act(() => { renderer = create(React.createElement(api.RunEconomyDialog, props)); });
  act(() => button(renderer, 'Vender').props.onClick());
  const scroller = renderer.root.findByType(api.EconomyBody).findByType('div');
  const grid = renderer.root.findByType(api.EconomyCards).findByType('div');
  act(() => renderer.update(React.createElement(api.RunEconomyDialog, { ...props, busy: true,
    run: { ...run, estadoAtual: { ...run.estadoAtual, economy: { ...run.estadoAtual.economy, balance: 300 } } } })));
  assert.equal(renderer.root.findByType(api.EconomyBody).findByType('div'), scroller);
  assert.equal(renderer.root.findByType(api.EconomyCards).findByType('div'), grid);
  act(() => renderer.update(React.createElement(api.RunEconomyDialog, props)));
  act(() => renderer.root.findAllByType('button').find(node => node.props['data-entry-id'] === 'ITEM:a').props.onClick());
  assert.equal(renderer.root.findByType(api.EconomyBody).findByType('div'), scroller);
  assert.equal(renderer.root.findByType(api.EconomyCards).findByType('div'), grid);
  act(() => button(renderer, 'Cancelar').props.onClick());
  assert.equal(renderer.root.findByType(api.EconomyBody).findByType('div'), scroller);
  act(() => renderer.unmount());
});

test('mercador permite vender várias unidades do stack com prévia e envia instâncias, não preços', async () => {
  const sales = [];
  let renderer;
  act(() => { renderer = create(React.createElement(api.RunEconomyDialog, { run, vendor: true, busy: false,
    error: null, theme: 'dark', neon: 'on', onBuy: async () => true, onTransfer: async () => true,
    onClose() {}, onSell: async (...args) => { sales.push(args); return true; } })); });
  act(() => button(renderer, 'Vender').props.onClick());
  const itemCard = renderer.root.findAllByType('button').find(node => node.props['data-entry-id'] === 'ITEM:a');
  act(() => itemCard.props.onClick());
  const quantity = renderer.root.findByType(api.InputText);
  assert.equal(quantity.props.max, 5);
  act(() => quantity.props.onChange({ target: { value: '6' } }));
  assert.ok(text(renderer.toJSON()).includes('Escolha de 1 a 5 unidades.'));
  assert.equal(renderer.root.findByType('aside').findAllByType('button').find(node => text(node) === 'Vender').props.disabled, true);
  act(() => quantity.props.onChange({ target: { value: '4' } }));
  assert.ok(text(renderer.toJSON()).includes('Você recebe 200 moedas'));
  await act(async () => { await renderer.root.findByType('aside').findAllByType('button')
    .find(node => text(node) === 'Vender').props.onClick(); });
  assert.deepEqual(sales, [[[{ itemId: 'b', quantity: 3 }, { itemId: 'a', quantity: 1 }], false]]);
  assert.equal(renderer.root.findAllByType('aside').length, 0);
  assert.equal(button(renderer, 'Depósito').props.disabled, false);
  act(() => button(renderer, 'Depósito').props.onClick());
  assert.equal(renderer.root.findAllByType('button').some(node => node.props['data-entry-id'] === 'ITEM:c'), true);
  assert.equal(button(renderer, 'Depósito').props['aria-pressed'], true);
  act(() => renderer.unmount());
});

test('depósito permite compra e transferências no mercador sem usar o nome antigo', async () => {
  const buys = [], transfers = [];
  const shopRun = { ...run, mapa: { nodes: [{ ...run.mapa.nodes[0], payload: { offers: [
    { itemId: 'cura', price: 5, stock: 2, snapshot: syringe('oferta', 1) },
  ] } }] } };
  let renderer;
  act(() => { renderer = create(React.createElement(api.RunEconomyDialog, {
    run: shopRun, vendor: true, busy: false, error: null, theme: 'dark', neon: 'on',
    onBuy: async (...args) => { buys.push(args); return true; },
    onTransfer: async (...args) => { transfers.push(args); return true; },
    onSell: async () => true, onClose() {},
  })); });
  assert.equal(button(renderer, 'Depósito · 1').props.disabled, false);
  act(() => button(renderer, 'Depósito · 1').props.onClick());
  assert.equal(renderer.root.findByProps({ role: 'tabpanel' }).props['aria-label'], 'Depósito');
  assert.ok(text(renderer.toJSON()).includes('Acesso somente na Base ou no Mercador.'));
  assert.doesNotMatch(text(renderer.toJSON()), /[Ss]tash/);
  assert.equal(button(renderer, 'Levar').props.disabled, false);
  await act(async () => { await button(renderer, 'Levar').props.onClick(); });
  assert.deepEqual(transfers, [['c', false]]);
  act(() => button(renderer, 'Ofertas · 1').props.onClick());
  act(() => renderer.root.findAllByType('button').find(node => node.props['data-entry-id'] === 'ITEM:cura').props.onClick());
  assert.equal(button(renderer, 'Ao depósito').props.disabled, false);
  await act(async () => { await button(renderer, 'Ao depósito').props.onClick(); });
  assert.deepEqual(buys, [['cura', true]]);
  act(() => button(renderer, 'Mochila · 2').props.onClick());
  const store = renderer.root.findAllByType('button').filter(node => text(node) === 'Guardar');
  assert.equal(store.length, 2);
  assert.ok(store.every(node => !node.props.disabled));
  act(() => store[0].props.onClick());
  assert.deepEqual(transfers, [['c', false], ['a', true]]);
  act(() => renderer.unmount());
});
