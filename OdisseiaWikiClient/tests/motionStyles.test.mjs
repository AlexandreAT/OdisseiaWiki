import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRequire } from 'node:module';

const bundle = await build({
  stdin: { contents: `export { ServerStyleSheet } from 'styled-components';
    export * from './src/components/Generic/ScrollRevealBlock/ScrollRevealBlock.style';
    export * from './src/routes/Game/BattleReplay/BattleReplay.style';
    export * from './src/routes/Game/GameRunShell/RunRewards.style';`,
    resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'cjs', platform: 'node',
  mainFields: ['module', 'main'], external: ['react', 'react-dom'],
});
const module = { exports: {} };
new Function('require', 'module', 'exports', bundle.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
const { ServerStyleSheet, ScrollRevealSection, ReplayXp, ReplayLevel, LootGrid } = module.exports;

test('CSS real mantém entradas, XP, level up e loot ativos no desktop e usa a preferência do site', () => {
  const sheet = new ServerStyleSheet();
  try {
    renderToStaticMarkup(sheet.collectStyles(React.createElement(React.Fragment, null,
      React.createElement(ScrollRevealSection, { $variant: 'wikiBlock', className: 'sr-entered' },
        React.createElement('div', null, React.createElement('h2', null, 'Título'), React.createElement('img', { alt: '' }))),
      React.createElement(ReplayXp, null, '+100 XP'),
      React.createElement(ReplayLevel, null, 'NÍVEL 2'),
      React.createElement(LootGrid, null, React.createElement('article', null, 'Loot')),
    )));
    const css = sheet.getStyleTags();
    assert.match(css, /\.sr-entered img\{[^}]*animation:/);
    assert.match(css, /animation:[^;]+1\.5s ease-out both/);
    assert.match(css, />article\{[^}]*animation:[^;]+\.5s ease-out both/);
    assert.match(css, /:root\[data-motion=['"]reduced['"]\][^\n]*\.sr-entered img[,\{]/);
    assert.doesNotMatch(css, /prefers-reduced-motion/);
    assert.ok((css.match(/:root\[data-motion=/g) ?? []).length >= 4);
  } finally { sheet.seal(); }
});
