import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import React from 'react';
import { act, create } from 'react-test-renderer';

const bundle = await build({ stdin: { contents: `
  export * from './src/utils/conditionImage';
  export * from './src/components/Gameplay/ConditionBadges/ConditionBadges';
  export * from './src/routes/Management/ManagementSystem/components/ModuleForms/ConditionImageField';`,
  resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node',
  jsx: 'automatic', mainFields: ['module', 'main'], external: ['react', 'react/jsx-runtime'],
  banner: { js: `import {createRequire} from 'node:module'; const require=createRequire(${JSON.stringify(import.meta.url)});` },
  plugins: [{ name: 'condition-surfaces', setup(builder) {
    const stub = (filter, name, contents) => {
      builder.onResolve({ filter }, () => ({ path: name, namespace: name }));
      builder.onLoad({ filter: /.*/, namespace: name }, () => ({ contents, loader: 'js' }));
    };
    stub(/^@mui\/icons-material\//, 'icon', `import {createElement} from 'react'; export default ()=>createElement('svg');`);
    stub(/^@mui\/material\/Tooltip$/, 'tooltip', `import {createElement} from 'react'; export default props=>createElement('test-tooltip',props,props.children);`);
    stub(/^@mui\/material\/ClickAwayListener$/, 'away', `import {createElement} from 'react'; export default props=>createElement('test-away',props,props.children);`);
    stub(/\/ImageUploader\/ImageUploader$/, 'uploader', `import {createElement} from 'react'; export const ImageUploader=props=>createElement('test-uploader',props);`);
    stub(/\/services\/assetsService$/, 'assets', 'export const saveAsset=props=>globalThis.__conditionUpload(props);');
  } }],
});
const source = bundle.outputFiles[0].text.replace(/((?:from|import)\s*)(["'])(react(?:\/jsx-runtime)?)\2/g,
  (_, prefix, _quote, name) => prefix + JSON.stringify(import.meta.resolve(name)));
const api = await import(`data:text/javascript;base64,${Buffer.from(source + '\n//# sourceURL=condition-feedback.test-bundle.js').toString('base64')}`)
  .catch(error => { throw new Error(error.message.replace(/data:text\/javascript;base64,[A-Za-z0-9+/=]+/g, '[test bundle]')); });

test('imagem é metadado opcional e não apaga efeitos, regras ou outras opções', () => {
  const initial = JSON.stringify({ efeitos: [{ operacao: 'SOMAR', recurso: 'VIDA', valor: 100 }], custom: true });
  const image = api.withConditionImage(initial, '/regen.png');
  assert.equal(api.conditionImage(image), '/regen.png');
  assert.deepEqual(JSON.parse(image).efeitos, JSON.parse(initial).efeitos);
  assert.deepEqual(JSON.parse(api.withConditionImage(image)), JSON.parse(initial));
  assert.equal(api.conditionImage(null), undefined);
  assert.equal(api.conditionImage('invalid'), undefined);
});

test('indicadores agrupam stacks, abrem nome no hover/toque e usam fallback para imagem ausente ou inválida', () => {
  let renderer;
  act(() => { renderer = create(React.createElement(api.ConditionBadges, { neon: true, conditions: [
    { code: 'REGEN', name: 'Regeneração', image: '/regen.png' },
    { code: 'REGEN', name: 'Regeneração', image: '/regen.png' }, { code: 'CEGO', name: 'Cegueira' },
  ] })); });
  assert.equal(renderer.root.findAllByType('button').length, 2);
  assert.equal(renderer.root.findAllByType('img').length, 1);
  assert.equal(renderer.root.findAllByType('svg').length, 1);
  assert.equal(renderer.root.findAllByType('test-tooltip')[0].props.title, 'Regeneração ×2');
  act(() => renderer.root.findAllByType('test-tooltip')[0].props.onOpen());
  assert.equal(renderer.root.findAllByType('test-tooltip')[0].props.open, true);
  act(() => renderer.root.findAllByType('button')[0].props.onClick());
  assert.equal(renderer.root.findAllByType('test-tooltip')[0].props.open, true, 'toque não desfaz o hover sintetizado');
  act(() => renderer.root.findAllByType('test-away')[0].props.onClickAway());
  assert.equal(renderer.root.findAllByType('test-tooltip')[0].props.open, false);
  act(() => renderer.root.findByType('img').props.onError());
  assert.equal(renderer.root.findAllByType('svg').length, 2);
  act(() => renderer.update(React.createElement(api.ConditionBadges, { conditions: [] })));
  assert.equal(renderer.toJSON(), null);
  act(() => renderer.unmount());
});

test('tooltip mantém a borda na seta e no corpo, com neon ligado ou desligado', () => {
  for (const neon of [true, false]) {
    let renderer;
    act(() => { renderer = create(React.createElement(api.ConditionBadges, { neon,
      conditions: [{ code: 'REGEN', name: 'Regeneração' }] })); });
    const { tooltip, arrow } = renderer.root.findByType('test-tooltip').props.componentsProps;
    assert.equal(tooltip.sx.border, `1px solid var(--${neon ? 'clearneonBlue' : 'grey'})`);
    assert.equal(arrow.sx['&::before'].border, tooltip.sx.border);
    assert.equal(arrow.sx['&::before'].boxSizing, 'border-box');
    act(() => renderer.unmount());
  }
});

test('header do mapa posiciona condições na mesma linha, depois das defesas e fora da grade dos status', () => {
  const shell = readFileSync(new URL('../src/routes/Game/GameRunShell/GameRunShell.tsx', import.meta.url), 'utf8');
  const header = shell.slice(shell.indexOf('<ResourceAndAttributes>'), shell.indexOf('</ResourceAndAttributes>'));
  const defenses = header.slice(header.indexOf('<RunDefenseRow '), header.indexOf('</RunDefenseRow>'));
  assert.ok(defenses.indexOf('<ConditionBadges ') > defenses.lastIndexOf('</RunDefenseValue>'));
  assert.ok(header.indexOf('<ConditionBadges ') < header.indexOf('<AttributeList '));
  assert.doesNotMatch(header.slice(header.indexOf('<ResourceList>'), header.indexOf('</ResourceList>')), /ConditionBadges/);
  const group = defenses.slice(defenses.indexOf('<RunDefenseDetails>'), defenses.indexOf('</RunDefenseDetails>'));
  assert.ok(group.includes('<ConditionBadges '));
  const styles = readFileSync(new URL('../src/routes/Game/GameRunShell/GameRunShell.style.ts', import.meta.url), 'utf8');
  const details = styles.slice(styles.indexOf('export const RunDefenseDetails'), styles.indexOf('export const RunProtection'));
  assert.match(details, /grid-template-columns: max-content max-content minmax\(0, 1fr\)/);
  assert.doesNotMatch(details, /flex-wrap/);
  const rail = styles.slice(styles.indexOf('export const RunActionRail'), styles.indexOf('export const TrainingIcon'));
  assert.match(rail, /button:disabled \{ opacity: \.5; cursor: not-allowed; \}/);
  assert.doesNotMatch(rail, /cursor: wait/);
});

test('upload usa crop quadrado e mantém mudanças feitas nos efeitos enquanto a imagem é enviada', async () => {
  let resolveUpload, pending, renderer;
  const applied = [], busy = [];
  globalThis.__conditionUpload = props => {
    assert.equal(props.type, 'sistema');
    return new Promise(resolve => { resolveUpload = resolve; });
  };
  const props = { json: '{"efeitos":[]}', code: 'REGEN', readOnly: false, theme: 'dark', neon: 'on',
    onChange: json => applied.push(JSON.parse(json)), onUploadBusyChange: value => busy.push(value) };
  act(() => { renderer = create(React.createElement(api.ConditionImageField, props)); });
  assert.equal(renderer.root.findByType('test-uploader').props.cropPreset.aspectRatio, 1);
  assert.equal(renderer.root.findByType('test-uploader').props.cropPreset.shape, 'square');
  act(() => { pending = renderer.root.findByType('test-uploader').props.onImageCropped({ file: {} }); });
  assert.equal(busy.at(-1), true);
  act(() => renderer.update(React.createElement(api.ConditionImageField, { ...props,
    json: '{"efeitos":[{"valor":200}]}' })));
  await act(async () => { resolveUpload({ path: '/regen.png' }); await pending; });
  assert.deepEqual(applied.at(-1), { efeitos: [{ valor: 200 }], imagem: '/regen.png' });
  assert.equal(busy.at(-1), false);
  act(() => renderer.unmount());
  delete globalThis.__conditionUpload;
});

test('trocar de condição durante upload não coloca a imagem em outra condição', async () => {
  let resolveUpload, pending, renderer, changed = 0;
  globalThis.__conditionUpload = () => new Promise(resolve => { resolveUpload = resolve; });
  act(() => { renderer = create(React.createElement(api.ConditionImageField, { code: 'A', readOnly: false,
    theme: 'dark', neon: 'off', onChange() { changed++; } })); });
  act(() => { pending = renderer.root.findByType('test-uploader').props.onImageCropped({ file: {} }); });
  act(() => renderer.unmount());
  await act(async () => { resolveUpload({ path: '/a.png' }); await pending; });
  assert.equal(changed, 0);
  delete globalThis.__conditionUpload;
});
