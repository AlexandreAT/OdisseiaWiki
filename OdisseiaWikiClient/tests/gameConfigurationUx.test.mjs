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
  export * from './src/routes/Game/GameRunShell/RunProgressSummary';
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

test('preço do conserto ocupa a quarta célula ao lado de melhorias por arma, com grade responsiva padrão', () => {
  const editor = readFileSync('src/routes/Management/ManagementGame/ManagementGameNpcServices.tsx', 'utf8');
  const fields = [...editor.matchAll(/<GameAdminFields>([\s\S]*?)<\/GameAdminFields>/g)]
    .map(match => match[1]).find(group => group.includes('label="Melhorias por arma"'));
  assert.ok(fields);
  assert.match(fields, /label="Melhorias por arma"[\s\S]*label="Preço do conserto por 10%"/);
  const styles = readFileSync('src/routes/Management/ManagementGame/ManagementGame.style.ts', 'utf8');
  const grid = styles.match(/export const GameAdminFields = styled\.div`([\s\S]*?)`;/)[1];
  assert.match(grid, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(grid, /@media \(max-width: 480px\) \{ grid-template-columns: 1fr/);
});

test('imagens de nós respeitam recorte circular/arredondado e cada mapa mantém máscaras independentes', () => {
  const map = { schemaVersion: 5, nodes: [
    { id: 'base', name: 'Base', type: 'BASE', image: '/base.png', layer: 0, position: 0, fase: 1,
      state: 'CONCLUIDO', connections: ['npc'], revealed: true },
    { id: 'npc', name: 'Inimigo', type: 'COMBATE', image: '/npc.png', layer: 1, position: 0, fase: 1,
      state: 'DISPONIVEL', connections: [], revealed: true },
  ] };
  let view;
  try {
    const props = { map, config: {}, neon: true, active: true, acting: false, onSelect() {} };
    act(() => { view = create(React.createElement('div', null,
      React.createElement(api.RunMapCanvas, props), React.createElement(api.RunMapCanvas, props))); });
    const images = view.root.findAllByType('image'), clips = view.root.findAllByType('clipPath');
    assert.equal(images.length, 4); assert.equal(clips.length, 4);
    assert.equal(new Set(clips.map(node => node.props.id)).size, 4, 'IDs isolados inclusive para retratos repetidos');
    for (const image of images) {
      const id = image.props.clipPath.match(/^url\(#(.+)\)$/)[1];
      const clip = clips.find(node => node.props.id === id);
      assert.ok(clip);
      if (image.props.href.endsWith('base.png')) {
        const rect = clip.findByType('rect');
        for (const key of ['x', 'y', 'width', 'height']) assert.equal(rect.props[key], image.props[key]);
        assert.equal(rect.props.rx, '6');
      } else assert.equal(clip.findAllByType('circle').length, 1);
    }
  } finally { if (view) act(() => view.unmount()); }
});

test('laser se divide em ramos sincronizados e volta a se juntar na origem sem feixes soltos', () => {
  for (const type of ['COMBATE', 'BASE', 'INICIO']) for (const targetType of ['COMBATE', 'BASE']) for (const count of [1, 2, 3, 4]) {
    const targets = Array.from({ length: count }, (_, index) => ({ id: `target-${index}`, name: 'Alvo', type: targetType,
      layer: 1, position: index, fase: 1, state: 'DISPONIVEL', connections: [], revealed: true }));
    const map = { schemaVersion: 5, nodes: [{ id: 'source', name: 'Origem', type, layer: 0, position: 0, fase: 1,
      state: 'CONCLUIDO', connections: targets.map(node => node.id), revealed: true }, ...targets] };
    let view;
    try {
      act(() => { view = create(React.createElement(api.RunMapCanvas, { map, config: {}, neon: true, active: true, acting: false, onSelect() {} })); });
      const rails = view.root.findAllByProps({ className: 'map-edge' });
      const lights = view.root.findAllByProps({ className: 'route-light' });
      assert.equal(lights.length, count, 'um ramo por opção, todos partindo do mesmo ponto');
      const glow = view.root.findAllByProps({ className: 'route-light-blur' });
      const branches = view.root.findAllByProps({ className: 'route-branch' });
      assert.equal(glow.length, count);
      const commonDistances = [];
      for (const [index, rail] of rails.entries()) {
        const route = lights[index].props.d;
        assert.equal((route.match(/M /g) ?? []).length, 1, 'subpaths reiniciariam o padrão e criariam feixes soltos');
        const [, startX, startY] = route.match(/^M (\S+) (\S+)/);
        assert.ok(route.endsWith(`L ${startX} ${startY}`), 'todos os ramos devem terminar exatamente na origem');
        assert.equal((route.match(/C /g) ?? []).length, 2, 'cada ligação precisa ter ida e volta');
        const [sx, sy, c1x, c1y, c2x, c2y, ex, ey] = rail.props.d.match(/-?\d+(?:\.\d+)?/g);
        assert.ok(route.includes(`L ${sx} ${sy} C ${c1x} ${c1y} ${c2x} ${c2y} ${ex} ${ey}`));
        assert.ok(route.includes(`L ${ex} ${ey} C ${c2x} ${c2y} ${c1x} ${c1y} ${sx} ${sy}`));
        assert.ok(route.includes(targetType === 'COMBATE' ? `L ${ex} 163 A ` : `L ${ex} 168 H `),
          'o contorno de cada nó deve fazer parte do mesmo percurso');
        assert.equal(glow[index].props.d, route, 'brilho e núcleo percorrem o mesmo caminho');
        assert.equal(glow[index].props.mask, lights[index].props.mask);
        assert.equal(glow[index].parent.props.className, 'route-light-halo');
        assert.equal(glow[index].parent.props.mask, undefined, 'halo expande depois do recorte, sem cortar o brilho');
        const style = branches[index].props.style;
        const [dash, gap] = style['--route-dash'].split(' ').map(Number);
        assert.equal(dash + gap, 100, 'um único segmento de luz por ramo');
        const source = style['--route-source-end'], target = style['--route-target-start'], back = style['--route-target-end'];
        assert.ok(100 > source && source > target && target > back && back > 0);
        const length = 2400 / dash;
        commonDistances.push((100 - source) / 100 * length);
        assert.ok(Math.abs((source - target) - back) < 1e-10, 'volta tem o mesmo comprimento da ida');
      }
      assert.ok(commonDistances.every(distance => Math.abs(distance - commonDistances[0]) < 1e-10),
        'na origem os ramos percorrem juntos exatamente o mesmo contorno, mesmo com trilhos de comprimentos diferentes');
      const cssSheet = new api.ServerStyleSheet();
      try {
        renderToStaticMarkup(cssSheet.collectStyles(React.createElement(api.RunMapCanvas, { map, config: {}, neon: true, active: true, acting: false, onSelect() {} })));
        const css = cssSheet.getStyleTags();
        assert.match(css, /25%\{stroke-dashoffset:var\(--route-source-end\)/);
        assert.match(css, /45%\{stroke-dashoffset:var\(--route-target-start\)/);
        assert.match(css, /75%\{stroke-dashoffset:var\(--route-target-end\)/);
        assert.match(css, /6\.4s linear infinite/);
        assert.match(css, /\.route-light-halo\{filter:blur\(5px\)/);
        assert.match(css, /\.route-light\{[^}]*stroke-width:3;/, 'núcleo mantém a espessura anterior');
        assert.doesNotMatch(css, /animation-delay:/, 'nenhuma opção pode começar em outro instante');
      } finally { cssSheet.seal(); }
      assert.equal(view.root.findAllByType('mask').length, 1, 'as lacunas dos nomes são ocultadas sem interromper o percurso');
      act(() => view.root.findAll(node => node.type === 'g' && node.props['data-node-id'] === targets[0].id)[0].props.onMouseEnter());
      assert.deepEqual(view.root.findAllByProps({ className: 'route-light' }), lights, 'hover não remonta/reinicia os lasers');
      act(() => view.update(React.createElement(api.RunMapCanvas, { map, config: {}, neon: false, active: true, acting: false, onSelect() {} })));
      assert.equal(view.root.findAllByProps({ className: 'route-light' }).length, 0);
      act(() => view.update(React.createElement(api.RunMapCanvas, { map, config: {}, neon: true, active: false, acting: false, onSelect() {} })));
      assert.equal(view.root.findAllByProps({ className: 'route-light' }).length, 0);
    } finally { if (view) act(() => view.unmount()); }
  }
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
  assert.match(styles, /:root\[data-motion='reduced'\]/);
  assert.match(styles, /:focus-visible/);
  assert.match(shell, /navigation=\{expanded => <RunHudNavigation>/);
  assert.match(shell, /expanded && <RunHudMeta>/);
  const navigationStyles = readFileSync('src/routes/Game/GameRunShell/GameRunShell.style.ts', 'utf8');
  assert.match(navigationStyles, /RunHudNavigation = styled\(RunHudTopline\)/);
  assert.match(navigationStyles, /> button \{ grid-column: 3; white-space: nowrap; \}/);
  assert.match(navigationStyles, /> button \{ grid-column: 2; \}/);
});

test('header lembra a escolha entre montagens e permite salvar a reabertura', () => {
  const previousStorage = globalThis.localStorage;
  const saved = new Map();
  globalThis.localStorage = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) };
  let renderer;
  const mount = name => act(() => { renderer = create(React.createElement(api.RunHudDisclosure, { name, neon: true }, 'Recursos')); });
  const toggle = () => renderer.root.findByType('button');
  try {
    mount('Tester');
    assert.equal(toggle().props['aria-expanded'], true);
    act(() => toggle().props.onClick());
    assert.equal(saved.get('game-run:header-expanded'), 'false');
    act(() => renderer.unmount());
    mount('Outro personagem');
    assert.equal(toggle().props['aria-expanded'], false);
    assert.ok(renderer.root.findAllByType('div').some(node => node.props.inert === ''));
    act(() => toggle().props.onClick());
    assert.equal(saved.get('game-run:header-expanded'), 'true');
    act(() => renderer.unmount());
    mount('Tester');
    assert.equal(toggle().props['aria-expanded'], true);
  } finally {
    act(() => renderer?.unmount());
    if (previousStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = previousStorage;
  }
});

test('nível e XP mantêm uma única linha e o mesmo elemento ao ganhar XP repetidamente', () => {
  let renderer, pulses = 0, cancelled = 0, upgraded = 0;
  const props = { level: 1, xp: 0, pendingPoints: 0, pulseSequence: 0, onUpgrade: () => upgraded++ };
  act(() => { renderer = create(React.createElement(api.RunProgressSummary, props), { createNodeMock: element =>
    element.props['data-run-progress-value'] ? { animate() { pulses++; return { cancel() { cancelled++; } }; } } : null,
  }); });
  const label = renderer.root.findByType('p');
  const value = renderer.root.findAllByType('span').find(node => 'data-run-progress-value' in node.props);
  assert.equal(pulses, 0);
  for (let sequence = 1; sequence <= 3; sequence++) {
    act(() => renderer.update(React.createElement(api.RunProgressSummary,
      { ...props, level: 2, xp: sequence * 10, pendingPoints: 1, pulseSequence: sequence })));
    assert.equal(renderer.root.findByType('p'), label);
    const values = renderer.root.findAllByType('span').filter(node => 'data-run-progress-value' in node.props);
    assert.equal(values.length, 1);
    assert.equal(values[0], value);
    assert.equal(value.children.join(''), `Nível 2 · ${sequence * 10} XP`);
    assert.equal(pulses, sequence);
  }
  act(() => renderer.root.findByType('button').props.onClick());
  assert.equal(upgraded, 1);
  act(() => renderer.unmount());
  assert.equal(cancelled, 3);
});

test('preferência corrompida ou armazenamento bloqueado não impede recolher o header', () => {
  const previousStorage = globalThis.localStorage;
  try {
    for (const value of ['{"invalido":true}', '"false"', 'json quebrado']) {
      globalThis.localStorage = { getItem: () => value, setItem() { throw Error('quota'); } };
      let renderer;
      act(() => { renderer = create(React.createElement(api.RunHudDisclosure, { name: 'Tester', neon: false }, 'Recursos')); });
      assert.equal(renderer.root.findByType('button').props['aria-expanded'], true);
      act(() => renderer.root.findByType('button').props.onClick());
      assert.equal(renderer.root.findByType('button').props['aria-expanded'], false);
      act(() => renderer.unmount());
    }
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = previousStorage;
  }
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
    assert.match(css, /:root\[data-motion='reduced'\]/);
    assert.match(css, /drop-shadow/);
    const source = readFileSync('src/routes/Game/RunMapCanvas/RunMapCanvas.tsx', 'utf8');
    const badge = source.slice(source.indexOf('<g className="npc-lock"'), source.indexOf('</g>}', source.indexOf('<g className="npc-lock"')));
    assert.doesNotMatch(badge, /<circle/);
  } finally { sheet.seal(); }
});
