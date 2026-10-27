import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { renderToStaticMarkup } from 'react-dom/server';

const bundle = await build({ stdin: { contents: `
  export * from './src/components/Generic/HolographicPreview';
  export * from './src/components/Generic/HolographicPreview/HolographicPreview.style';
  export * from './src/components/Generic/HolographicPreview/hologramGeometry';
  export {ServerStyleSheet} from 'styled-components';
  export {setMotionPreference} from './src/utils/motionPreference';`, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'cjs', platform: 'node', jsx: 'automatic', mainFields: ['module', 'main'],
  external: ['react', 'react/jsx-runtime'], loader: { '.svg': 'text' },
  plugins: [{ name: 'surfaces', setup(builder) {
    builder.onResolve({ filter: /^@mui\/icons-material\// }, () => ({ path: 'icon', namespace: 'stub' }));
    builder.onResolve({ filter: /^react-dom$/ }, () => ({ path: 'portal', namespace: 'stub' }));
    builder.onLoad({ filter: /.*/, namespace: 'stub' }, args => ({ loader: 'js', contents: args.path === 'portal'
      ? 'export const createPortal=(children,container)=>{globalThis.__hologramPortal=container; return children;};'
      : `import React from 'react'; export default props=>React.createElement('svg',props);` }));
  } }],
});
const module = { exports: {} };
new Function('require', 'module', 'exports', bundle.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
const api = module.exports;
const original = Object.fromEntries(['window', 'document', 'ResizeObserver', 'requestAnimationFrame', 'cancelAnimationFrame'].map(key => [key, globalThis[key]]));
let view, listeners, frames, anchor, closeFocus, closeNode, descriptionNode, contentNode, observed, disconnected, notices;
beforeEach(() => {
  listeners = new Map(); frames = new Map(); closeFocus = 0; observed = 0; disconnected = 0; notices = [];
  anchor = { isConnected: true, left: 100, top: 80, focusCount: 0,
    focus() { this.focusCount++; document.activeElement = this; }, getBoundingClientRect() { return { left: this.left, top: this.top, width: 28, height: 28 }; } };
  closeNode = { focus() { closeFocus++; document.activeElement = this; } };
  descriptionNode = { focus() { document.activeElement = this; } };
  contentNode = { focus() { document.activeElement = this; } };
  globalThis.window = { innerWidth: 1024, innerHeight: 768,
    addEventListener(type, fn) { listeners.set(type, fn); }, removeEventListener(type) { listeners.delete(type); },
    localStorage: { getItem() { return null; }, setItem() {} } };
  globalThis.document = { body: {}, documentElement: { dataset: {} } };
  globalThis.ResizeObserver = class { constructor(fn) { this.fn = fn; } observe() { observed++; } disconnect() { disconnected++; } };
  globalThis.requestAnimationFrame = fn => { const id = frames.size + 1; frames.set(id, fn); return id; };
  globalThis.cancelAnimationFrame = id => frames.delete(id);
  api.setMotionPreference('full');
});
afterEach(() => {
  if (view) act(() => view.unmount()); view = null;
  delete globalThis.__hologramPortal;
  for (const [key, value] of Object.entries(original)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; }
});
const tree = (providerProps = {}, triggerProps = {}) => React.createElement(api.HolographicPreviewProvider,
  { neon: true, onOpenChange: value => notices.push(value), ...providerProps },
  React.createElement(api.HolographicPreviewTrigger, { media: { name: 'Kakurui', src: '/kakurui.png' }, ...triggerProps }, 'Imagem'));
const mount = (providerProps, triggerProps) => act(() => { view = create(tree(providerProps, triggerProps),
  { createNodeMock: element => element.props['aria-label'] === 'Ampliar imagem de Kakurui' ? anchor
    : ['Fechar imagem','Fechar informações'].includes(element.props['aria-label']) ? closeNode
      : element.type === 'p' && element.props.id?.endsWith('-description') ? descriptionNode
        : element.props.role === 'region' ? contentNode : null }); });
const trigger = () => view.root.findByProps({ 'aria-label': 'Ampliar imagem de Kakurui' });
const host = role => view.root.findAll(node => typeof node.type === 'string' && node.props.role === role);
const flushFrames = () => act(() => { const queued = [...frames.values()]; frames.clear(); queued.forEach(fn => fn()); });
const delay = ms => act(async () => { await new Promise(resolve => setTimeout(resolve, ms)); });

test('hover cria projeção central com imagem e linha, permite chegar ao painel e fecha ao sair', async () => {
  mount();
  act(() => trigger().props.onMouseEnter({ currentTarget: anchor }));
  assert.equal(host('tooltip').length, 1);
  assert.equal(host('tooltip')[0].props.style.left, 332);
  assert.equal(host('tooltip')[0].props.style.width, host('tooltip')[0].props.style.height);
  assert.equal(view.root.findByType('img').props.src, '/kakurui.png');
  assert.ok(view.root.findAllByType('path').some(node => node.props.d?.startsWith('M 114 94 L')));
  act(() => trigger().props.onMouseLeave({}));
  act(() => host('tooltip')[0].props.onMouseEnter());
  await delay(400);
  assert.equal(host('tooltip').length, 1);
  act(() => host('tooltip')[0].props.onMouseLeave());
  // Flush the hover timer before waiting for the exit; CPU contention must not merge these phases.
  await delay(400);
  await delay(180);
  assert.equal(host('tooltip').length, 0);
  assert.deepEqual(notices, [true, false]);
});

test('clique fixa, deixa o foco no fechamento e Escape não fecha o modal de combate', async () => {
  mount();
  act(() => trigger().props.onFocus({ currentTarget: anchor }));
  act(() => trigger().props.onClick({ currentTarget: anchor }));
  assert.equal(host('dialog').length, 1); assert.equal(host('dialog')[0].props['aria-modal'], true);
  assert.equal(closeFocus, 1);
  act(() => trigger().props.onBlur({}));
  await delay(400);
  assert.equal(host('dialog').length, 1);
  let prevented = 0, stopped = 0;
  act(() => listeners.get('keydown')({ key: 'Escape', preventDefault() { prevented++; }, stopPropagation() { stopped++; } }));
  await delay(180);
  assert.equal(host('dialog').length, 0); assert.equal(anchor.focusCount, 1);
  assert.equal(prevented, 1); assert.equal(stopped, 1); assert.deepEqual(notices, [true, false]);
});

test('rolagem e resize recalculam a linha; origem removida fecha e libera observadores', async () => {
  mount();
  act(() => trigger().props.onMouseEnter({ currentTarget: anchor }));
  anchor.left = 180; window.innerWidth = 800;
  act(() => { listeners.get('scroll')(); listeners.get('resize')(); });
  assert.equal(frames.size, 1, 'um único frame para eventos simultâneos');
  flushFrames();
  assert.equal(host('tooltip')[0].props.style.left, 220);
  assert.ok(view.root.findAllByType('path').some(node => node.props.d?.startsWith('M 194 94 L')));
  anchor.isConnected = false;
  act(() => listeners.get('scroll')()); flushFrames(); await delay(180);
  assert.equal(host('tooltip').length, 0); assert.ok(disconnected >= 1);
  assert.equal(listeners.has('scroll'), false); assert.equal(listeners.has('resize'), false);
});

test('movimento reduzido mantém a prévia acessível e imagem quebrada usa fallback', async () => {
  api.setMotionPreference('reduced'); mount();
  act(() => trigger().props.onClick({ currentTarget: anchor }));
  assert.equal(document.documentElement.dataset.motion, 'reduced');
  assert.ok(view.root.findAll(node => node.props.$reduced === true).length > 0);
  act(() => view.root.findByType('img').props.onError());
  assert.equal(view.root.findAllByType('img').length, 0);
  assert.equal(host('dialog').length, 1);
  act(() => view.root.findByProps({ 'aria-label': 'Fechar imagem' }).props.onClick());
  await delay(180);
  assert.equal(host('dialog').length, 0);
});

test('geometria mantém quadrado dentro de telas pequenas e fecha o contorno pela borda', () => {
  for (const [width, height] of [[360, 640], [1024, 768], [320, 230]]) {
    for (const position of [{ left: 0, top: 0 }, { left: width - 28, top: height - 28 }]) {
      const value = api.hologramGeometry({ ...position, width: 28, height: 28 }, width, height);
      assert.ok(value.left >= 0 && value.top >= 0);
      assert.ok(value.left + value.size <= width && value.top + value.size <= height);
      const numbers = value.frame.match(/-?\d+(?:\.\d+)?/g).map(Number);
      assert.deepEqual(numbers.slice(0, 2), numbers.slice(-2));
    }
  }
});

test('prévia dentro de modal preserva o escopo de foco e pode ser reaberta durante a saída', async () => {
  const modal = { role: 'dialog' }; anchor.closest = () => modal;
  mount();
  act(() => trigger().props.onClick({ currentTarget: anchor }));
  assert.equal(globalThis.__hologramPortal, modal, 'portal continua dentro do modal para não disputar o foco com o MUI');
  act(() => view.root.findByProps({ 'aria-label': 'Fechar imagem' }).props.onClick());
  await act(async () => { await Promise.resolve(); });
  act(() => trigger().props.onMouseEnter({ currentTarget: anchor }));
  await delay(200);
  assert.equal(host('tooltip').length, 1);
  assert.deepEqual(notices, [true, false, true]);
});

test('API padrão mantém quadrado, cores, fonte, neon e animações sem descrição ou configurações novas', () => {
  mount();
  act(() => trigger().props.onMouseEnter({ currentTarget: anchor }));
  const panel = view.root.findByType(api.ProjectionPanel), projection = view.root.findByType(api.Projection);
  assert.equal(panel.props.style.width, 360); assert.equal(panel.props.style.height, 360);
  assert.equal(panel.props.neon, true); assert.equal(panel.props.color, undefined);
  assert.equal(projection.props.style, undefined);
  assert.equal(panel.props.style.background, undefined); assert.equal(panel.props.style.color, undefined);
  assert.equal(panel.props.$hasDescription, false);
  assert.equal(view.root.findAllByType(api.ProjectionDescription).length, 0);
  assert.equal(panel.props['aria-describedby'], undefined);
  const sheet = new api.ServerStyleSheet();
  try {
    renderToStaticMarkup(sheet.collectStyles(React.createElement(api.ProjectionPanel,
      { neon: true, $reduced: false, $hasDescription: false }, 'Conteúdo')));
    const css = sheet.getStyleTags();
    assert.match(css, /grid-template-rows:auto minmax\(0,\s*1fr\)/);
    assert.match(css, /gap:12px/);
    assert.match(css, /rgba\(3,\s*25,\s*43,\s*\.99\)/);
    assert.match(css, /DO Futuristic/);
    assert.match(css, /\.32s \.16s ease-out both/);
  } finally { sheet.seal(); }
});

test('descrição, paleta, fundo, tamanho e ajuste da imagem são configuráveis sem afetar a geometria responsiva', () => {
  const description = '<script>texto literal</script>\nDescrição opcional com várias linhas.';
  mount({ color: '#ffb400', background: '#071120', textColor: '#eeeeee', size: 460, imageFit: 'cover' },
    { media: { name: 'Kakurui', src: '/kakurui.png', description } });
  act(() => trigger().props.onClick({ currentTarget: anchor }));
  const panel = view.root.findByType(api.ProjectionPanel), projection = view.root.findByType(api.Projection);
  assert.equal(panel.props.style.width, 460); assert.equal(panel.props.style.left, 282);
  assert.equal(panel.props.style.background, '#071120'); assert.equal(panel.props.style.color, '#eeeeee');
  assert.equal(panel.props.color, '#ffb400'); assert.equal(panel.props.neon, true);
  assert.equal(projection.props.style['--hologram-accent'], '#ffb400');
  assert.ok(projection.props.style['--hologram-scan'].includes('#ffb400'));
  assert.ok(projection.props.style['--hologram-image-glow'].includes('#ffb400'));
  assert.equal(view.root.findByType(api.ProjectionImage).props.style['--hologram-image-fit'], 'cover');
  const details = view.root.findByType(api.ProjectionDescription);
  assert.equal(details.props.children, description); assert.equal(details.props.tabIndex, 0);
  assert.equal(panel.props['aria-describedby'], details.props.id);
  assert.ok(!renderToStaticMarkup(React.createElement(api.ProjectionDescription, null, description)).includes('<script>'));
  window.innerWidth = 320; window.innerHeight = 540;
  act(() => listeners.get('resize')()); flushFrames();
  assert.equal(view.root.findByType(api.ProjectionPanel).props.style.width, 288);
});

test('configuração por imagem sobrescreve a tela, incluindo neon desligado, sem vazar para a próxima imagem', () => {
  const options = { color: '#ff00dd', neon: true, size: 480 };
  const override = { color: 'var(--clearneonGreen)', neon: false, size: 220 };
  mount(options, { appearance: override });
  act(() => trigger().props.onMouseEnter({ currentTarget: anchor }));
  let panel = view.root.findByType(api.ProjectionPanel);
  assert.equal(panel.props.neon, false); assert.equal(panel.props.color, override.color); assert.equal(panel.props.style.width, 220);
  assert.equal(view.root.findByType(api.Projection).props.$neon, false);
  act(() => view.update(tree(options)));
  act(() => trigger().props.onMouseEnter({ currentTarget: anchor }));
  panel = view.root.findByType(api.ProjectionPanel);
  assert.equal(panel.props.neon, true); assert.equal(panel.props.color, options.color); assert.equal(panel.props.style.width, 480);
  act(() => view.update(tree({ ...options, color: '#abc', size: 200 })));
  panel = view.root.findByType(api.ProjectionPanel);
  assert.equal(panel.props.style.width, 200); assert.equal(panel.props.color, '#abc');
  assert.deepEqual(notices, [true]);
});

test('trigger aceita ref, estilos, eventos e modo somente clique, respeitando disabled e preventDefault', () => {
  const ref = React.createRef(); let hovered = 0, clicked = 0;
  const props = { ref, activation: 'click', disabled: true, className: 'miniatura', style: { width: 32 },
    'data-testid': 'preview-source', onMouseEnter() { hovered++; }, onClick(event) { clicked++; event.preventDefault(); } };
  mount({}, props);
  assert.equal(ref.current, anchor); assert.equal(trigger().props.className, 'miniatura');
  assert.equal(trigger().props.style.width, 32); assert.equal(trigger().props['data-testid'], 'preview-source');
  act(() => trigger().props.onMouseEnter({ currentTarget: anchor }));
  act(() => trigger().props.onClick({ currentTarget: anchor, preventDefault() {} }));
  assert.equal(host('dialog').length + host('tooltip').length, 0);
  act(() => view.update(tree({}, { ...props, disabled: false })));
  act(() => trigger().props.onMouseEnter({ currentTarget: anchor }));
  act(() => trigger().props.onFocus({ currentTarget: anchor }));
  assert.equal(host('tooltip').length, 0);
  const event = { currentTarget: anchor, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
  act(() => trigger().props.onClick(event)); assert.equal(host('dialog').length, 0);
  assert.equal(hovered, 2); assert.equal(clicked, 2);
  act(() => view.update(tree({}, { ...props, disabled: false, onClick() { clicked++; } })));
  act(() => trigger().props.onClick({ currentTarget: anchor }));
  assert.equal(host('dialog').length, 1); assert.equal(clicked, 3);
});

test('componente isolado funciona sem provider externo e libera callback e timers ao desmontar', async () => {
  const ref = React.createRef();
  act(() => { view = create(React.createElement(api.HolographicPreview, {
    ref, media: { name: 'Kakurui', src: '/kakurui.png' }, appearance: { color: '#ff00dd', neon: false },
    onOpenChange: value => notices.push(value), hoverCloseDelay: 5,
  }, 'Imagem'), { createNodeMock: element => element.props['aria-label'] === 'Ampliar imagem de Kakurui' ? anchor : null }); });
  assert.equal(ref.current, anchor);
  act(() => trigger().props.onMouseEnter({ currentTarget: anchor }));
  assert.equal(view.root.findByType(api.ProjectionPanel).props.color, '#ff00dd');
  act(() => trigger().props.onMouseLeave({})); await delay(200);
  assert.equal(host('tooltip').length, 0);
  act(() => trigger().props.onMouseEnter({ currentTarget: anchor }));
  act(() => trigger().props.onMouseLeave({}));
  act(() => view.unmount()); view = null;
  await delay(200);
  assert.equal(ref.current, null); assert.deepEqual(notices, [true, false, true, false]);
});

test('tamanhos inválidos usam o padrão e descrições longas permitem rolagem por teclado no modal', () => {
  for (const size of [undefined, NaN, Infinity, -1, 0]) assert.equal(api.hologramGeometry(
    { left: 0, top: 0, width: 28, height: 28 }, 1024, 768, size).size, 360);
  mount({}, { media: { name: 'Kakurui', description: 'Descrição longa. '.repeat(100) } });
  act(() => trigger().props.onClick({ currentTarget: anchor }));
  assert.equal(view.root.findByType(api.ProjectionDescription).props.tabIndex, 0);
  assert.equal(document.activeElement, closeNode);
  const tab = shiftKey => act(() => listeners.get('keydown')({ key: 'Tab', shiftKey, preventDefault() {} }));
  tab(false); assert.equal(document.activeElement, descriptionNode);
  tab(false); assert.equal(document.activeElement, closeNode);
  tab(true); assert.equal(document.activeElement, descriptionNode);
  tab(true); assert.equal(document.activeElement, closeNode);
  const sheet = new api.ServerStyleSheet();
  try {
    renderToStaticMarkup(sheet.collectStyles(React.createElement(api.ProjectionDescription, null, 'Texto')));
    const css = sheet.getStyleTags(); assert.match(css, /overflow-y:auto/); assert.match(css, /max-height:6em/);
  } finally { sheet.seal(); }
});

test('lista compartilha uma única projeção e troca imagem, descrição e paleta sem contaminar os outros gatilhos', () => {
  const other = { ...anchor, left: 400 };
  act(() => { view = create(React.createElement(api.HolographicPreviewProvider,
    { neon: true, color: '#00bbff', onOpenChange: value => notices.push(value) },
    React.createElement(api.HolographicPreviewTrigger, { media: { name: 'Kakurui', src: '/kakurui.png' } }, 'Primeira'),
    React.createElement(api.HolographicPreviewTrigger, { media: { name: 'Poção', icon: React.createElement('span', { 'data-fallback': true }, 'Ícone'), description: 'Recupera vida.' },
      appearance: { color: '#00ff00', neon: false } }, 'Segunda')),
  { createNodeMock: element => element.props['aria-label'] === 'Ampliar imagem de Kakurui' ? anchor
    : element.props['aria-label'] === 'Ampliar imagem de Poção' ? other : null }); });
  const second = () => view.root.findByProps({ 'aria-label': 'Ampliar imagem de Poção' });
  act(() => trigger().props.onMouseEnter({ currentTarget: anchor }));
  assert.equal(view.root.findByType('img').props.src, '/kakurui.png');
  act(() => second().props.onMouseEnter({ currentTarget: other }));
  assert.equal(host('tooltip').length, 1);
  assert.equal(trigger().props['aria-expanded'], false); assert.equal(second().props['aria-expanded'], true);
  assert.equal(view.root.findByType(api.ProjectionPanel).props.color, '#00ff00');
  assert.equal(view.root.findByType(api.ProjectionPanel).props.neon, false);
  assert.equal(view.root.findByType(api.ProjectionDescription).props.children, 'Recupera vida.');
  assert.equal(view.root.findAllByType('img').length, 0);
  assert.equal(view.root.findAllByProps({ 'data-fallback': true }).length, 1);
  act(() => trigger().props.onMouseEnter({ currentTarget: anchor }));
  assert.equal(host('tooltip').length, 1);
  assert.equal(view.root.findByType(api.ProjectionPanel).props.color, '#00bbff');
  assert.equal(view.root.findByType(api.ProjectionPanel).props.neon, true);
  assert.equal(view.root.findAllByType(api.ProjectionDescription).length, 0);
  assert.equal(view.root.findByType('img').props.src, '/kakurui.png');
  assert.deepEqual(notices, [true]);
});

test('conteúdo informativo reutiliza o holograma sem imagem, com scroll e foco na região da lista', async () => {
  mount({neon:false}, {media:{name:'Kakurui',content:React.createElement('ul',null,
    React.createElement('li',null,'Braço +3 resistência'),React.createElement('li',null,'Colete −2 resistência'))}});
  act(()=>trigger().props.onMouseEnter({currentTarget:anchor}));
  assert.equal(host('tooltip').length,1);
  assert.equal(view.root.findAllByType(api.ProjectionImage).length,0);
  assert.equal(view.root.findAllByType('li').length,2);
  assert.ok(view.root.findAllByType('path').some(node=>node.props.d?.startsWith('M 114 94 L')));
  act(()=>trigger().props.onClick({currentTarget:anchor}));
  assert.equal(host('dialog').length,1); assert.equal(document.activeElement,closeNode);
  act(()=>listeners.get('keydown')({key:'Tab',preventDefault(){}}));
  assert.equal(document.activeElement,contentNode);
  act(()=>listeners.get('keydown')({key:'Tab',shiftKey:true,preventDefault(){}}));
  assert.equal(document.activeElement,closeNode);
  const sheet=new api.ServerStyleSheet();
  try {
    renderToStaticMarkup(sheet.collectStyles(React.createElement(api.ProjectionContent,null,'Lista')));
    assert.match(sheet.getStyleTags(),/overflow:auto/); assert.match(sheet.getStyleTags(),/min-height:0/);
  } finally {sheet.seal();}
  act(()=>view.root.findByProps({'aria-label':'Fechar informações'}).props.onClick());
  await delay(180); assert.equal(host('dialog').length,0); assert.equal(anchor.focusCount,1);
});
