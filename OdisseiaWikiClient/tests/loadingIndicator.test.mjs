import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { renderToStaticMarkup } from 'react-dom/server';

const bundle = await build({ stdin: { contents: `
  export * from './src/components/Generic/LoadingIndicator/LoadingIndicator';
  export * from './src/components/Generic/LoadingIndicator/LoadingIndicator.style';
  export {ServerStyleSheet} from 'styled-components';`, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'cjs', platform: 'node', jsx: 'automatic',
  external: ['react', 'react/jsx-runtime'], mainFields: ['module', 'main'],
});
const module = { exports: {} };
new Function('require', 'module', 'exports', bundle.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
const api = module.exports;
const cssFor = (component, props = {}) => {
  const sheet = new api.ServerStyleSheet();
  try {
    renderToStaticMarkup(sheet.collectStyles(React.createElement(component, props, 'Carregando')));
    return sheet.getStyleTags();
  } finally { sheet.seal(); }
};

test('glow fica fora do recorte do rótulo, sem sombra retangular ou mudança nas reticências', () => {
  const glow = cssFor(api.LoadingLabel), clip = cssFor(api.LoadingLabelClip);
  assert.match(glow, /overflow:visible/);
  assert.match(glow, /filter:drop-shadow\(0 0 8px currentColor\)/);
  assert.doesNotMatch(glow, /overflow:hidden|box-shadow:/);
  assert.match(clip, /overflow:hidden/);
  assert.match(clip, /text-overflow:ellipsis/);
  assert.match(clip, /white-space:nowrap/);
  assert.doesNotMatch(clip, /filter:|text-shadow:|box-shadow:/);
  for (const compact of [true, false]) {
    const text = cssFor(api.LoadingText, { $compact: compact });
    assert.match(text, /text-shadow:none/);
    assert.doesNotMatch(text, /overflow:hidden/);
    const wrapper = cssFor(api.LoadingWrapper, { $compact: compact });
    assert.match(wrapper, /max-width:100%/);
    assert.doesNotMatch(wrapper, /overflow:hidden/);
  }
});

test('loading padrão e compacto preservam texto acessível, cor, ícone e pontos animados', () => {
  for (const compact of [false, true]) {
    let view;
    const label = 'Carregando um rótulo suficientemente longo para um botão estreito';
    try {
      act(() => { view = create(React.createElement(api.LoadingIndicator, { compact, label })); });
      const status = view.root.findAll(node => node.type === 'span' && node.props.role === 'status');
      assert.equal(status.length, 1);
      assert.equal(status[0].props['aria-live'], 'polite');
      const glow = view.root.findByType(api.LoadingLabel);
      assert.equal(glow.props.title, label);
      assert.equal(glow.findByType(api.LoadingLabelClip).props.children, label);
      assert.equal(view.root.findAllByType(api.LoadingIcon).length, compact ? 0 : 1);
      const dots = view.root.findByType(api.AnimatedDots);
      assert.equal(dots.props['aria-hidden'], 'true');
      assert.equal(dots.findAllByType('i').length, 3);
      act(() => view.update(React.createElement(api.LoadingIndicator, { compact })));
      assert.equal(view.root.findByType(api.LoadingLabelClip).props.children, 'Carregando');
    } finally { if (view) act(() => view.unmount()); }
  }
  assert.match(cssFor(api.LoadingIcon), /drop-shadow|animation:/);
  assert.match(cssFor(api.AnimatedDots), /box-shadow:0 0 0\.38em currentColor/);
});
