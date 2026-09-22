import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/components/Gameplay/DiceRollOverlay/diceResult.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { getVisualDiceResults } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

const roll = (values, kept, discarded) => ({
  grupos: [{ quantidade: 1, faces: 6, valores: values, indicesMantidos: kept, indicesDescartados: discarded }],
});

test('advantage displays both server dice in order and marks the discarded one', () => {
  assert.deepEqual(getVisualDiceResults(roll([2, 5], [1], [0])), [
    { value: 2, kept: false, discarded: true },
    { value: 5, kept: true, discarded: false },
  ]);
});

test('disadvantage displays both server dice in order and marks the discarded one', () => {
  assert.deepEqual(getVisualDiceResults(roll([6, 1], [1], [0])), [
    { value: 6, kept: false, discarded: true },
    { value: 1, kept: true, discarded: false },
  ]);
});

test('without a response, no visual die value is fabricated', () => {
  assert.deepEqual(getVisualDiceResults(null), []);
});
