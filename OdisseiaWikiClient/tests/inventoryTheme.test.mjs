import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { renderToStaticMarkup } from 'react-dom/server';

const bundle = await build({
  stdin: { contents: `export * from './src/utils/inventoryTheme';
    export * from './src/routes/Game/GameRunShell/RunLoadout';
    export * from './src/routes/Game/GameRunShell/RunInventory';
    export * from './src/routes/Game/GameRunShell/RunInventoryTabs';
    export * from './src/routes/Game/GameRunShell/RunInventoryEmptyState';
    export * from './src/routes/Game/GameRunShell/RunInventoryTheme.style';
    export * from './src/routes/Game/GameRunShell/RunInventoryActionDialog';
    export * from './src/routes/Game/GameRunShell/RunLoadout.style';
    export * from './src/routes/Game/GameRunShell/RunInventory.style';
    export * from './src/routes/Game/GameRunShell/RunInventoryActionDialog.style';
    export {EconomyTabs} from './src/routes/Game/GameRunShell/RunEconomyDialog/RunEconomyDialog.style';
    export * from './src/components/CharacterExplodedView/CharacterExplodedView';
    export {Shell, ShellHudFrame} from './src/components/CharacterExplodedView/CharacterExplodedView.style';
    export {Corner, Frame} from './src/components/Generic/HudFrame/HudFrame.style';
    export {CyberButton} from './src/components/Generic/HighlightButton/HighlightButton';
    export {ServerStyleSheet} from 'styled-components';`, loader: 'tsx', resolveDir: process.cwd() },
  bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic', mainFields: ['module', 'main'],
  loader: { '.svg': 'text', '.mp4': 'text', '.jpeg': 'text' }, external: ['react', 'react/jsx-runtime'],
  banner: { js: `import {createRequire} from 'node:module'; const require=createRequire(${JSON.stringify(import.meta.url)});` },
  plugins: [{ name: 'inventory-surfaces', setup(builder) {
    builder.onResolve({ filter: /^@mui\/icons-material\// }, () => ({ path: 'icon', namespace: 'stub' }));
    builder.onLoad({ filter: /^icon$/, namespace: 'stub' }, () => ({ contents: `import {createElement} from 'react';export default p=>createElement('svg',p);` }));
    builder.onResolve({ filter: /^react-dom$/ }, () => ({ path: 'portal', namespace: 'stub' }));
    builder.onLoad({ filter: /^portal$/, namespace: 'stub' }, () => ({ contents: 'export const createPortal=children=>children;' }));
    builder.onResolve({ filter: /\/GameRunShell.style$/ }, () => ({ path: 'surfaces', namespace: 'stub' }));
    builder.onLoad({ filter: /^surfaces$/, namespace: 'stub' }, () => ({ resolveDir: process.cwd(), contents: `import {createElement} from 'react';
      import {HudFrame} from './src/components/Generic/HudFrame/HudFrame';
      export const RunOverlayDialog=({children,style,className,...p})=>createElement('div',{style,className,'data-dialog':p['aria-labelledby']},children);
      export const RunPanel=p=>createElement(HudFrame,p);
      export const RunFooterActions=({children})=>createElement('footer',null,children);` }));
    builder.onResolve({ filter: /\/services\/sistemasRpgService$/ }, () => ({ path: 'rules', namespace: 'stub' }));
    builder.onLoad({ filter: /^rules$/, namespace: 'stub' }, () => ({ contents: 'export const obterConfiguracaoCombateSistemaRpg=async()=>({resultadosDado:[],estaminaPorAtaqueAdicional:0}); export const obterCatalogoItensSistemaRpg=async()=>({tipos:[]});' }));
    builder.onResolve({ filter: /\/(RunConditionOriginEditor|RunConsumableAction|RunResourceBar|FreeInventoryCanvas|OrganizedInventoryGrid|EquipmentMannequin)$/ }, args => ({ path: args.path.split('/').at(-1), namespace: 'noop' }));
    builder.onLoad({ filter: /.*/, namespace: 'noop' }, args => ({ contents: `export const ${args.path}=()=>null;` }));
    builder.onResolve({ filter: /^@dnd-kit\/core$/ }, () => ({ path: 'dnd', namespace: 'stub' }));
    builder.onLoad({ filter: /^dnd$/, namespace: 'stub' }, () => ({ contents: `import {createElement} from 'react';
      export const DndContext=({children})=>createElement('div',null,children);
      export const PointerSensor={},KeyboardSensor={},closestCenter=()=>{},useSensor=()=>({}),useSensors=()=>[];` }));
    builder.onResolve({ filter: /^@dnd-kit\/sortable$/ }, () => ({ path: 'sortable', namespace: 'stub' }));
    builder.onLoad({ filter: /^sortable$/, namespace: 'stub' }, () => ({ contents: `import {createElement} from 'react';
      export const SortableContext=({children})=>createElement('div',null,children);
      export const useSortable=()=>({attributes:{},listeners:{},setNodeRef(){},setActivatorNodeRef(){}});
      export const verticalListSortingStrategy={},sortableKeyboardCoordinates=()=>{},arrayMove=a=>a;` }));
  } }],
});
const source = bundle.outputFiles[0].text.replace(/((?:from|import)\s*)(["'])(react(?:\/jsx-runtime)?)\2/g,
  (_, prefix, _quote, name) => prefix + JSON.stringify(import.meta.resolve(name)));
const api = await import(`data:text/javascript;base64,${Buffer.from(source + '\n//# sourceURL=inventory-theme.test-bundle.js').toString('base64')}`)
  .catch(error => { throw new Error(error.message.replace(/data:text\/javascript;base64,[A-Za-z0-9+/=]+/g, '[test bundle]')); });

const globals = {};
before(() => {
  for (const name of ['document', 'window', 'requestAnimationFrame']) globals[name] = globalThis[name];
  globalThis.document = { body: { style: {} }, activeElement: null };
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
  globalThis.requestAnimationFrame = callback => { callback(); return 1; };
});
after(() => { for (const [name, previous] of Object.entries(globals)) {
  if (previous === undefined) delete globalThis[name]; else globalThis[name] = previous;
} });
const text = node => typeof node === 'string' ? node : (node?.children ?? []).map(text).join('');
const tab = (renderer, label) => renderer.root.findAllByType('button').find(node => node.props.role === 'tab' && text(node) === label);
const expected = [
  ['Itens', 'ITEM', 'items', 'var(--neonBlue)', 'var(--clearneonBlue)'],
  ['Próteses', 'PROTESE', 'prostheses', 'var(--neonPurple)', 'var(--clearneonPurple)'],
  ['Skills', 'SKILL', 'skills', 'var(--neonCyan)', 'color-mix(in srgb, var(--neonCyan) 45%, white)'],
  ['Magias', 'MAGIA', 'spells', 'var(--neonLilac)', 'var(--clearneonLilac)'],
];
const run = { status: 'Ativa', noAtualId: null, idSistemaVersao: 7, acoesEquipadas: [], configuracaoModo: {}, estadoAtual: {
  status: { status: { estamina: 100, mana: 100 } }, inventario: [], implantes: [], magia: [], skills: [],
} };

for (const inventory of ['RunLoadout', 'RunInventory']) test(`${inventory} muda a paleta inteira sem remontar o modal e mantém neon opcional`, async () => {
  let renderer;
  const props = { run, theme: 'dark', neon: 'on', saving: false, busy: false, usingItemId: null,
    onSave: async () => true, onClose() {}, onUseItem() {}, onDropItem() {}, onEquipDefense() {}, onConfigureCondition() {} };
  try {
    await act(async () => { renderer = create(React.createElement(api[inventory], props)); });
    const dialog = renderer.root.findByType(api.InventoryThemeDialog), panel = renderer.root.findByType(api.InventoryThemePanel);
    for (const neon of ['on', 'off']) {
      act(() => renderer.update(React.createElement(api[inventory], { ...props, neon })));
      for (const [label, kind, , color, clearColor] of expected) {
        act(() => tab(renderer, label).props.onClick());
        assert.equal(renderer.root.findByType(api.InventoryThemeDialog), dialog);
        assert.equal(renderer.root.findByType(api.InventoryThemePanel), panel);
        assert.equal(dialog.props.style['--inventory-accent'], neon === 'on' ? clearColor : color);
        assert.equal(dialog.props.style['--inventory-glow'], neon === 'on' ? clearColor : 'transparent');
        assert.equal(dialog.props.style['--control-primary-neon'], color);
        assert.equal(panel.props.color, 'var(--inventory-accent)');
        assert.equal(panel.props.neon, neon === 'on');
        assert.ok(renderer.root.findAllByType(api.Corner).every(node => node.props.$color === 'var(--inventory-accent)'));
        assert.equal(tab(renderer, label).props['aria-selected'], true);
        assert.equal(tab(renderer, label).props.style['--inventory-tab-accent'], api.inventoryThemeColor(kind, neon === 'on'));
      }
    }
  } finally { if (renderer) act(() => renderer.unmount()); }
});

for (const inventory of ['RunLoadout', 'RunInventory']) test(`${inventory} centraliza estado vazio por aba e mantém cards quando há conteúdo`, async () => {
  let renderer;
  const props = { run, theme: 'dark', neon: 'on', saving: false, busy: false, usingItemId: null,
    onSave: async () => true, onClose() {}, onUseItem() {}, onDropItem() {}, onEquipDefense() {}, onConfigureCondition() {} };
  try {
    await act(async () => { renderer = create(React.createElement(api[inventory], props)); });
    for (const [label, kind, title] of [
      ['Itens', 'ITEM', 'Nenhum item na mochila'], ['Próteses', 'PROTESE', 'Nenhuma prótese no inventário'],
      ['Skills', 'SKILL', 'Nenhuma skill disponível'], ['Magias', 'MAGIA', 'Nenhuma magia disponível'],
    ]) {
      act(() => tab(renderer, label).props.onClick());
      const empty = renderer.root.findByType(api.RunInventoryEmptyState);
      assert.equal(empty.props.kind, kind);
      assert.equal(empty.findByType(api.InventoryEmptyState).props.role, 'status');
      assert.ok(text(empty).includes(title));
      assert.equal(empty.findAllByType('button').length, 0);
      assert.equal(renderer.root.findAllByType(api.LoadoutGrid).length, 0, 'não reserva uma grade vazia antes do aviso');
    }
    const populated = { ...run, estadoAtual: { ...run.estadoAtual, inventario: [
      {id:'espada', nome:'Espada', tipo:'arma', atributos:{danoBase:10}},
      {id:'seringa', nome:'Seringa', tipo:'consumiveis', atributos:{}},
    ] } };
    act(() => tab(renderer, 'Itens').props.onClick());
    await act(async () => renderer.update(React.createElement(api[inventory], {...props, run: populated})));
    assert.equal(renderer.root.findAllByType(api.RunInventoryEmptyState).length, 0);
    act(() => renderer.root.findAllByType('button').find(node => text(node) === 'Consumíveis').props.onClick());
    const remaining = {...populated, estadoAtual:{...populated.estadoAtual, inventario:populated.estadoAtual.inventario.slice(0,1)}};
    await act(async () => renderer.update(React.createElement(api[inventory], {...props, run: remaining})));
    const filtered = renderer.root.findByType(api.RunInventoryEmptyState);
    assert.ok(text(filtered).includes('Nenhum resultado neste filtro'));
    act(() => filtered.findByType('button').props.onClick());
    assert.equal(renderer.root.findAllByType(api.RunInventoryEmptyState).length, 0);
    assert.equal(renderer.root.findAllByType(api.LoadoutGrid).length, 1);
  } finally { if (renderer) act(() => renderer.unmount()); }
});

test('estado vazio ocupa a área disponível e centraliza ícone e textos sem posicionamento absoluto', () => {
  const sheet = new api.ServerStyleSheet();
  try {
    renderToStaticMarkup(sheet.collectStyles(React.createElement(api.RunInventoryEmptyState, {
      kind:'MAGIA', onClearFilter() {},
    })));
    const css = sheet.getStyleTags();
    assert.match(css, /width:100%;min-width:0;min-height:180px;display:flex;flex-direction:column;align-items:center;justify-content:center/);
    assert.match(css, /text-align:center/);
    assert.match(css, /@media \(max-width:\s*700px\)/);
    assert.match(css, /var\(--inventory-accent/);
    assert.match(css, /var\(--inventory-glow, transparent\)/);
    assert.doesNotMatch(css, /position:absolute/);
  } finally { sheet.seal(); }
});

test('vista explodida usa a mesma paleta no contorno, cabeçalho e detalhes, com magias em lilás próprio', () => {
  let renderer;
  const props = { open: true, onClose() {}, theme: 'dark', neon: 'on', character: { name: 'Teste' },
    items: [], skills: [], spells: [], setItems() {}, setSkills() {}, setSpells() {} };
  try {
    act(() => { renderer = create(React.createElement(api.CharacterExplodedView, props)); });
    for (const neon of ['on', 'off']) {
      act(() => renderer.update(React.createElement(api.CharacterExplodedView, { ...props, neon })));
      for (const [label, , category, color, clearColor] of expected) {
        act(() => tab(renderer, label).props.onClick());
        assert.equal(renderer.root.findByType(api.Shell).props.$accent, neon === 'on' ? clearColor : color);
        assert.equal(renderer.root.findByType(api.Shell).props.$clearAccent, clearColor);
        assert.equal(renderer.root.findByType(api.ShellHudFrame).props.color, neon === 'on' ? clearColor : color);
        assert.deepEqual(api.INVENTORY_CATEGORY_THEME[category], { color, clearColor });
      }
    }
    assert.notEqual(api.INVENTORY_CATEGORY_THEME.spells.color, api.INVENTORY_CATEGORY_THEME.prostheses.color);
    assert.notEqual(api.INVENTORY_CATEGORY_THEME.skills.clearColor, api.INVENTORY_CATEGORY_THEME.items.clearColor);
  } finally { if (renderer) act(() => renderer.unmount()); }
});

test('opções abertas em portal carregam a paleta do conteúdo, não dependem da herança do inventário', () => {
  for (const neon of [true, false]) for (const [, kind, , color, clearColor] of expected) {
    let renderer;
    try {
      act(() => { renderer = create(React.createElement(api.RunInventoryActionDialog, {
        entry: { tipo: kind, name: 'Conteúdo', weight: null, value: null }, neon, onClose() {},
      }, React.createElement('p', null, 'Detalhes'))); });
      const root = renderer.root.findByProps({ 'data-dialog': 'run-inventory-action-title' });
      assert.equal(root.props.style['--inventory-accent'], neon ? clearColor : color);
      assert.equal(renderer.root.findByType(api.ActionDialogFrame).props.color, 'var(--inventory-accent)');
      assert.equal(renderer.root.findByType(api.ActionDialogFrame).props.neon, neon);
    } finally { if (renderer) act(() => renderer.unmount()); }
  }
});

test('abas de loja e oficina têm hover e foco sem deslocamento nem interação visual em disabled', () => {
  const sheet = new api.ServerStyleSheet();
  try {
    renderToStaticMarkup(sheet.collectStyles(React.createElement('div', null, ...[true, false].map(neon =>
      React.createElement(api.EconomyTabs, { key: String(neon), $neon: neon },
        React.createElement('button', null, 'Ofertas'), React.createElement('button', { disabled: true }, 'Vender'))))));
    const css = sheet.getStyleTags();
    assert.match(css, /button:hover:not\(:disabled\)/);
    assert.match(css, /button:focus-visible/);
    assert.match(css, /transition:color 180ms ease,border-color 180ms ease,background 180ms ease,box-shadow 180ms ease/);
    assert.match(css, /border-color:var\(--inventory-tab-accent/);
    assert.match(css, /button:disabled\{opacity:\.45;cursor:not-allowed/);
    assert.match(css, /--inventory-glow:var\(--clearneonBlue\)/);
    assert.match(css, /--inventory-glow:transparent/);
    assert.match(css, /data-motion='reduced'[^}]*button\{transition:none/);
    assert.doesNotMatch(css, /translate|scale\(/);
  } finally { sheet.seal(); }
});

test('bordas, títulos, cards e scroll usam o acento local e botões secundários mantêm a semântica', () => {
  const sheet = new api.ServerStyleSheet();
  try {
    renderToStaticMarkup(sheet.collectStyles(React.createElement(api.InventoryThemePanel, { neon: true, color: 'var(--inventory-accent)' },
      React.createElement(api.LoadoutSectionTitle, null, 'Título'), React.createElement(api.LoadoutGrid, null,
        React.createElement(api.LoadoutCard, { $neon: true }, React.createElement(api.LoadoutCardCorner, { $neon: true, $position: 'top-right' }))),
      React.createElement(api.ActionDialogHeader, null, React.createElement('h3', null, 'Detalhes')),
      React.createElement(api.InventoryTypeFilters), React.createElement(api.CyberButton, { neon: 'on', theme: 'dark', text: 'Equipar' }),
      React.createElement(api.CyberButton, { neon: 'on', theme: 'dark', colorType: 'secondary', text: 'Cancelar' }))));
    const css = sheet.getStyleTags();
    assert.match(css, /background:var\(--inventory-accent/);
    assert.match(css, /scrollbar-color:color-mix\(in srgb, var\(--inventory-accent/);
    assert.match(css, /h3\{margin:0;color:var\(--inventory-accent/);
    assert.match(css, /--cyber-button-edge-start:var\(--control-primary-neon, var\(--neonBlue\)\)/);
    assert.match(css, /--cyber-button-edge-start:var\(--neonPink\)/);
    assert.doesNotMatch(css, /--neonBlue:/, 'não redefine o tema global nem as cores dos recursos');
    const globals = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
    assert.match(globals, /--neonLilac:\s*#bf8af5/); assert.match(globals, /--clearneonLilac:\s*#e0b3ff/);
  } finally { sheet.seal(); }
});
