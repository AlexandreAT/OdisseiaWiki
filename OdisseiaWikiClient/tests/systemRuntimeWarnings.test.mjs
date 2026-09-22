import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({
  stdin: {
    contents: "export { isDisplayableRuntimeWarning } from './src/components/Generic/SystemRuntimeIndicator/SystemRuntimeIndicator.utils';",
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const { isDisplayableRuntimeWarning } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
);

test('não avisa sobre diferenças de vida, mana e estamina em fichas', () => {
  for (const prefix of ['statusJson.status', 'entidade.statusJson.status']) {
    for (const field of ['vida', 'vidaMaxima', 'mana', 'manaMaxima', 'estamina', 'estaminaMaxima']) {
      assert.equal(isDisplayableRuntimeWarning({
        codigo: 'ValorForaReferencia',
        caminho: `${prefix}.${field}`,
      }), false);
    }
  }
});

test('preserva avisos de carga, limites e outros contextos', () => {
  for (const path of [
    'statusJson.status.capacidadeCarga',
    'nivel',
    'skills',
    'magias',
    'outroContexto.status.manaMaxima',
  ]) {
    assert.equal(isDisplayableRuntimeWarning({ codigo: 'ValorForaReferencia', caminho: path }), true);
  }
  assert.equal(isDisplayableRuntimeWarning({
    codigo: 'ConfiguracaoRacialAusente',
    caminho: 'statusJson.status.vidaMaxima',
  }), true);
});
