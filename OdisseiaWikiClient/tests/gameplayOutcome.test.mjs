import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({
  stdin: { contents: "export * from './src/utils/gameplayOutcome'; export * from './src/utils/gameplayRollSummary';", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const { getGameplayRollOutcome, getGameplayEventOutcome, getGameplayRollSummary } = await import(
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

test('teste de atributo exibe classificação, soma e cor do resultado publicado', () => {
  const roll = (codigoResultado, nomeResultado) => ({
    codigoResultado, nomeResultado, subtotal: 2, modificador: 5, total: 7,
    modificadores: [{ codigo: 'RESISTENCIA', nome: 'Resistência', valor: 5 }],
  });
  assert.equal(getGameplayRollSummary(roll('SUCESSO', 'Sucesso')), 'Sucesso: 2 + 5 = 7');
  assert.equal(getGameplayRollOutcome(roll('SUCESSO', 'Sucesso')), 'success');
  assert.equal(getGameplayRollOutcome(roll('FALHA', 'Falha')), 'failure');
});

test('histórico antigo de atributo interpreta FORMULA apenas pela dificuldade registrada', () => {
  const oldRoll = {
    codigoResultado: 'FORMULA', nomeResultado: 'Aplicar fórmula', subtotal: 2,
    modificador: 5, total: 7,
    dificuldade: { alvo: 6, comparador: '>' },
    origemAcao: { tipo: 'ATRIBUTO' },
  };
  assert.equal(getGameplayRollOutcome(oldRoll), 'success');
  assert.equal(getGameplayRollSummary(oldRoll), 'Sucesso: 2 + 5 = 7');
  assert.equal(getGameplayRollOutcome({ ...oldRoll, total: 6 }), 'failure');
  assert.equal(getGameplayRollOutcome({ ...oldRoll, origemAcao: { tipo: 'ROLAGEM_GENERICA' } }), 'neutral');
  assert.equal(getGameplayRollSummary({ ...oldRoll, dificuldade: null }), '2 + 5 = 7');
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
