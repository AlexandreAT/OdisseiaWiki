import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

const bundle = await build({
  stdin: { contents: `export { getGameRunStatistics, getGameRunVictories } from './src/services/gameRunService';`,
    loader: 'ts', resolveDir: process.cwd() },
  bundle: true, write: false, format: 'cjs', platform: 'node',
  plugins: [{ name: 'statistics-api', setup(builder) {
    builder.onResolve({ filter:/\/axios\/api$/ },()=>({path:'api',namespace:'test'}));
    builder.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export default { get:(...args)=>globalThis.__statisticsGet(...args) };'}));
  } }],
});
const module={exports:{}};
new Function('require','module','exports',bundle.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
const api=module.exports;

test('estatísticas gerais e por personagem usam a sessão, sem enviar ID de usuário', async()=>{
  const previous=globalThis.__statisticsGet, calls=[];
  const data={geral:{total:4,vencidas:1,perdidas:2,emAndamento:1},personagens:[]};
  globalThis.__statisticsGet=async(...args)=>{calls.push(args);return {data};};
  try {
    const signal=new AbortController().signal;
    assert.equal(await api.getGameRunStatistics(undefined,signal),data);
    assert.equal(await api.getGameRunStatistics(42,signal),data);
    assert.deepEqual(calls,[['/game-runs/statistics',{params:{characterId:undefined},signal}],
      ['/game-runs/statistics',{params:{characterId:42},signal}]]);
  } finally {if(previous===undefined)delete globalThis.__statisticsGet;else globalThis.__statisticsGet=previous;}
});

test('histórico de vitórias mantém cursor, filtro, cancelamento e erros da API', async()=>{
  const previous=globalThis.__statisticsGet, calls=[];
  const data={vitorias:[{idGameRun:80}],proximoCursor:80};
  globalThis.__statisticsGet=async(...args)=>{calls.push(args);return {data};};
  try {
    assert.equal(await api.getGameRunVictories(),data);
    const signal=new AbortController().signal;
    assert.equal(await api.getGameRunVictories({characterId:42,before:81,limit:10},signal),data);
    assert.deepEqual(calls[0],['/game-runs/statistics/victories',{params:{},signal:undefined}]);
    assert.deepEqual(calls[1],['/game-runs/statistics/victories',{params:{characterId:42,before:81,limit:10},signal}]);
    globalThis.__statisticsGet=async()=>{throw Error('unauthorized');};
    await assert.rejects(api.getGameRunStatistics(),/unauthorized/);
  } finally {if(previous===undefined)delete globalThis.__statisticsGet;else globalThis.__statisticsGet=previous;}
});
