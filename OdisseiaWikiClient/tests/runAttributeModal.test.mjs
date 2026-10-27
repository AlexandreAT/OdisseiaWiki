import assert from 'node:assert/strict';
import {beforeEach, afterEach, test} from 'node:test';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import React from 'react';
import {act,create} from 'react-test-renderer';
import {renderToStaticMarkup} from 'react-dom/server';

const bundle=await build({stdin:{contents:`export * from './src/routes/Game/GameRunShell/RunAttributeModal';
  export * from './src/routes/Game/GameRunShell/RunAttributeInfluences';
  export * from './src/routes/Game/GameRunShell/RunRewards.style';
  export {ServerStyleSheet} from 'styled-components';`,resolveDir:process.cwd(),loader:'ts'},
  bundle:true,write:false,format:'cjs',platform:'node',jsx:'automatic',mainFields:['module','main'],external:['react','react/jsx-runtime'],
  loader:{'.svg':'text'}, plugins:[{name:'attribute-surfaces',setup(builder){
    builder.onResolve({filter:/^@mui\/icons-material\//},()=>({path:'icon',namespace:'stub'}));
    builder.onResolve({filter:/^react-dom$/},()=>({path:'portal',namespace:'stub'}));
    builder.onResolve({filter:/\/Modal\/Modal$/},()=>({path:'modal',namespace:'stub'}));
    builder.onResolve({filter:/\/services\/gameRunService$/},()=>({path:'service',namespace:'stub'}));
    builder.onLoad({filter:/.*/,namespace:'stub'},({path})=>({loader:'js',contents:path==='portal'?'export const createPortal=children=>children;'
      :path==='service'?`export const getGameRunAttributes=async()=>structuredClone(globalThis.__attributeOptions);
        export const upgradeGameRunAttribute=(...args)=>globalThis.__attributeUpgrade(...args); export const getGameRun=async()=>({});`
        :path==='modal'?`import React from 'react';export const Modal=({children,title})=>React.createElement('section',{role:'dialog','aria-label':title},children);`
          :`import React from 'react';export default p=>React.createElement('svg',p);`}));
  }}]});
const module={exports:{}};new Function('require','module','exports',bundle.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
const api=module.exports;
const prior=Object.fromEntries(['window','document','ResizeObserver','requestAnimationFrame','cancelAnimationFrame'].map(key=>[key,globalThis[key]]));
let renderer,events,anchor,calls;
beforeEach(()=>{
  calls=[];events=new Map();
  globalThis.window={innerWidth:360,innerHeight:640,addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name)};
  globalThis.document={body:{},documentElement:{dataset:{}},addEventListener(){},removeEventListener(){}};
  globalThis.ResizeObserver=class{observe(){}disconnect(){}};
  globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
  anchor={isConnected:true,focus(){},closest:()=>({}),getBoundingClientRect:()=>({left:70,top:200,width:20,height:24})};
  globalThis.__attributeOptions={pontos:1,atributos:[{codigo:'resistencia',nome:'Resistência',grupo:'principais',valor:2,limite:5,recursos:[],modificador:1,influencias:[
    {id:'braco',nome:'Braço',imagem:'/braco.png',tipo:'PROTESE',efeitos:[{codigo:'RESISTENCIA',nome:'Resistência',grupo:'principais',valor:3},{codigo:'AGILIDADE',nome:'Agilidade',grupo:'principais',valor:2}]},
    {id:'colete',nome:'Colete',tipo:'ITEM',efeitos:[{codigo:'RESISTENCIA',nome:'Resistência',grupo:'principais',valor:-2}]},
  ]}]};
  globalThis.__attributeUpgrade=async(...args)=>{calls.push(args);return {idGameRun:1,revisao:2};};
});
afterEach(()=>{if(renderer)act(()=>renderer.unmount());renderer=null;
  for(const[key,value]of Object.entries(prior)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
  delete globalThis.__attributeOptions;delete globalThis.__attributeUpgrade;
});
const props={run:{idGameRun:1,revisao:1,idSistemaVersao:42},theme:'dark',neon:'on',onUpdate(){},onClose(){}};
const mount=async(extra={})=>act(async()=>{renderer=create(React.createElement(api.RunAttributeModal,{...props,...extra}),
  {createNodeMock:element=>element.type==='button'&&element.props.className==='attribute-modifier'?anchor:null});});
const text=node=>typeof node==='string'?node:(node?.children??[]).map(text).join('');
const modifier=()=>renderer.root.findAllByType('button').find(node=>node.props.className==='attribute-modifier');

test('valor natural continua separado; hover e toque abrem lista no holograma sem gastar ponto',async()=>{
  await mount();
  assert.equal(text(renderer.root.findByProps({className:'attribute-natural'})),'2');assert.equal(text(modifier()),'+1');
  assert.equal(calls.length,0);
  act(()=>modifier().props.onMouseEnter({currentTarget:anchor}));
  const panel=renderer.root.findAll(node=>typeof node.type==='string'&&node.props.role==='tooltip')[0];
  assert.ok(panel);assert.equal(panel.props.style.width,panel.props.style.height);assert.ok(panel.props.style.width<=336);
  assert.equal(renderer.root.findByType('img').props.src,'/braco.png');
  assert.equal(renderer.root.findAllByType('li').length,2);
  assert.deepEqual(renderer.root.findAllByType('strong').map(text),['+3 Resistência','−2 Resistência']);
  assert.equal(text(renderer.root.findByProps({className:'influence-other'})),'+2 agi');
  act(()=>modifier().props.onClick({currentTarget:anchor}));
  assert.equal(renderer.root.findAll(node=>typeof node.type==='string'&&node.props.role==='dialog').length,2);
  assert.equal(calls.length,0);
});

test('modificador negativo e soma anulada permanecem consultáveis sem alterar o natural',async()=>{
  for(const[value,label]of[[-2,'−2'],[0,'±0']]){
    globalThis.__attributeOptions.atributos[0].modificador=value;
    await mount();assert.equal(text(modifier()),label);assert.equal(modifier().props['data-negative'],value<0);
    assert.equal(text(renderer.root.findByProps({className:'attribute-natural'})),'2');
    act(()=>renderer.unmount());renderer=null;
  }
});

test('respostas antigas sem influências continuam mostrando natural e upgrade funciona uma vez',async()=>{
  delete globalThis.__attributeOptions.atributos[0].influencias;
  delete globalThis.__attributeOptions.atributos[0].modificador;
  let finish;globalThis.__attributeUpgrade=(...args)=>{calls.push(args);return new Promise(resolve=>{finish=resolve;});};
  await mount();assert.equal(renderer.root.findAllByProps({className:'attribute-modifier'}).length,0);
  const up=renderer.root.findByProps({'aria-label':'Aumentar Resistência'});
  act(()=>{up.props.onClick();up.props.onClick();});assert.equal(calls.length,1);
  assert.equal(calls[0][1].codigo,'resistencia');assert.equal(calls[0][1].revisaoEsperada,1);
  await act(async()=>finish({idGameRun:1,revisao:2}));
  assert.equal(renderer.root.findByProps({'aria-label':'Aumentar Resistência'}).props.disabled,false);
});

test('fontes e afastamento seguem o site; bônus e upgrade são absolutos, sem ocupar a linha do número',()=>{
  const sheet=new api.ServerStyleSheet();
  try{
    renderToStaticMarkup(sheet.collectStyles(React.createElement(api.RewardsBody,null,
      React.createElement('section',null,React.createElement('h3',null,'Principais'),React.createElement(api.AttributeGrid,null,'Atributos')))));
    const css=sheet.getStyleTags();assert.match(css,/Cyberpunk Is Not Dead/);assert.match(css,/Orbitron/);
    assert.match(css,/margin:0 0 14px/);assert.match(css,/right:calc\(100% \+ 6px\)/);assert.match(css,/left:calc\(100% \+ 5px\)/);
    assert.match(css,/container-type:inline-size/);assert.match(css,/40cqi/);assert.match(css,/grid-template-columns:repeat\(auto-fit/);
  }finally{sheet.seal();}
});
