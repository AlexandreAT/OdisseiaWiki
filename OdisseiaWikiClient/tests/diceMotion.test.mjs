import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const compile = (source) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const geometrySource = await readFile(new URL(
  '../src/components/Gameplay/DiceRollOverlay/dieGeometry.ts', import.meta.url), 'utf8');
const geometryUrl = `data:text/javascript;base64,${Buffer.from(compile(geometrySource)).toString('base64')}`;
const motionSource = await readFile(new URL(
  '../src/components/Gameplay/DiceRollOverlay/diceMotion.ts', import.meta.url), 'utf8');
const motionCompiled = compile(motionSource).replace("'./dieGeometry'", `'${geometryUrl}'`);
const motion = await import(`data:text/javascript;base64,${Buffer.from(motionCompiled).toString('base64')}`);
const geometry = await import(geometryUrl);

const quaternionSimilarity = (first, second) => Math.abs(
  first.reduce((sum, value, index) => sum + value * second[index], 0),
);

test('landing only loses angular speed and reaches the authoritative face without a final snap', () => {
  const from = geometry.quaternionAxis([1, .4, -.2], 1.35);
  const target = geometry.quaternionAxis([-.3, 1, .6], 2.2);
  const plan = motion.createNaturalLandingPlan(from, target, [33, -24, 18], 3600);
  const speeds = Array.from({ length: 81 }, (_, index) =>
    motion.getNaturalLandingAngularSpeed(plan, plan.durationMs * index / 80));

  assert.ok(Math.abs(speeds[0] - Math.hypot(33, -24, 18)) < 1e-9);
  for (let index = 1; index < speeds.length; index += 1) {
    assert.ok(speeds[index] <= speeds[index - 1], `speed increased at sample ${index}`);
  }
  assert.equal(speeds.at(-1), 0);

  const almostFinished = motion.getNaturalLandingRotation(plan, plan.durationMs * .995);
  const finished = motion.getNaturalLandingRotation(plan, plan.durationMs);
  assert.ok(quaternionSimilarity(finished, target) > .999999999);
  assert.ok(quaternionSimilarity(almostFinished, finished) > .999999);
});

test('a fast long gesture keeps its impulse even when pointer-up adds no movement', () => {
  const launch = motion.resolveGestureLaunch({
    displacementX: 1100,
    displacementY: -240,
    recentVx: 120,
    recentVy: -30,
    peakSpeed: 4200,
    pathLength: 1180,
    elapsedMs: 420,
    maxSpeed: 4800,
  });

  assert.ok(launch.speed >= 3400);
  assert.ok(Math.hypot(launch.vx, launch.vy) >= 3400);
});
