import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { renderToStaticMarkup } from 'react-dom/server';

const bundle = await build({
  stdin: { contents: `export * from './src/routes/Game/GameRunShell/RunLoadout';
    export * from './src/routes/Game/RunMapCanvas/RunMapCanvas';
    export * from './src/routes/Game/GameRunShell/RunHudDisclosure';
    export * from './src/routes/Management/ManagementGame/ManagementGame.style';
    export * from './src/components/Generic/FieldHelp/FieldHelp.style';
    export {ServerStyleSheet} from 'styled-components';`, loader: 'tsx', resolveDir: process.cwd() },
  bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic', mainFields: ['module', 'main'],
  loader: { '.svg': 'text' }, external: ['react', 'react/jsx-runtime'],
  banner: { js: `import {createRequire} from 'node:module'; const require=createRequire(${JSON.stringify(import.meta.url)});` },
  plugins: [{ name: 'equipment-ui', setup(builder) {
    builder.onResolve({ filter: /^@mui\/icons-material\// }, () => ({ path: 'icon', namespace: 'icon' }));
    builder.onLoad({ filter: /.*/, namespace: 'icon' }, () => ({ contents: `import {createElement} from 'react'; export default p=>createElement('svg',p);` }));
    builder.onResolve({ filter: /\/services\/sistemasRpgService$/ }, () => ({ path: 'rules', namespace: 'rules' }));
    builder.onLoad({ filter: /.*/, namespace: 'rules' }, () => ({ contents: 'export const obterConfiguracaoCombateSistemaRpg=async()=>({resultadosDado:[],estaminaPorAtaqueAdicional:0}); export const obterCatalogoItensSistemaRpg=async(...args)=>globalThis.__outfitCatalogRequest ? globalThis.__outfitCatalogRequest(...args) : ({tipos:[]});' }));
    builder.onResolve({ filter: /\/(RunConditionOriginEditor|RunConsumableAction)$/ }, args => ({ path: args.path.split('/').at(-1), namespace: 'noop' }));
    builder.onLoad({ filter: /.*/, namespace: 'noop' }, args => ({ contents: `export const ${args.path}=()=>null;` }));
    builder.onResolve({ filter: /\/RunResourceBar\/RunResourceBar$/ }, () => ({ path: 'bar', namespace: 'bar' }));
    builder.onLoad({ filter: /.*/, namespace: 'bar' }, () => ({ contents: 'export const RunResourceBar=()=>null;' }));
    builder.onResolve({ filter: /\/(GameRunShell.style|RunInventoryActionDialog)$/ }, args => ({ path: args.path.split('/').at(-1), namespace: 'surface' }));
    builder.onLoad({ filter: /.*/, namespace: 'surface' }, args => ({ contents: args.path === 'RunInventoryActionDialog'
      ? `import {createElement} from 'react';export const RunInventoryActionDialog=({children})=>createElement('aside',null,children);`
      : `import {createElement} from 'react';const Surface=({children})=>createElement('section',null,children);export const RunOverlayDialog=Surface,RunPanel=Surface;` }));
    builder.onResolve({ filter: /^@dnd-kit\/core$/ }, () => ({ path: 'dnd', namespace: 'dnd' }));
    builder.onLoad({ filter: /.*/, namespace: 'dnd' }, () => ({ contents: `import {createElement} from 'react';
      export const DndContext=({children})=>createElement('div',null,children);
      export const PointerSensor={},KeyboardSensor={},closestCenter=()=>{},useSensor=()=>({}),useSensors=()=>[];` }));
    builder.onResolve({ filter: /^@dnd-kit\/sortable$/ }, () => ({ path: 'sortable', namespace: 'sortable' }));
    builder.onLoad({ filter: /.*/, namespace: 'sortable' }, () => ({ contents: `import {createElement} from 'react';
      export const SortableContext=({children})=>createElement('div',null,children);
      export const useSortable=()=>({attributes:{},listeners:{},setNodeRef(){},setActivatorNodeRef(){}});
      export const verticalListSortingStrategy={},sortableKeyboardCoordinates=()=>{},arrayMove=a=>a;` }));
  } }],
});
const source = bundle.outputFiles[0].text.replace(/((?:from|import)\s*)(["'])(react(?:\/jsx-runtime)?)\2/g,
  (_, prefix, _quote, name) => prefix + JSON.stringify(import.meta.resolve(name)));
const api = await import(`data:text/javascript;base64,${Buffer.from(source + '\n//# sourceURL=run-equipment-ux.test-bundle.js').toString('base64')}`)
  .catch(error => { throw new Error(error.message.replace(/data:text\/javascript;base64,[A-Za-z0-9+/=]+/g, '[test bundle]')); });
const text = node => typeof node === 'string' ? node : (node?.children ?? []).map(text).join('');
const button = (renderer, label) => renderer.root.findAllByType('button').find(node => text(node) === label);

const outfitCatalog = () => ({ tipos: [{ codigo:'TRAJE', ativo:true, filhos:[{codigo:'PROTECOES',ativo:true,filhos:[
  {codigo:'COLETE',ativo:true,arquetiposCompativeis:['TRAJE/PROTECOES/OUTROS']},
  {codigo:'TRAJE',ativo:true,arquetiposCompativeis:[]},
  {codigo:'OUTROS',ativo:true,arquetiposCompativeis:['TRAJE/PROTECOES/COLETE']},
]}] }] });

test('clique recusa traje incompatível sem alterar rascunho, mas aceita óculos sem defesa e prótese', async () => {
  const requests=[],calls=[]; let renderer;
  globalThis.__outfitCatalogRequest = async id => {requests.push(id);return outfitCatalog();};
  const run = {status:'Ativa',noAtualId:null,idSistemaVersao:42,acoesEquipadas:[],configuracaoModo:{},
    estadoAtual:{status:{status:{estamina:100,mana:100}},inventario:[
      {id:'colete',nome:'Colete',tipo:'traje',atributos:{tipoTraje:'colete',protecaoBase:100,__vistaExplodida:{equippedSlot:'run-defense'}}},
      {id:'traje',nome:'Traje completo',tipo:'traje',atributos:{tipoTraje:'traje',protecaoBase:200}},
      {id:'oculos',nome:'Óculos',tipo:'traje',atributos:{tipoTraje:'outros'}},
    ],implantes:[{id:'pulmao',nome:'Pulmão',tipo:'implante',atributos:{bonus:{resistencia:3}}}]}};
  try {
    await act(async()=>{renderer=create(React.createElement(api.RunLoadout,{run,theme:'dark',neon:'on',saving:false,busy:false,
      onSave:async(...args)=>{calls.push(args);return false;},onClose(){},onUseItem(){},onDropItem(){},onConfigureCondition(){},usingItemId:null}));});
    assert.deepEqual(requests,[42]);
    act(()=>renderer.root.findByProps({title:'Traje completo'}).props.onClick());
    act(()=>button(renderer,'Equipar defesa').props.onClick());
    assert.match(text(renderer.toJSON()),/Traje completo e Colete não podem ser usados juntos/);
    assert.equal(button(renderer,'Salvar equipamento'),undefined,'recusa não cria alteração pendente');
    act(()=>renderer.root.findByProps({title:'Óculos'}).props.onClick());
    assert.equal(button(renderer,'Equipar defesa').props.disabled,false);
    act(()=>button(renderer,'Equipar defesa').props.onClick());
    act(()=>renderer.root.findAllByProps({role:'tab'}).find(node=>text(node)==='Próteses').props.onClick());
    act(()=>renderer.root.findByProps({title:'Pulmão'}).props.onClick());
    act(()=>button(renderer,'Instalar prótese').props.onClick());
    await act(async()=>button(renderer,'Salvar equipamento').props.onClick());
    assert.deepEqual(calls[0][1],['colete','oculos','pulmao']);
  } finally {if(renderer)act(()=>renderer.unmount());delete globalThis.__outfitCatalogRequest;}
});

test('falha ao carregar regras não libera traje e recarregar consulta novamente a mesma versão', async () => {
  let calls=0,renderer;
  globalThis.__outfitCatalogRequest = async id => {assert.equal(id,42);if(++calls===1)throw Error('offline');return outfitCatalog();};
  const run={status:'Ativa',noAtualId:null,idSistemaVersao:42,acoesEquipadas:[],configuracaoModo:{},
    estadoAtual:{status:{status:{estamina:100,mana:100}},inventario:[{id:'colete',nome:'Colete',tipo:'traje',atributos:{tipoTraje:'colete',protecaoBase:100}}]}};
  try {
    await act(async()=>{renderer=create(React.createElement(api.RunLoadout,{run,theme:'dark',neon:'off',saving:false,busy:false,
      onSave:async()=>false,onClose(){},onUseItem(){},onDropItem(){},onConfigureCondition(){},usingItemId:null}));});
    act(()=>renderer.root.findByProps({title:'Colete'}).props.onClick());
    act(()=>button(renderer,'Equipar defesa').props.onClick());
    assert.match(text(renderer.toJSON()),/Não foi possível carregar as regras/);
    assert.equal(button(renderer,'Salvar equipamento'),undefined);
    await act(async()=>renderer.root.findAllByType('button').find(node=>text(node).includes('Recarregar regras')).props.onClick());
    assert.equal(calls,2);
    act(()=>button(renderer,'Equipar defesa').props.onClick());
    assert.ok(button(renderer,'Salvar equipamento'));
  } finally {if(renderer)act(()=>renderer.unmount());delete globalThis.__outfitCatalogRequest;}
});

test('inventário prepara arma e traje juntos, salva de uma vez e desfaz os dois rascunhos', async () => {
  const calls = [];
  let renderer;
  const run = { status: 'Ativa', noAtualId: null, idSistemaVersao: 7, acoesEquipadas: [], configuracaoModo: {},
    estadoAtual: { status: { status: { estamina: 100, mana: 100 } }, inventario: [
      { id: 'espada', nome: 'Espada', tipo: 'arma', atributos: { tipoArma: 'espada', danoBase: 20 } },
      { id: 'colete', nome: 'Colete', tipo: 'traje', atributos: { protecaoBase: 100 } },
    ] } };
  await act(async () => { renderer = create(React.createElement(api.RunLoadout, { run, theme: 'dark', neon: 'on', saving: false, busy: false,
    onSave: async (...args) => { calls.push(args); return false; }, onClose() {}, onUseItem() {}, onDropItem() {}, onConfigureCondition() {}, usingItemId: null })); });
  act(() => renderer.root.findByProps({ title: 'Espada' }).props.onClick());
  act(() => button(renderer, 'Equipar').props.onClick());
  act(() => renderer.root.findByProps({ title: 'Colete' }).props.onClick());
  assert.equal(button(renderer, 'Equipar defesa').props.disabled, false);
  act(() => button(renderer, 'Equipar defesa').props.onClick());
  assert.equal(calls.length, 0);
  await act(async () => { button(renderer, 'Salvar equipamento').props.onClick(); });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0][0].idInstancia, 'espada'); assert.deepEqual(calls[0][1], ['colete']);
  assert.ok(button(renderer, 'Desfazer'));
  act(() => button(renderer, 'Desfazer').props.onClick());
  assert.equal(button(renderer, 'Salvar equipamento'), undefined);
  act(() => renderer.unmount());
});

test('prótese passiva instala sem ação e prótese de combate equipa ação e bônus no mesmo rascunho', async () => {
  const calls = [];
  let renderer;
  const run = { status: 'Ativa', noAtualId: null, idSistemaVersao: 7, acoesEquipadas: [], configuracaoModo: {},
    estadoAtual: { status: { status: { estamina: 100, mana: 100 } }, inventario: [], implantes: [
      { id: 'olho', nome: 'Olho biônico', tipo: 'implante', atributos: { bonus: { precisao: 2 } } },
      { id: 'braco', nome: 'Braço armado', tipo: 'implante', atributos: { bonus: { resistencia: 1 }, danoBase: 50,
        tipoArma: 'arma_branca_comum', teste: { codigoTeste: 'ATAQUE_COMUM' } } },
    ] } };
  await act(async () => { renderer = create(React.createElement(api.RunLoadout, { run, theme: 'dark', neon: 'on', saving: false, busy: false,
    onSave: async (...args) => { calls.push(args); return false; }, onClose() {}, onUseItem() {}, onDropItem() {}, onConfigureCondition() {}, usingItemId: null })); });
  act(() => renderer.root.findAllByProps({ role: 'tab' }).find(node => text(node) === 'Próteses').props.onClick());
  act(() => renderer.root.findByProps({ title: 'Olho biônico' }).props.onClick());
  assert.equal(button(renderer, 'Equipar'), undefined);
  act(() => button(renderer, 'Instalar prótese').props.onClick());
  act(() => renderer.root.findByProps({ title: 'Braço armado' }).props.onClick());
  assert.ok(button(renderer, 'Equipar')); assert.equal(button(renderer, 'Equipar defesa'), undefined);
  act(() => button(renderer, 'Equipar').props.onClick());
  await act(async () => button(renderer, 'Salvar equipamento').props.onClick());
  assert.equal(calls[0][0].length, 1); assert.equal(calls[0][0][0].tipo, 'PROTESE');
  assert.deepEqual(calls[0][1].sort(), ['braco', 'olho']);
  act(() => renderer.root.findByProps({ 'aria-label': 'Retirar Braço armado' }).props.onClick());
  await act(async () => button(renderer, 'Salvar equipamento').props.onClick());
  assert.deepEqual(calls[1][0], []); assert.deepEqual(calls[1][1], ['olho']);
  act(() => renderer.unmount());
});

test('NPC distante mostra cadeado e legenda no toque/hover sem selecionar a rota', () => {
  let selected = 0, renderer;
  const node = { id: 'npc', name: 'Zoe', type: 'NPC', state: 'BLOQUEADO', revealed: true,
    fase: 1, layer: 2, position: 0, connections: [], seed: 1,
    payload: { npcCode: 'zoe', npcType: 'SABIO', npcLocked: true, npcRescued: false } };
  act(() => { renderer = create(React.createElement(api.RunMapCanvas, { map: { schemaVersion: 5, nodes: [node] },
    config: {}, neon: true, active: true, acting: false, onSelect() { selected++; } })); });
  assert.equal(renderer.root.findByProps({ className: 'npc-lock-icon' }).type, 'path');
  const target = renderer.root.findByProps({ 'data-node-id': 'npc' });
  act(() => target.props.onClick());
  assert.equal(selected, 0); assert.match(text(renderer.root.findByProps({ role: 'tooltip' })), /próximas visitas e runs/);
  act(() => target.props.onBlur());
  assert.equal(renderer.root.findAllByProps({ role: 'tooltip' }).length, 0);
  act(() => target.props.onMouseEnter());
  assert.equal(renderer.root.findAllByProps({ role: 'tooltip' }).length, 1);
  act(() => renderer.unmount());
});

test('header recolhido mantém avatar pequeno junto ao nome e controles de rota não comprimem Único', () => {
  let renderer;
  act(() => { renderer = create(React.createElement(api.RunHudDisclosure, { name: 'Gunthar', image: '/gunthar.png', neon: true }, 'Dados')); });
  act(() => renderer.root.findByType('button').props.onClick());
  assert.equal(renderer.root.findByType('img').props.src, '/gunthar.png');
  assert.match(text(renderer.toJSON()), /Gunthar/);
  const sheet = new api.ServerStyleSheet();
  try {
    renderToStaticMarkup(sheet.collectStyles(React.createElement(api.GameAdminRouteControls, null,
      React.createElement(api.HelpButton, { $dark: true, $neon: false, $inline: true, $small: true }, 'i'))));
    const css = sheet.getStyleTags();
    assert.match(css, /width:20px/); assert.match(css, /max-content/); assert.match(css, /max-width:\s*480px/);
  } finally { sheet.seal(); }
  act(() => renderer.unmount());
});
