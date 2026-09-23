import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/utils/remoteGameplayRolls.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { isRemoteGameplayRoll } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
);

const event = {
  idUsuarioAtor: 12,
  manual: false,
  oculto: false,
  rolagem: { grupos: [{ faces: 20, valores: [17] }] },
};

test('authorized roll from another user is animated', () => {
  assert.equal(isRemoteGameplayRoll(event, 30), true);
});

test('own, hidden, manual and non-roll events are not animated', () => {
  assert.equal(isRemoteGameplayRoll(event, 12), false);
  assert.equal(isRemoteGameplayRoll({ ...event, oculto: true }, 30), false);
  assert.equal(isRemoteGameplayRoll({ ...event, manual: true }, 30), false);
  assert.equal(isRemoteGameplayRoll({ ...event, rolagem: null }, 30), false);
});
