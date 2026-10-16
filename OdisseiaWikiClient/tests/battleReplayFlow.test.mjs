import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldAutoCloseCombat } from '../src/routes/Game/GameRunShell/battleReplayFlow.ts';

test('somente o combate atual em 2× fecha ao terminar', () => {
  assert.equal(shouldAutoCloseCombat('current', 1), false);
  assert.equal(shouldAutoCloseCombat('current', 2), true);
  assert.equal(shouldAutoCloseCombat('history', 1), false);
  assert.equal(shouldAutoCloseCombat('history', 2), false);
});
