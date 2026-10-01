import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({
  stdin: {
    contents: "export { getProjectedHiddenCharacterFields } from './src/utils/characterVisibility';",
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const { getProjectedHiddenCharacterFields } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
);

test('ficha completa não confunde campo vazio com informação bloqueada', () => {
  const visibilidade = { passivas: false, ultimate: false, personagensRelacionados: false };
  const ocultos = getProjectedHiddenCharacterFields({
    visibilidadeProjetada: false,
    idpassiva: null,
    ultimate: null,
    personagemsVinculados: null,
  }, visibilidade);

  assert.deepEqual(ocultos, {});
});

test('ficha projetada indica apenas os campos realmente removidos', () => {
  const visibilidade = { passivas: false, ultimate: false, personagensRelacionados: false };
  const ocultos = getProjectedHiddenCharacterFields({
    visibilidadeProjetada: true,
    idpassiva: null,
    ultimate: null,
    personagemsVinculados: null,
  }, visibilidade);

  assert.equal(ocultos.passivas, true);
  assert.equal(ocultos.ultimate, true);
  assert.equal(ocultos.personagensRelacionados, true);
});
