import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [indexCss, globalStyles, buttonStyles, loadingStyles, animatedBackgroundStyles] = await Promise.all([
  readSource('src/index.css'),
  readSource('src/Global Styles/Global.style.ts'),
  readSource('src/components/Generic/HighlightButton/HighlightButton.styles.ts'),
  readSource('src/components/Generic/LoadingIndicator/LoadingIndicator.style.ts'),
  readSource('src/components/Generic/AnimatedBackground/AnimatedBackground.style.ts'),
]);

test('text and icons inherit the semantic color instead of receiving a global white override', () => {
  assert.doesNotMatch(indexCss, /\*\s*\{[^}]*color\s*:/s);
  assert.match(indexCss, /svg\s*\{[^}]*color:\s*currentColor/s);
  assert.doesNotMatch(globalStyles, /p,\s*h1,\s*h2[^`]*fill:/s);
});

test('primary button keeps its loading label visible while disabled', () => {
  assert.match(buttonStyles, /&:not\(:disabled\):hover/);
  assert.match(loadingStyles, /\$compact[^?]*\?\s*'inherit'/s);
  assert.match(loadingStyles, /-webkit-text-fill-color:\s*currentColor/);
});

test('fixed animated background uses a viewport height unaffected by mobile browser chrome', () => {
  assert.match(indexCss, /--stable-viewport-height:\s*100lvh/);
  assert.match(animatedBackgroundStyles, /height:\s*var\(--stable-viewport-height/);
});
