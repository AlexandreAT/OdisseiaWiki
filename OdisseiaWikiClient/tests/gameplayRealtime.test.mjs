import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({
  stdin: { contents: "export * from './src/utils/gameplayRealtime';", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const { hasNewGameplayEvents } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
);

test('rolagem nova é percebida pela sequência mesmo sem nova revisão da sessão', () => {
  const session = { idMesaSessao: 7, revisaoEstado: 2, ultimaSequenciaEvento: 12 };
  assert.equal(hasNewGameplayEvents(session, 7, 11), true);
  assert.equal(hasNewGameplayEvents(session, 7, 12), false);
  assert.equal(hasNewGameplayEvents(session, 6, 12), true);
  assert.equal(hasNewGameplayEvents(null, 7, 11), false);
});
