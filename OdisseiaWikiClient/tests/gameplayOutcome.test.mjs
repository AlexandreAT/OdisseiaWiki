import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({
  stdin: { contents: "export * from './src/utils/gameplayOutcome';", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const { getGameplayRollOutcome, getGameplayEventOutcome } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
);

test('classifica resultados de testes por semântica, incluindo falha crítica', () => {
  assert.equal(getGameplayRollOutcome({ codigoResultado: 'SUCESSO' }), 'success');
  assert.equal(getGameplayRollOutcome({ codigoResultado: 'ACERTO_PRECISO' }), 'success');
  assert.equal(getGameplayRollOutcome({ codigoResultado: 'CRITICO' }), 'success');
  assert.equal(getGameplayRollOutcome({ codigoResultado: 'FALHA' }), 'failure');
  assert.equal(getGameplayRollOutcome({ codigoResultado: 'FALHA_CRITICA' }), 'failure');
  assert.equal(getGameplayRollOutcome({ codigoResultado: 'ERRO' }), 'failure');
});

test('XP, fórmula e rolagem sem desfecho são neutros, independentemente do valor', () => {
  assert.equal(getGameplayRollOutcome({ codigoResultado: 'XP_CALCULADO' }), 'neutral');
  assert.equal(getGameplayRollOutcome({ codigoResultado: 'SUCESSO' }, 'XP_BOSS'), 'neutral');
  assert.equal(getGameplayRollOutcome({ codigoResultado: 'FORMULA' }), 'neutral');
  assert.equal(getGameplayRollOutcome({ codigoResultado: null, nomeResultado: null, total: 20 }), 'neutral');
});

test('não revela nem interpreta resultado manual no histórico', () => {
  assert.equal(getGameplayEventOutcome({
    oculto: true, manual: false, codigoAcao: 'ATRIBUTO_PRINCIPAL',
    rolagem: { codigoResultado: 'SUCESSO' },
  }), 'neutral');
  assert.equal(getGameplayEventOutcome({
    oculto: false, manual: true, codigoAcao: 'REGISTRO_MANUAL',
    rolagem: { codigoResultado: 'RESULTADO_MANUAL', nomeResultado: 'Sucesso' },
  }), 'neutral');
});
