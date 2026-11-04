import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
import React, { useState } from 'react';
import { act, create } from 'react-test-renderer';
import { renderToStaticMarkup } from 'react-dom/server';

const bundle = await build({
  stdin: { contents: `export * from './src/routes/Game/GameRunShell/RunLoadout';
    export * from './src/routes/Game/GameRunShell/RunInventory';
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
    builder.onResolve({ filter: /\/RunConditionOriginEditor$/ }, args => ({ path: args.path.split('/').at(-1), namespace: 'noop' }));
    builder.onLoad({ filter: /.*/, namespace: 'noop' }, args => ({ contents: `export const ${args.path}=()=>null;` }));
    builder.onResolve({ filter: /\/RunResourceBar\/RunResourceBar$/ }, () => ({ path: 'bar', namespace: 'bar' }));
    builder.onLoad({ filter: /.*/, namespace: 'bar' }, () => ({ contents: 'export const RunResourceBar=()=>null;' }));
    builder.onResolve({ filter: /\/(GameRunShell.style|RunInventoryActionDialog)$/ }, args => ({ path: args.path.split('/').at(-1), namespace: 'surface' }));
    builder.onLoad({ filter: /.*/, namespace: 'surface' }, args => ({ contents: args.path === 'RunInventoryActionDialog'
      ? `import {createElement} from 'react';export const RunInventoryActionDialog=({children})=>createElement('aside',null,children);`
      : `import {createElement} from 'react';const Surface=({children})=>createElement('section',null,children);export const RunOverlayDialog=Surface,RunPanel=Surface;` }));
    builder.onResolve({ filter: /^@dnd-kit\/core$/ }, () => ({ path: 'dnd', namespace: 'dnd' }));
    builder.onLoad({ filter: /.*/, namespace: 'dnd' }, () => ({ contents: `import {createElement} from 'react';
      export const DndContext=({children,onDragEnd})=>createElement('drag-context',{onDragEnd},children);
      export const PointerSensor={},KeyboardSensor={},closestCenter=()=>{},useSensor=()=>({}),useSensors=()=>[];` }));
    builder.onResolve({ filter: /^@dnd-kit\/sortable$/ }, () => ({ path: 'sortable', namespace: 'sortable' }));
    builder.onLoad({ filter: /.*/, namespace: 'sortable' }, () => ({ contents: `import {createElement} from 'react';
      export const SortableContext=({children})=>createElement('div',null,children);
      export const useSortable=()=>({attributes:{},listeners:{},setNodeRef(){},setActivatorNodeRef(){}});
      export const verticalListSortingStrategy={},sortableKeyboardCoordinates=()=>{},arrayMove=(a,from,to)=>{const next=[...a];next.splice(to,0,...next.splice(from,1));return next;};` }));
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

const applyEquipment = (run, actions, defenseIds) => ({ ...run, acoesEquipadas: actions, revisao: (run.revisao ?? 0) + 1,
  estadoAtual: { ...run.estadoAtual, ...Object.fromEntries(['inventario','implantes'].map(property => [property,
    (run.estadoAtual[property] ?? []).map(item => ({ ...item, atributos: { ...item.atributos,
      __vistaExplodida: { ...item.atributos?.__vistaExplodida, equippedSlot: defenseIds.includes(item.id) ? 'run-defense' : null } } }))])) } });

async function mountInventory(initialRun, { Component = api.RunLoadout, save = async () => true, ...extra } = {}) {
  let renderer, persisted = initialRun;
  function Inventory() {
    const [run, setRun] = useState(initialRun);
    return React.createElement(Component, { run, theme:'dark', neon:'off', saving:false, busy:false,
      onClose(){}, onUseItem:async()=>null, onDropItem:async()=>false, onConfigureCondition:async()=>false, usingItemId:null,
      ...extra, onSave:async(...args)=>{
        if (!await save(...args)) return false;
        persisted = Component === api.RunInventory ? { ...run, ordemArmas:args[0] } : applyEquipment(run, ...args);
        setRun(persisted); return true;
      } });
  }
  await act(async()=>{renderer=create(React.createElement(Inventory));});
  return { renderer, persisted:()=>persisted };
}

test('clique recusa traje incompatível sem persistir, mas salva óculos e prótese imediatamente', async () => {
  const requests=[],calls=[]; let renderer;
  globalThis.__outfitCatalogRequest = async id => {requests.push(id);return outfitCatalog();};
  const run = {status:'Ativa',noAtualId:null,idSistemaVersao:42,acoesEquipadas:[],configuracaoModo:{},
    estadoAtual:{status:{status:{estamina:100,mana:100}},inventario:[
      {id:'colete',nome:'Colete',tipo:'traje',atributos:{tipoTraje:'colete',protecaoBase:100,__vistaExplodida:{equippedSlot:'run-defense'}}},
      {id:'traje',nome:'Traje completo',tipo:'traje',atributos:{tipoTraje:'traje',protecaoBase:200}},
      {id:'oculos',nome:'Óculos',tipo:'traje',atributos:{tipoTraje:'outros'}},
    ],implantes:[{id:'pulmao',nome:'Pulmão',tipo:'implante',atributos:{bonus:{resistencia:3}}}]}};
  try {
    ({renderer}=await mountInventory(run,{save:async(...args)=>{calls.push(args);return true;}}));
    assert.deepEqual(requests,[42]);
    act(()=>renderer.root.findByProps({title:'Traje completo'}).props.onClick());
    await act(async()=>button(renderer,'Equipar defesa').props.onClick());
    assert.match(text(renderer.toJSON()),/Traje completo e Colete não podem ser usados juntos/);
    assert.equal(button(renderer,'Salvar equipamento'),undefined,'recusa não cria alteração pendente');
    act(()=>renderer.root.findByProps({title:'Óculos'}).props.onClick());
    assert.equal(button(renderer,'Equipar defesa').props.disabled,false);
    await act(async()=>button(renderer,'Equipar defesa').props.onClick());
    assert.deepEqual(calls[0][1],['colete','oculos']);
    act(()=>renderer.root.findAllByProps({role:'tab'}).find(node=>text(node)==='Próteses').props.onClick());
    act(()=>renderer.root.findByProps({title:'Pulmão'}).props.onClick());
    await act(async()=>button(renderer,'Instalar prótese').props.onClick());
    assert.deepEqual(calls[1][1],['colete','oculos','pulmao']);
    assert.equal(button(renderer,'Salvar equipamento'),undefined);
  } finally {if(renderer)act(()=>renderer.unmount());delete globalThis.__outfitCatalogRequest;}
});

test('falha ao carregar regras não libera traje e recarregar consulta novamente a mesma versão', async () => {
  let calls=0,saves=0,renderer;
  globalThis.__outfitCatalogRequest = async id => {assert.equal(id,42);if(++calls===1)throw Error('offline');return outfitCatalog();};
  const run={status:'Ativa',noAtualId:null,idSistemaVersao:42,acoesEquipadas:[],configuracaoModo:{},
    estadoAtual:{status:{status:{estamina:100,mana:100}},inventario:[{id:'colete',nome:'Colete',tipo:'traje',atributos:{tipoTraje:'colete',protecaoBase:100}}]}};
  try {
    ({renderer}=await mountInventory(run,{save:async()=>{saves++;return true;}}));
    act(()=>renderer.root.findByProps({title:'Colete'}).props.onClick());
    await act(async()=>button(renderer,'Equipar defesa').props.onClick());
    assert.match(text(renderer.toJSON()),/Não foi possível carregar as regras/);
    assert.equal(button(renderer,'Salvar equipamento'),undefined);
    await act(async()=>renderer.root.findAllByType('button').find(node=>text(node).includes('Recarregar regras')).props.onClick());
    assert.equal(calls,2);
    await act(async()=>button(renderer,'Equipar defesa').props.onClick());
    assert.equal(saves,1);
    assert.equal(button(renderer,'Salvar equipamento'),undefined);
  } finally {if(renderer)act(()=>renderer.unmount());delete globalThis.__outfitCatalogRequest;}
});

test('arma e traje persistem a cada ação; consumível e fechamento ficam livres sem confirmação', async () => {
  const calls = [];
  let renderer;
  const run = { status: 'Ativa', noAtualId: null, idSistemaVersao: 7, acoesEquipadas: [], configuracaoModo: {},
    estadoAtual: { status: { status: { estamina: 100, mana: 100, vida:50, vidaMaxima:100 } }, inventario: [
      { id: 'espada', nome: 'Espada', tipo: 'arma', atributos: { tipoArma: 'espada', danoBase: 20 } },
      { id: 'colete', nome: 'Colete', tipo: 'traje', atributos: { protecaoBase: 100 } },
      { id: 'seringa', nome: 'Seringa', tipo: 'consumiveis', quantidade:2, atributos: {recuperacaoVida:20} },
    ] } };
  let uses=0;
  const mounted=await mountInventory(run,{save:async(...args)=>{calls.push(args);return true;},onUseItem:async()=>{uses++;return null;}});
  renderer=mounted.renderer;
  act(() => renderer.root.findByProps({ title: 'Espada' }).props.onClick());
  await act(async () => button(renderer, 'Equipar').props.onClick());
  assert.equal(calls.length,1);
  assert.equal(mounted.persisted().acoesEquipadas[0].idInstancia,'espada');
  act(() => renderer.root.findByProps({ title: 'Colete' }).props.onClick());
  assert.equal(button(renderer, 'Equipar defesa').props.disabled, false);
  await act(async () => button(renderer, 'Equipar defesa').props.onClick());
  assert.equal(calls.length, 2);
  assert.equal(calls[1][0][0].idInstancia, 'espada'); assert.deepEqual(calls[1][1], ['colete']);
  assert.equal(button(renderer,'Desfazer'),undefined);
  assert.equal(button(renderer, 'Salvar equipamento'), undefined);
  act(()=>renderer.root.findByProps({title:'Seringa'}).props.onClick());
  assert.equal(button(renderer,'Usar item').props.disabled,false);
  await act(async()=>button(renderer,'Usar item').props.onClick());
  assert.equal(uses,1);
  assert.equal(renderer.root.findByProps({'aria-label':'Fechar inventário'}).props.disabled,false);
  act(() => renderer.unmount());
});

test('prótese passiva e de combate salvam instalação e retirada com ação e bônus atômicos', async () => {
  const calls = [];
  let renderer;
  const run = { status: 'Ativa', noAtualId: null, idSistemaVersao: 7, acoesEquipadas: [], configuracaoModo: {},
    estadoAtual: { status: { status: { estamina: 100, mana: 100 } }, inventario: [], implantes: [
      { id: 'olho', nome: 'Olho biônico', tipo: 'implante', atributos: { bonus: { precisao: 2 } } },
      { id: 'braco', nome: 'Braço armado', tipo: 'implante', atributos: { bonus: { resistencia: 1 }, danoBase: 50,
        tipoArma: 'arma_branca_comum', teste: { codigoTeste: 'ATAQUE_COMUM' } } },
    ] } };
  ({renderer}=await mountInventory(run,{save:async(...args)=>{calls.push(args);return true;}}));
  act(() => renderer.root.findAllByProps({ role: 'tab' }).find(node => text(node) === 'Próteses').props.onClick());
  act(() => renderer.root.findByProps({ title: 'Olho biônico' }).props.onClick());
  assert.equal(button(renderer, 'Equipar'), undefined);
  await act(async () => button(renderer, 'Instalar prótese').props.onClick());
  assert.deepEqual(calls[0],[[],['olho']]);
  act(() => renderer.root.findByProps({ title: 'Braço armado' }).props.onClick());
  assert.ok(button(renderer, 'Equipar')); assert.equal(button(renderer, 'Equipar defesa'), undefined);
  await act(async () => button(renderer, 'Equipar').props.onClick());
  assert.equal(calls[1][0].length, 1); assert.equal(calls[1][0][0].tipo, 'PROTESE');
  assert.deepEqual([...calls[1][1]].sort(), ['braco', 'olho']);
  await act(async () => renderer.root.findByProps({ 'aria-label': 'Retirar Braço armado' }).props.onClick());
  assert.deepEqual(calls[2][0], []); assert.deepEqual(calls[2][1], ['olho']);
  act(() => renderer.unmount());
});

const weaponRun = () => ({ status:'Ativa', noAtualId:null, idSistemaVersao:7, acoesEquipadas:[], ordemArmas:['a','b'], configuracaoModo:{},
  estadoAtual:{status:{status:{vida:20,vidaMaxima:100,estamina:100,mana:100}},inventario:[
    {id:'a',nome:'Arma A',tipo:'arma',atributos:{danoBase:20,tipoArma:'espada'}},
    {id:'b',nome:'Arma B',tipo:'arma',atributos:{danoBase:10,tipoArma:'espada'}},
    {id:'cura',nome:'Cura',tipo:'consumiveis',quantidade:2,atributos:{recuperacaoVida:20}},
  ]} });

test('equipamento em gravação bloqueia requisição duplicada; falha mantém estado salvo e libera consumível', async () => {
  let finish; const calls=[];
  const {renderer,persisted}=await mountInventory(weaponRun(),{save:(...args)=>{calls.push(args);return new Promise(resolve=>finish=resolve);}});
  try {
    act(()=>renderer.root.findByProps({title:'Arma A'}).props.onClick());
    const equip=button(renderer,'Equipar');
    act(()=>{equip.props.onClick();equip.props.onClick();});
    assert.equal(calls.length,1);
    assert.deepEqual(persisted().acoesEquipadas,[]);
    assert.equal(renderer.root.findByProps({'aria-label':'Fechar inventário'}).props.disabled,true);
    await act(async()=>finish(false));
    assert.deepEqual(persisted().acoesEquipadas,[]);
    assert.equal(renderer.root.findByProps({title:'Arma A'}).props['data-action-equipped'],undefined);
    assert.match(text(renderer.toJSON()),/Não foi possível atualizar o inventário/);
    assert.equal(renderer.root.findByProps({'aria-label':'Fechar inventário'}).props.disabled,false);
    act(()=>renderer.root.findByProps({title:'Cura'}).props.onClick());
    assert.equal(button(renderer,'Usar item').props.disabled,false);
    act(()=>renderer.root.findByProps({title:'Arma A'}).props.onClick());
    act(()=>button(renderer,'Equipar').props.onClick());
    await act(async()=>finish(true));
    assert.equal(calls.length,2);
    assert.equal(persisted().acoesEquipadas[0].idInstancia,'a');
  } finally { act(()=>renderer.unmount()); }
});

test('reordenação, descanso, alcance e quantidade salvam sem botão e sobrevivem à reabertura', async () => {
  const initial=weaponRun(), original=structuredClone(initial), calls=[];
  const mounted=await mountInventory(initial,{save:async(...args)=>{calls.push(args);return true;}});
  const {renderer}=mounted;
  try {
    for(const name of ['Arma A','Arma B']) {
      act(()=>renderer.root.findByProps({title:name}).props.onClick());
      await act(async()=>button(renderer,'Equipar').props.onClick());
    }
    const drag=renderer.root.findByType('drag-context');
    await act(async()=>drag.props.onDragEnd({active:{id:'ITEM:a'},over:{id:'ITEM:b'}}));
    assert.deepEqual(mounted.persisted().acoesEquipadas.map(action=>action.idInstancia),['b','a']);
    await act(async()=>button(renderer,'Adicionar descanso').props.onClick());
    assert.equal(mounted.persisted().acoesEquipadas.at(-1).tipo,'DESCANSO');
    act(()=>renderer.root.findByProps({title:'Arma A'}).props.onClick());
    await act(async()=>renderer.root.findByType('select').props.onChange({target:{value:'LONGA'}}));
    const countBefore=calls.length;
    act(()=>renderer.root.findByProps({type:'number',min:1}).props.onChange({target:{value:'2'}}));
    assert.equal(calls.length,countBefore,'digitar não interrompe a edição do número');
    await act(async()=>renderer.root.findByProps({type:'number',min:1}).props.onBlur());
    const action=mounted.persisted().acoesEquipadas.find(action=>action.idInstancia==='a');
    assert.equal(action.alcance,'LONGA'); assert.equal(action.quantidadeAtaques,2);
    assert.equal(button(renderer,'Salvar equipamento'),undefined);
    assert.deepEqual(initial,original,'não altera os objetos da ficha/estado recebidos');
    const saved=mounted.persisted();
    act(()=>renderer.unmount());
    const reopened=await mountInventory(saved);
    assert.deepEqual(reopened.persisted().acoesEquipadas,saved.acoesEquipadas);
    assert.equal(button(reopened.renderer,'Adicionar descanso'),undefined);
    act(()=>reopened.renderer.unmount());
  } finally { if(renderer.toJSON())act(()=>renderer.unmount()); }
});

test('falha tardia de configuração não sobrescreve quantidade e alcance de outro item aberto', async () => {
  const initial={...weaponRun(),acoesEquipadas:[
    {tipo:'ITEM',idInstancia:'a',quantidadeAtaques:3,alcance:'CURTA'},
    {tipo:'ITEM',idInstancia:'b',quantidadeAtaques:2,alcance:'MEDIA'},
  ]};
  let finish;
  const {renderer,persisted}=await mountInventory(initial,{save:()=>new Promise(resolve=>finish=resolve)});
  try {
    act(()=>renderer.root.findByProps({title:'Arma A'}).props.onClick());
    act(()=>renderer.root.findByType('select').props.onChange({target:{value:'LONGA'}}));
    act(()=>renderer.root.findByProps({title:'Arma B'}).props.onClick());
    assert.equal(renderer.root.findByProps({type:'number',min:1}).props.value,2);
    await act(async()=>finish(false));
    assert.equal(renderer.root.findByProps({type:'number',min:1}).props.value,2);
    assert.equal(renderer.root.findByType('select').props.value,'MEDIA');
    assert.deepEqual(persisted().acoesEquipadas,initial.acoesEquipadas);
  } finally {act(()=>renderer.unmount());}
});

test('inventário legado salva ordem ao arrastar, sem bloquear consumo após a gravação', async () => {
  const initial={...weaponRun(),acoesEquipadas:null}, calls=[];
  const {renderer,persisted}=await mountInventory(initial,{Component:api.RunInventory,save:async(...args)=>{calls.push(args);return true;}});
  try {
    await act(async()=>renderer.root.findByType('drag-context').props.onDragEnd({active:{id:'a'},over:{id:'b'}}));
    assert.deepEqual(calls,[[['b','a']]]);
    assert.deepEqual(persisted().ordemArmas,['b','a']);
    assert.equal(button(renderer,'Salvar ordem'),undefined);
    assert.equal(button(renderer,'Desfazer'),undefined);
    act(()=>renderer.root.findByProps({title:'Cura'}).props.onClick());
    assert.equal(button(renderer,'Usar item').props.disabled,false);
    assert.equal(renderer.root.findByProps({'aria-label':'Fechar inventário'}).props.disabled,false);
  } finally { act(()=>renderer.unmount()); }
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
