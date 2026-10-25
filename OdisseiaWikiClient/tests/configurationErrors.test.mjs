import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

const bundle = await build({
  stdin: { contents: `export * from './src/utils/apiError'; export * from './src/utils/conditionRecovery'; export * from './src/routes/Management/ManagementSystem/systemValidation'; export * from './src/routes/Management/ManagementSystem/components/ModuleForms/conditionEffectFields'; export * from './src/content/systemOptionHelp';`, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const { getApiErrorMessage, conditionRecoveryCodes, toggleConditionRecovery,
  validateSistemaModule, describeSistemaValidationErrors, conditionOperationOptions, conditionEffectTargets,
  configureConditionOperation, conditionEffectValueLimits, describeSystemOptions } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`,
);
const condition = { codigo: 'DEPENDENCIA', nome: 'Dependência de mana', tipo: 'Recurso',
  duracaoPadrao: 8, unidadeDuracao: 'Hora', regraRemocao: 'DESCANSO_NORMAL',
  codigoRecurso: 'MANA', operacaoEfeito: 'REDUZIR_LIMITE_PERCENTUAL', valorEfeito: 30,
  momentoEfeito: 'ENQUANTO_ATIVA', codigoRecursoGatilho: 'MANA', operadorGatilho: '<=', valorGatilho: 0 };

test('recuperação por descanso normal ou longo aceita duração em horas sem exigir expiração', () => {
  for (const regraRemocao of ['DESCANSO_NORMAL', 'DESCANSO_NORMAL;CURA', 'DESCANSO_NORMAL_OU_LONGO;CURA']) {
    const config = { condicoes: [{ ...condition, regraRemocao }], descansos: [], morte: null };
    assert.deepEqual(validateSistemaModule('sobrevivencia', config), {});
  }
});

test('efeito principal oferece alteração de atributo com bônus ou penalidade e alvo dinâmico', () => {
  const references = { attributes: [{ value: 'RESISTENCIA', label: 'Resistência' },
    { value: 'PRECISAO', label: 'Precisão' }, { value: 'FOCO_NOVO', label: 'Foco novo' }],
    resources: [{ value: 'MANA', label: 'Mana' }], conditions: [], testCodes: [], weaponTypes: [] };
  const option = conditionOperationOptions.find((entry) => entry.value === 'MODIFICAR_ATRIBUTO');
  assert.ok(option);
  assert.match(option.description, /bônus.*penalidade/);
  assert.deepEqual(conditionEffectTargets(option.value, references), references.attributes);
  assert.ok(!conditionEffectTargets(option.value, references).some((entry) => entry.value === 'TODOS'));
  for (const valor of [-5, 2]) {
    const effect = configureConditionOperation(option.value, { operacao: 'SUBTRAIR',
      recurso: 'MANA', valor, momento: 'FIM_TURNO' }, references);
    assert.deepEqual(effect, { operacao: option.value, recurso: 'RESISTENCIA', valor, momento: 'ENQUANTO_ATIVA' });
    const config = { condicoes: [{ ...condition, codigoRecurso: 'FOCO_NOVO', operacaoEfeito: effect.operacao,
      valorEfeito: effect.valor, momentoEfeito: effect.momento }], descansos: [] };
    assert.deepEqual(validateSistemaModule('sobrevivencia', config), {});
  }
  assert.equal(configureConditionOperation(option.value, { recurso: 'FOCO_NOVO', valor: 3 }, references).recurso, 'FOCO_NOVO');
  assert.equal(configureConditionOperation(option.value, { valor: 2 }).recurso, '');
});

test('trocar operação preenche alvo, momento e limites compatíveis sem alterar o efeito anterior', () => {
  const previous = { operacao: 'MODIFICAR_ATRIBUTO', recurso: 'PRECISAO', valor: -5, momento: 'ENQUANTO_ATIVA' };
  assert.deepEqual(configureConditionOperation('PERDER_TURNOS', previous),
    { operacao: 'PERDER_TURNOS', recurso: 'TURNO', valor: 1, momento: 'AO_APLICAR' });
  assert.deepEqual(configureConditionOperation('DESVANTAGEM', previous),
    { operacao: 'DESVANTAGEM', recurso: 'TESTE', valor: 0, momento: 'ENQUANTO_ATIVA' });
  assert.deepEqual(configureConditionOperation('', previous), { operacao: '', recurso: '', valor: null, momento: '' });
  assert.equal(previous.valor, -5);
  assert.equal(conditionEffectValueLimits('MODIFICAR_ATRIBUTO').min, -1000000);
  assert.equal(conditionEffectValueLimits('MODIFICAR_LIMITE_PERCENTUAL').min, -100);
  assert.equal(conditionEffectValueLimits('SUBTRAIR').min, 0);
  for (const entry of conditionOperationOptions) assert.ok(entry.description, entry.value);
});

test('descrições são opt-in das escolhas nativas, sem inventar explicação para conteúdo dinâmico', () => {
  const options = [{ value: 'PRECISAO', label: 'Precisão' }, { value: 'MODIFICAR_ATRIBUTO', label: 'Alterar atributo' }];
  const described = describeSystemOptions('conditionOperation', options);
  assert.equal(described[0].description, undefined);
  assert.ok(described[1].description);
  assert.equal(options[1].description, undefined);
  assert.equal(describeSystemOptions('conditionOperation', [{ value: 'constructor', label: 'Personalizado' }])[0].description, undefined);
});
test('checkboxes reconhecem nomes históricos sem duplicar nem manter MANUAL na combinação', () => {
  assert.deepEqual(conditionRecoveryCodes('DESCANSO_NORMAL_OU_LONGO'), ['DESCANSO_NORMAL']);
  assert.equal(toggleConditionRecovery('DESCANSO_NORMAL_OU_LONGO', 'CURA', true), 'DESCANSO_NORMAL;CURA');
  assert.equal(toggleConditionRecovery('DESCANSO_NORMAL_OU_LONGO', 'DESCANSO_NORMAL', false), 'MANUAL');
  assert.equal(toggleConditionRecovery('MANUAL', 'DESCANSO_NORMAL', true), 'DESCANSO_NORMAL');
  assert.equal(toggleConditionRecovery('Após dormir ou receber auxílio', 'DESCANSO_NORMAL', true), 'DESCANSO_NORMAL');
  assert.equal(toggleConditionRecovery('Após dormir;DESCANSO_NORMAL', 'CURA', true), 'DESCANSO_NORMAL;CURA');
});
test('erros de outra condição continuam visíveis e identificados pelo nome', () => {
  const config = { condicoes: [condition, { ...condition, codigo: 'LESÃO', nome: 'Lesão', valorEfeito: 101 }], descansos: [] };
  const errors = validateSistemaModule('sobrevivencia', config);
  assert.match(describeSistemaValidationErrors(errors, config).join(' '), /Condição Lesão:.*0 e 100/);
  assert.equal(errors['condicoes.0.regra'], undefined);
});
test('expiração selecionada ainda exige duração válida', () => {
  const errors = validateSistemaModule('sobrevivencia', { condicoes: [{ ...condition,
    regraRemocao: 'DURACAO;DESCANSO_NORMAL', duracaoPadrao: 0 }], descansos: [] });
  assert.match(errors['condicoes.0.duracaoPadrao'], /maior que zero/);
});
test('erro de domínio do servidor é exibido, inclusive em conflitos', () => {
  assert.equal(getApiErrorMessage({ response: { status: 409, data: { mensagem: 'Já existe uma run ativa.' } } }, 'Falhou'), 'Já existe uma run ativa.');
  assert.equal(getApiErrorMessage({ response: { status: 400, data: { errors: { sistema: ['A condição Lesão está incompleta.'] } } } }, 'Falhou'), 'sistema: A condição Lesão está incompleta.');
  assert.equal(getApiErrorMessage({ response: { status: 400, data: { Mensagem: 'Rota 2 sem encontro.' } } }, 'Falhou'), 'Rota 2 sem encontro.');
});
test('erro interno informa referência sem expor detalhes ou HTML do servidor', () => {
  assert.equal(getApiErrorMessage({ response: { status: 500, data: { detail: 'SQL segredo', traceId: 'abc:0001' } } }, 'Falhou'), 'Falhou Referência do erro: abc:0001.');
  assert.equal(getApiErrorMessage({ response: { status: 502, data: '<html>proxy interno</html>' } }, 'Falhou'), 'Falhou');
});
