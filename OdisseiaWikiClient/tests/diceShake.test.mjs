import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL(
  '../src/components/Gameplay/DiceRollOverlay/diceShake.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { getDiceShakeSample } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
);

test('ignores normal device movement below the shake threshold', () => {
  assert.equal(getDiceShakeSample({ x: 2, y: 1.5, z: 2.2 }), null);
});

test('converts a stronger shake into a stronger bounded dice impulse', () => {
  const moderate = getDiceShakeSample({ x: 8, y: -3, z: 4 });
  const strong = getDiceShakeSample({ x: 22, y: -12, z: 9 });

  assert.ok(moderate);
  assert.ok(strong);
  assert.ok(strong.intensity > moderate.intensity);
  assert.ok(strong.intensity <= 1);
  assert.ok(Math.abs(Math.hypot(strong.directionX, strong.directionY) - 1) < 1e-9);
});
