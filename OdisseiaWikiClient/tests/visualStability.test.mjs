import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({
  stdin: {
    contents: `export * from './src/hooks/useScrollReveal/useScrollReveal.utils';
      export * from './src/utils/motionPreference';
      export * from './src/hooks/useDecodedImage/imageLoader';`,
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const { observeScrollReveal, getDecodedImage, loadDecodedImage, watchDecodedImage, setMotionPreference } =
  await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);

// Doubles das APIs usadas pelos helpers; não substituem a validação visual no navegador.
const originalGlobals = Object.fromEntries(['window', 'document', 'IntersectionObserver', 'ResizeObserver', 'Image'].map((key) => [key, globalThis[key]]));
let observers;
let images;
let motion;
let cleanups;
let resizes;
beforeEach(() => {
  cleanups = [];
  resizes = [];
  observers = [];
  images = [];
  const listeners = new Set();
  motion = {
    matches: false,
    addEventListener: (_, callback) => listeners.add(callback),
    removeEventListener: (_, callback) => listeners.delete(callback),
    reduce: () => { motion.matches = true; [...listeners].forEach((callback) => callback()); },
  };
  globalThis.window = { innerHeight: 800, matchMedia: () => motion,
    addEventListener() {}, removeEventListener() {} };
  globalThis.document = { documentElement: { dataset: {} } };
  setMotionPreference('full');
  globalThis.ResizeObserver = class {
    constructor(callback) { this.callback = callback; resizes.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  };
  globalThis.IntersectionObserver = class {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      this.disconnected = false;
      observers.push(this);
    }
    observe(element) { this.element = element; }
    disconnect() { this.disconnected = true; }
    emit(isIntersecting, intersectionRatio) { this.callback([{ isIntersecting, intersectionRatio }]); }
  };
  globalThis.Image = class {
    constructor() {
      this.decode = () => Promise.resolve();
      images.push(this);
    }
  };
});
afterEach(() => {
  cleanups.forEach(cleanup => cleanup?.());
  for (const [key, value] of Object.entries(originalGlobals)) {
    if (value === undefined) delete globalThis[key];
    else globalThis[key] = value;
  }
});

const elementAt = (top, height = 200) => {
  const classes = new Set();
  return {
    classes,
    classList: {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      contains: (name) => classes.has(name),
    },
    getBoundingClientRect: () => ({ top, bottom: top + height, height }),
  };
};
const flush = () => new Promise((resolve) => setImmediate(resolve));
const observe = (...args) => {
  const cleanup = observeScrollReveal(...args);
  cleanups.push(cleanup);
  return cleanup;
};

test('conteúdo inicialmente visível recebe a entrada sem ficar preso como pendente', () => {
  for (const top of [0, 790, -190]) {
    const element = elementAt(top);
    observe(element);
    assert.deepEqual([...element.classes], ['sr-visible', 'sr-entered']);
  }
  assert.equal(observers.length, 3);
});

test('repete ao sair completamente e voltar, sem piscar ao oscilar no limiar', () => {
  const element = elementAt(900);
  observe(element);
  const observer = observers[0];
  assert.equal(element.classes.has('sr-pending'), true);
  observer.emit(true, 0.1);
  assert.equal(element.classes.has('sr-entered'), false);
  observer.emit(true, 0.6);
  assert.deepEqual([...element.classes], ['sr-visible', 'sr-entered']);
  assert.equal(observer.disconnected, false);
  observer.emit(true, 0.01);
  assert.deepEqual([...element.classes], ['sr-visible', 'sr-entered']);
  observer.emit(false, 0);
  assert.equal(element.classes.has('sr-entered'), false);
  assert.equal(element.classes.has('sr-pending'), true);
  observer.emit(true, 0.01);
  assert.equal(element.classes.has('sr-entered'), false);
  observer.emit(true, 0.6);
  assert.deepEqual([...element.classes], ['sr-visible', 'sr-entered']);
});

test('reexecução do efeito preserva o conteúdo já revelado', () => {
  const element = elementAt(900);
  const cleanup = observe(element);
  observers[0].emit(true, 1);
  cleanup();
  observe(element, { threshold: 0.8 });
  assert.equal(observers.length, 2);
  observers[1].emit(true, 0.9);
  assert.equal(element.classes.has('sr-pending'), false);
  assert.equal(element.classes.has('sr-visible'), true);
});

test('cleanup antes da entrada ignora callbacks antigos e permite novo efeito', () => {
  const element = elementAt(900);
  const cleanup = observe(element);
  const oldObserver = observers[0];
  cleanup();
  assert.equal(element.classes.has('sr-pending'), false);
  oldObserver.emit(true, 1);
  assert.equal(element.classes.has('sr-entered'), false);
  observe(element);
  observers[1].emit(true, 1);
  assert.equal(element.classes.has('sr-entered'), true);
});

test('blocos maiores que a viewport continuam alcançando o limite de entrada', () => {
  const element = elementAt(900, 4000);
  observe(element, { threshold: [0.48, 0.8], rootMargin: '0px 0px 4% 0px' });
  assert.equal(observers[0].options.rootMargin, '0px 0px 4% 0px');
  observers[0].emit(true, 0.2);
  assert.equal(element.classes.has('sr-visible'), true);
});

test('recalcula a entrada se imagens ou conteúdo aumentam a altura do bloco', () => {
  const element = elementAt(900);
  observe(element, { threshold: 0.48 });
  element.getBoundingClientRect = () => ({ top: 900, bottom: 8900, height: 8000 });
  resizes[0].callback();
  assert.equal(observers[0].disconnected, true);
  observers[0].emit(true, 1);
  assert.equal(element.classes.has('sr-entered'), false);
  observers[1].emit(true, 0.08);
  assert.equal(element.classes.has('sr-entered'), true);
});

test('um bloco inicialmente sem altura continua aguardando a entrada real', () => {
  const element = elementAt(100, 0);
  observe(element);
  assert.equal(element.classes.has('sr-entered'), false);
  element.getBoundingClientRect = () => ({ top: 900, bottom: 1100, height: 200 });
  resizes[0].callback();
  observers[1].emit(true, 0.6);
  assert.equal(element.classes.has('sr-entered'), true);
});

test('preferência de movimento reduzido mostra o conteúdo sem animação', () => {
  setMotionPreference('reduced');
  const element = elementAt(900);
  observe(element);
  assert.deepEqual([...element.classes], ['sr-visible']);
  observers[0].emit(true, 1);
  assert.deepEqual([...element.classes], ['sr-visible']);
});

test('ativar movimento reduzido libera um bloco ainda pendente', () => {
  const element = elementAt(900);
  observe(element);
  setMotionPreference('reduced');
  assert.deepEqual([...element.classes], ['sr-visible']);
  assert.equal(observers[0].disconnected, true);
});

test('reativar animações rearma blocos fora da tela sem precisar recarregar', () => {
  setMotionPreference('reduced');
  const element = elementAt(900);
  observe(element);
  setMotionPreference('full');
  assert.equal(element.classes.has('sr-pending'), true);
  observers.at(-1).emit(true, 0.6);
  assert.equal(element.classes.has('sr-entered'), true);
});

test('sem IntersectionObserver o conteúdo permanece acessível', () => {
  delete globalThis.IntersectionObserver;
  const element = elementAt(900);
  observe(element);
  assert.deepEqual([...element.classes], ['sr-visible']);
});

test('o fundo só é liberado depois do download E da decodificação', async () => {
  let finishDecode;
  const request = loadDecodedImage('decode.jpg');
  images[0].decode = () => new Promise((resolve) => { finishDecode = resolve; });
  const onLoad = images[0].onload();
  assert.equal(getDecodedImage('decode.jpg'), '');
  finishDecode();
  await onLoad;
  assert.equal(await request, 'decode.jpg');
  assert.equal(getDecodedImage('decode.jpg'), 'decode.jpg');
});

test('consumidores simultâneos e remounts reutilizam a mesma imagem pronta', async () => {
  const first = loadDecodedImage('shared.jpg');
  const second = loadDecodedImage('shared.jpg');
  assert.equal(first, second);
  await images[0].onload();
  await first;
  assert.equal(await loadDecodedImage('shared.jpg'), 'shared.jpg');
  assert.equal(images.length, 1);
});

test('resposta atrasada de um fundo anterior não substitui a seleção atual', async () => {
  let displayed = 'previous.jpg';
  const cancelOld = watchDecodedImage('slow.jpg', (src) => { displayed = src; });
  cancelOld();
  watchDecodedImage('fast.jpg', (src) => { displayed = src; });
  assert.equal(displayed, 'previous.jpg');
  await images[1].onload();
  await flush();
  assert.equal(displayed, 'fast.jpg');
  await images[0].onload();
  await flush();
  assert.equal(displayed, 'fast.jpg');
});

test('falha de rede mantém o último fundo e permite tentar novamente', async () => {
  let displayed = 'last-good.jpg';
  watchDecodedImage('retry.jpg', (src) => { displayed = src; });
  images[0].onerror();
  await flush();
  assert.equal(displayed, 'last-good.jpg');
  assert.equal(getDecodedImage('retry.jpg'), '');
  watchDecodedImage('retry.jpg', (src) => { displayed = src; });
  await images[1].onload();
  await flush();
  assert.equal(displayed, 'retry.jpg');
});

test('falha na decodificação não publica uma imagem incompleta', async () => {
  let displayed = 'last-good.jpg';
  watchDecodedImage('broken.jpg', (src) => { displayed = src; });
  images[0].decode = () => Promise.reject(new Error('decode failed'));
  await images[0].onload();
  await flush();
  assert.equal(displayed, 'last-good.jpg');
  assert.equal(getDecodedImage('broken.jpg'), '');
});

test('desmontar o consumidor cancela sua atualização pendente', async () => {
  let updates = 0;
  const cleanup = watchDecodedImage('unmounted.jpg', () => { updates++; });
  cleanup();
  await images[0].onload();
  await flush();
  assert.equal(updates, 0);
});

test('origem vazia não faz requisição de imagem', async () => {
  assert.equal(await loadDecodedImage(''), '');
  assert.equal(images.length, 0);
});
