import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import React from 'react';
import { act, create } from 'react-test-renderer';

const bundle = await build({
  stdin: { contents: `export * from './src/routes/Game/GameRunShell/useRunInventoryAutoSave';
    export * from './src/routes/Game/GameRunShell/useRunMissionScroll';
    export * from './src/routes/Game/GameRunShell/RunConditionOriginEditor';
    export { ConditionOriginFields } from './src/routes/Game/GameRunShell/RunLoadout.style';`,
    loader: 'ts', resolveDir: process.cwd() },
  bundle: true, write: false, format: 'cjs', platform: 'node', jsx: 'automatic', mainFields: ['module','main'],
  external: ['react','react/jsx-runtime'], loader: { '.svg':'text' },
  plugins: [{ name:'inventory-auto-save', setup(builder) {
    builder.onResolve({ filter:/^@mui\/icons-material\// },()=>({path:'icon',namespace:'mock'}));
    builder.onLoad({ filter:/^icon$/, namespace:'mock' },()=>({contents:`import React from 'react';export default props=>React.createElement('svg',props);`}));
    builder.onResolve({ filter:/\/services\/sistemasRpgService$/ },()=>({path:'system',namespace:'mock'}));
    builder.onLoad({ filter:/^system$/, namespace:'mock' },()=>({contents:`
      export const obterConfiguracaoSobrevivenciaSistemaRpg=async()=>({condicoes:[]});
      export const obterConfiguracaoCriacaoSistemaRpg=async()=>({atributos:[{codigo:'RESISTENCIA',nome:'Resistência',ativo:true}]});`}));
  } }],
});
const module = {exports:{}};
new Function('require','module','exports',bundle.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
const api=module.exports;
const previousWindow=globalThis.window;
let view;
afterEach(()=>{if(view)act(()=>view.unmount());view=null;
  if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;});
const text=node=>typeof node==='string'?node:(node?.children??[]).map(text).join('');

test('salvamento imediato evita corrida, libera após exceção e nunca grava só por montar ou atualizar props',async()=>{
  let current, finish;const calls=[];
  const onSave=(value)=>{calls.push(value);return new Promise((resolve,reject)=>{finish={resolve,reject};});};
  function Inventory({enabled=true}){current=api.useRunInventoryAutoSave(enabled,onSave);return null;}
  act(()=>{view=create(React.createElement(Inventory));});assert.deepEqual(calls,[]);
  let first,second;
  act(()=>{first=current.save('equipar');second=current.save('equipar');});
  assert.equal(await second,false);assert.deepEqual(calls,['equipar']);assert.equal(current.pending,true);
  await act(async()=>{finish.reject(Error('offline'));assert.equal(await first,false);});
  assert.equal(current.pending,false);assert.match(current.error,/Não foi possível/);
  await act(async()=>view.update(React.createElement(Inventory,{enabled:false})));
  assert.equal(await current.save('bloqueado'),false);assert.deepEqual(calls,['equipar']);
  act(()=>view.update(React.createElement(Inventory)));
  act(()=>{first=current.save('tentar novamente');});
  await act(async()=>{finish.resolve(true);assert.equal(await first,true);});
  assert.equal(current.pending,false);assert.equal(current.error,null);
  assert.deepEqual(calls,['equipar','tentar novamente']);
});

test('missão volta ao topo só ao entrar na área, não a cada revisão ou retorno do combate',()=>{
  const scroll=[],cleared=[];globalThis.window={scrollTo:options=>scroll.push(options)};
  const onEnter=()=>cleared.push(true);
  function Map({run}){api.useRunMissionScroll(run,onEnter);return null;}
  const root={idGameRun:1,mapa:{nodes:[]}};
  act(()=>{view=create(React.createElement(Map,{run:root}));});assert.equal(scroll.length,0);
  const portal={id:'resgate',type:'MISSAO',payload:{storyChoice:'ACCEPT'}};
  const mission={...root,mapa:{nodes:[],secretReturnNodeId:'resgate',parentMap:{nodes:[portal]}}};
  act(()=>view.update(React.createElement(Map,{run:mission})));
  assert.deepEqual(scroll,[{top:0,behavior:'instant'}]);assert.equal(cleared.length,1);
  act(()=>view.update(React.createElement(Map,{run:{...mission,revisao:2,mapa:structuredClone(mission.mapa)}})));
  assert.equal(scroll.length,1,'alteração de inventário/combatente não força scroll');
  const nested={...mission,mapa:{nodes:[],secretReturnNodeId:'sub',parentMap:{...mission.mapa,nodes:[{id:'sub',type:'MISSAO'}]}}};
  act(()=>view.update(React.createElement(Map,{run:nested})));assert.equal(scroll.length,2);
  act(()=>view.update(React.createElement(Map,{run:mission})));assert.equal(scroll.length,3);
  act(()=>view.update(React.createElement(Map,{run:root})));
  act(()=>view.update(React.createElement(Map,{run:{...root,mapa:{nodes:[],secretReturnNodeId:'secreto',parentNodes:[{id:'secreto',type:'AREA_SECRETA'}]}}})));
  assert.equal(scroll.length,3);
  act(()=>view.update(React.createElement(Map,{run:{...root,mapa:{nodes:[],secretReturnNodeId:'resgate',parentNodes:[portal]}}})));
  assert.equal(scroll.length,4,'mapa legado usa a mesma regra');
});

const conditionProps={entry:{tipo:'ITEM',idInstancia:'espada',subtype:'arma'},condition:{index:0,codigo:'SANGRAMENTO',name:'Sangramento',gatilho:'ACERTO'},
  systemVersionId:42,disabled:false,busy:false,theme:'dark',neon:'off'};
async function mountCondition(onSave){await act(async()=>{view=create(React.createElement(api.RunConditionOriginEditor,{...conditionProps,onSave}));});
  act(()=>view.root.findAllByType('button').find(node=>text(node).includes('Configurar')).props.onClick());}
const blur=async()=>act(async()=>view.root.findAllByType(api.ConditionOriginFields)[0].props.onBlur());

test('condição salva automaticamente ao sair do campo, sem botão nem gravação na abertura',async()=>{
  const calls=[];await mountCondition(async request=>{calls.push(request);return true;});
  await blur();assert.deepEqual(calls,[]);
  assert.doesNotMatch(text(view.toJSON()),/Salvar condição/);
  const duration=view.root.findAllByType('label').find(node=>text(node).trim()==='Duração');
  act(()=>duration.findByType('input').props.onChange({target:{value:'3'}}));
  await blur();assert.equal(calls.length,1);assert.equal(calls[0].duracao,3);assert.equal(calls[0].idInstancia,'espada');
  assert.match(text(view.toJSON()),/Alterações aplicadas/);
  await blur();assert.equal(calls.length,1);
});

test('condição com campos incompletos não grava; completar o intervalo aplica e erro permite tentar novamente',async()=>{
  const calls=[];let accept=false;
  await mountCondition(async request=>{calls.push(request);return accept;});
  act(()=>view.root.findAllByType('select')[0].props.onChange({target:{value:'RESULTADO_NATURAL'}}));
  await blur();assert.equal(calls.length,0);assert.match(text(view.toJSON()),/Informe um resultado natural/);
  const minimum=view.root.findAllByType('label').find(node=>text(node)==='D20 de ');
  act(()=>minimum.findByType('input').props.onChange({target:{value:'19'}}));
  await blur();assert.equal(calls.length,1);assert.equal(calls[0].resultadoNaturalMinimo,19);
  assert.match(text(view.toJSON()),/Não foi possível atualizar/);
  accept=true;await blur();assert.equal(calls.length,2);assert.match(text(view.toJSON()),/Alterações aplicadas/);
});

test('selects e botão de reação aplicam imediatamente, sem depender de blur no toque',async()=>{
  const calls=[];await mountCondition(async request=>{calls.push(request);return true;});
  await act(async()=>view.root.findAllByType('select')[0].props.onChange({target:{value:'AO_USAR'}}));
  assert.equal(calls.length,1);assert.equal(calls[0].gatilho,'AO_USAR');
  await act(async()=>view.root.findAllByType('button').find(node=>text(node)==='Exigir teste de reação').props.onClick());
  assert.equal(calls.length,2);assert.equal(calls[1].testeResistencia.atributo,'RESISTENCIA');
  await blur();assert.equal(calls.length,2,'não repete ao sair de uma seleção já gravada');
});
