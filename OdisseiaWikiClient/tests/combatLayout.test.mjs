import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const bundle = await build({ stdin: { contents: `
  export {RunTrainingDialog,RunCombatTrainingDialog} from './src/routes/Game/GameRunShell/GameRunShell.style';
  export {GamePage} from './src/routes/Game/GameShared.style';
  export {EnemyGroup} from './src/routes/Game/BattleReplay/BattleReplay.style';
  export {VictoryPanel,VictoryContent} from './src/routes/Game/GameRunShell/RunVictoryScreen.style';
  export {ServerStyleSheet} from 'styled-components';`, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'cjs', platform: 'node', mainFields: ['module', 'main'], jsx: 'automatic',
  external: ['react', 'react/jsx-runtime'], loader: { '.svg': 'text' },
  plugins: [{ name: 'dialog', setup(builder) {
    builder.onResolve({ filter: /^@mui\/material\/Dialog$/ }, () => ({ path: 'dialog', namespace: 'test' }));
    builder.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ loader: 'js', contents:
      `import React from 'react'; export default React.forwardRef(({children,className},ref)=>React.createElement('section',{ref,className},children));` }));
  } }],
});
const module = { exports: {} };
new Function('require', 'module', 'exports', bundle.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
const api = module.exports;
const styles = nodes => {
  const sheet = new api.ServerStyleSheet();
  try { renderToStaticMarkup(sheet.collectStyles(nodes)); return sheet.getStyleTags(); } finally { sheet.seal(); }
};

test('treino usa largura e margens do combate normal e aproveita a altura do viewport', () => {
  const css = styles(React.createElement(React.Fragment, null,
    React.createElement(api.GamePage, null, 'Combate'),
    React.createElement(api.RunCombatTrainingDialog, { open: true }, 'Treino')));
  assert.ok((css.match(/width:min\(1240px,\s*calc\(100% - 40px\)\)/g) ?? []).length >= 2);
  assert.match(css, /height:calc\(100dvh - 40px\)/);
  assert.match(css, /width:calc\(100% - 24px\)/);
  assert.match(css, /\[data-combat-training-body\]\{max-height:none/);
});

test('loja, depósito e demais diálogos não herdam o tamanho ampliado do treino', () => {
  const css = styles(React.createElement(api.RunTrainingDialog, { open: true }, 'Loja'));
  assert.doesNotMatch(css, /height:calc\(100dvh - 40px\)/);
  assert.doesNotMatch(css, /width:min\(1240px/);
});

test('lista de combatentes bloqueia o scroll horizontal da tremida e preserva rolagem vertical', () => {
  const css = styles(React.createElement(api.EnemyGroup, null,
    React.createElement('div', { style: { transform: 'translateX(4px)' } }, 'Combatente')));
  assert.match(css, /overflow-x:hidden;overflow-y:auto/);
  assert.match(css, /max-height:min\(68vh,\s*680px\)/);
  assert.match(css, /scrollbar-width:thin/);
  assert.doesNotMatch(css, /overflow-y:hidden|transform:none|animation:none/);
});

test('scan da vitória acompanha todo o conteúdo, sem ficar limitado à altura do viewport rolável', () => {
  const outer = styles(React.createElement(api.VictoryPanel, { $neon: true }, 'Conteúdo'));
  assert.match(outer, /overflow-y:auto/);
  assert.match(outer, /max-height:calc\(100dvh - 32px\)/);
  assert.doesNotMatch(outer, /background-size:100% 220%|transparent 43%/);
  const inner = styles(React.createElement(api.VictoryContent, null, 'Conteúdo completo'));
  assert.match(inner, /::before\{content:'';position:absolute;inset:0;pointer-events:none/);
  assert.match(inner, /background-size:100% 220%/);
  assert.match(inner, /7s linear infinite/);
  assert.doesNotMatch(inner, /max-height:|height:100(?:d?vh|%)/);
  assert.match(inner, /::after\{content:'';position:absolute;inset:7px/);
});

test('scan da vitória preserva movimento reduzido e neon não altera a geometria ou a rolagem', () => {
  const inner = styles(React.createElement(api.VictoryContent));
  assert.match(inner, /\[data-motion='reduced'\].*::before\{animation-duration:\.01ms!important;animation-iteration-count:1!important/);
  for (const neon of [false, true]) {
    const css = styles(React.createElement(api.VictoryPanel, { $neon: neon }, React.createElement(api.VictoryContent)));
    assert.match(css, /overflow-x:hidden;overflow-y:auto/);
    assert.match(css, /pointer-events:none/);
    assert.match(css, /padding:clamp\(24px,\s*5vw,\s*52px\)/);
    assert.equal(css.includes('0 0 28px'), neon);
  }
});
