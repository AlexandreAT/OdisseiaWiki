import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { build } from 'esbuild';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { renderToStaticMarkup } from 'react-dom/server';

const bundle = await build({ stdin: { contents: `
  export * from './src/content/gameConfigurationHelp';
  export * from './src/routes/Game/GameRunShell/RunHudDisclosure';
  export * from './src/routes/Game/GameRunShell/RunHudDisclosure.style';
  export * from './src/routes/Game/RunMapCanvas/RunMapCanvas';
  export { ServerStyleSheet } from 'styled-components';`, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic', mainFields: ['module', 'main'],
  external: ['react', 'react/jsx-runtime'],
  banner: { js: `import {createRequire} from 'node:module'; const require=createRequire(${JSON.stringify(import.meta.url)});` },
  plugins: [{ name: 'icons', setup(builder) {
    builder.onResolve({ filter: /^@mui\/icons-material\// }, () => ({ path: 'icon', namespace: 'icon' }));
    builder.onLoad({ filter: /.*/, namespace: 'icon' }, () => ({ loader: 'js',
      contents: `import {createElement} from 'react'; export default props=>createElement('svg', props);` }));
  } }],
});
const source = bundle.outputFiles[0].text.replace(/((?:from|import)\s*)(["'])(react(?:\/jsx-runtime)?)\2/g,
  (_, prefix, _quote, name) => prefix + JSON.stringify(import.meta.resolve(name)));
const api = await import(`data:text/javascript;base64,${Buffer.from(source + '\n//# sourceURL=game-configuration-ux.test-bundle.js').toString('base64')}`)
  .catch(error => { throw new Error(error.message.replace(/data:text\/javascript;base64,[A-Za-z0-9+/=]+/g, '[test bundle]')); });

test('ajudas curtas possuem IDs estáveis e são usadas pelos editores, sem ajuda em nomes comuns', () => {
  const catalogue = api.gameConfigurationHelp;
  assert.equal(new Set(Object.values(catalogue).map(help => help.id)).size, Object.keys(catalogue).length);
  for (const [key, entry] of Object.entries(catalogue)) {
    assert.equal(entry.id, `game.configuration.${key}`);
    assert.ok(entry.text.length > 20 && entry.text.length <= 240, key);
    assert.equal(entry.presentation.density, 'compact');
  }
  const folder = 'src/routes/Management/ManagementGame';
  const sources = readdirSync(folder).filter(name => name.endsWith('.tsx'))
    .map(name => readFileSync(`${folder}/${name}`, 'utf8'));
  sources.push(readFileSync(`${folder}/ManagementGameVendorOffers/ManagementGameVendorOffers.tsx`, 'utf8'));
  const combined = sources.join('\n');
  for (const [, key] of combined.matchAll(/help=\{help\.(\w+)\}/g)) assert.ok(catalogue[key], key);
  for (const key of Object.keys(catalogue)) assert.ok(combined.includes(`help={help.${key}}`), `Ajuda sem campo: ${key}`);
  assert.doesNotMatch(combined, /label="Nome(?: do jogo| da área| da rota)?"[^>]*help=/);
  assert.doesNotMatch(combined, /<GameAdminHint>\{option\.npcLocked/);
  assert.match(catalogue.offerCatalog.text, /Cada mercador tem seus próprios/);
});

test('recolher o header mantém os filhos montados, remove interação e permite reabrir', () => {
  let mounted = 0, unmounted = 0, renderer;
  function Resource() {
    React.useEffect(() => { mounted++; return () => unmounted++; }, []);
    return React.createElement('input', { defaultValue: 'Estado preservado' });
  }
  act(() => { renderer = create(React.createElement(api.RunHudDisclosure, { name: 'Tester', neon: true }, React.createElement(Resource))); });
  const toggle = () => renderer.root.findByType('button');
  const region = () => renderer.root.findAllByType('div').find(node => node.props.id === toggle().props['aria-controls']);
  assert.equal(toggle().props['aria-expanded'], true);
  const resource = renderer.root.findByType('input');
  act(() => toggle().props.onClick());
  assert.equal(toggle().props['aria-expanded'], false);
  assert.equal(region().props['aria-hidden'], true);
  assert.equal(region().props.inert, '');
  assert.equal(renderer.root.findByType('input'), resource);
  assert.equal(mounted, 1); assert.equal(unmounted, 0);
  act(() => toggle().props.onClick());
  assert.equal(toggle().props['aria-expanded'], true);
  assert.equal(region().props.inert, undefined);
  assert.equal(renderer.root.findByType('input'), resource);
  act(() => renderer.unmount());
  assert.equal(unmounted, 1);
});

test('header recolhido mantém navegação e identidade, mas oculta detalhes da jornada', () => {
  let renderer, abandoned = 0;
  const navigation = expanded => React.createElement('nav', null,
    React.createElement('a', { href: '/jogo' }, 'Jogo'),
    expanded && React.createElement('span', { 'data-run-meta': true }, 'Fase 2 · Em andamento · Modo 1 · Sistema #13'),
    React.createElement('button', { onClick: () => abandoned++ }, 'Abandonar run'));
  act(() => { renderer = create(React.createElement(api.RunHudDisclosure,
    { name: 'Tester', image: '/tester.png', neon: true, navigation }, React.createElement('input'))); });
  const toggle = () => renderer.root.findAllByType('button').find(node => 'aria-expanded' in node.props);
  const details = () => renderer.root.findAllByProps({ 'data-run-meta': true });
  const abandon = renderer.root.findByType('nav').findByType('button');
  assert.equal(details().length, 1);
  act(() => toggle().props.onClick());
  assert.equal(details().length, 0);
  assert.equal(renderer.root.findByType('a').props.href, '/jogo');
  assert.equal(renderer.root.findByType('img').props.src, '/tester.png');
  assert.ok(renderer.root.findAllByType('span').some(node => node.children.includes('Tester')));
  assert.equal(renderer.root.findByType('nav').findByType('button'), abandon);
  act(() => abandon.props.onClick());
  assert.equal(abandoned, 1);
  act(() => toggle().props.onClick());
  assert.equal(details().length, 1);
  act(() => renderer.unmount());
});

test('header mantém a barra de ações fora da área recolhível e respeita movimento reduzido', () => {
  const shell = readFileSync('src/routes/Game/GameRunShell/GameRunShell.tsx', 'utf8');
  assert.ok(shell.includes('<RunHudDisclosure name={current.nome}'));
  assert.ok(shell.indexOf('</RunHudDisclosure>') < shell.indexOf('<RunActionRail '));
  const styles = readFileSync('src/routes/Game/GameRunShell/RunHudDisclosure.style.ts', 'utf8');
  assert.match(styles, /grid-template-rows:/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(styles, /:focus-visible/);
  assert.match(shell, /navigation=\{expanded => <RunHudNavigation>/);
  assert.match(shell, /expanded && <RunHudMeta>/);
  const navigationStyles = readFileSync('src/routes/Game/GameRunShell/GameRunShell.style.ts', 'utf8');
  assert.match(navigationStyles, /RunHudNavigation = styled\(RunHudTopline\)/);
  assert.match(navigationStyles, /> button \{ grid-column: 3; white-space: nowrap; \}/);
  assert.match(navigationStyles, /> button \{ grid-column: 2; \}/);
});

test('cadeado do NPC usa emblema sci-fi discreto, neon opcional e some após resgatar', () => {
  const sheet = new api.ServerStyleSheet();
  try {
    const map = rescued => ({ schemaVersion: 5, nodes: [{ id: 'npc', name: 'Mercador', type: 'NPC', state: 'DISPONIVEL',
      fase: 1, layer: 1, position: 0, connections: [], seed: 1, revealed: true,
      payload: { npcCode: 'mercador', npcType: 'MERCADOR', npcLocked: true, npcRescued: rescued } }] });
    const render = (rescued, neon) => renderToStaticMarkup(sheet.collectStyles(React.createElement(api.RunMapCanvas, {
      map: map(rescued), config: { schemaVersion: 1 }, neon, active: true, acting: false, onSelect() {},
    })));
    assert.match(render(false, true), /npc-lock-frame/);
    assert.match(render(false, false), /npc-lock-frame/);
    assert.doesNotMatch(render(true, true), /class="npc-lock"/);
    const css = sheet.getStyleTags();
    assert.match(css, /npc-lock-icon/);
    assert.match(css, /prefers-reduced-motion/);
    assert.match(css, /drop-shadow/);
    const source = readFileSync('src/routes/Game/RunMapCanvas/RunMapCanvas.tsx', 'utf8');
    const badge = source.slice(source.indexOf('<g className="npc-lock"'), source.indexOf('</g>}', source.indexOf('<g className="npc-lock"')));
    assert.doesNotMatch(badge, /<circle/);
  } finally { sheet.seal(); }
});
