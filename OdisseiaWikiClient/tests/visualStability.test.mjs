import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({
  stdin: {
    contents: `export * from './src/hooks/useScrollReveal/useScrollReveal.utils';
      export * from './src/hooks/useDecodedImage/imageLoader';`,
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const { observeScrollReveal, getDecodedImage, loadDecodedImage, watchDecodedImage } =
  await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);

// Doubles das APIs usadas pelos helpers; não substituem a validação visual no navegador.
const originalGlobals = Object.fromEntries(['window', 'IntersectionObserver', 'Image'].map((key) => [key, globalThis[key]]));
let observers;
let images;
let motion;
beforeEach(() => {
  observers = [];
  images = [];
  const listeners = new Set();
  motion = {
    matches: false,
    addEventListener: (_, callback) => listeners.add(callback),
    removeEventListener: (_, callback) => listeners.delete(callback),
    reduce: () => { motion.matches = true; [...listeners].forEach((callback) => callback()); },
  };
  globalThis.window = { innerHeight: 800, matchMedia: () => motion };
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

test('conteúdo inicialmente visível não passa por um quadro oculto', () => {
  for (const top of [0, 790, -190]) {
    const element = elementAt(top);
    observeScrollReveal(element);
    assert.deepEqual([...element.classes], ['sr-visible']);
  }
  assert.equal(observers.length, 0);
});

test('anima uma vez ao entrar, sem apagar ao sair ou oscilar perto do limite', () => {
  const element = elementAt(900);
  observeScrollReveal(element);
  const observer = observers[0];
  assert.equal(element.classes.has('sr-pending'), true);
  observer.emit(true, 0.1);
  assert.equal(element.classes.has('sr-entered'), false);
  observer.emit(true, 0.6);
  assert.deepEqual([...element.classes], ['sr-visible', 'sr-entered']);
  assert.equal(observer.disconnected, true);
  observer.emit(false, 0);
  observer.emit(true, 0.01);
  assert.deepEqual([...element.classes], ['sr-visible', 'sr-entered']);
});

test('reexecução do efeito preserva o conteúdo já revelado', () => {
  const element = elementAt(900);
  const cleanup = observeScrollReveal(element);
  observers[0].emit(true, 1);
  cleanup();
  observeScrollReveal(element, { threshold: 0.8 });
  assert.equal(observers.length, 1);
  assert.equal(element.classes.has('sr-pending'), false);
  assert.equal(element.classes.has('sr-visible'), true);
});

test('cleanup antes da entrada ignora callbacks antigos e permite novo efeito', () => {
  const element = elementAt(900);
  const cleanup = observeScrollReveal(element);
  const oldObserver = observers[0];
  cleanup();
  assert.equal(element.classes.has('sr-pending'), false);
  oldObserver.emit(true, 1);
  assert.equal(element.classes.has('sr-entered'), false);
  observeScrollReveal(element);
  observers[1].emit(true, 1);
  assert.equal(element.classes.has('sr-entered'), true);
});

test('blocos maiores que a viewport continuam alcançando o limite de entrada', () => {
  const element = elementAt(900, 4000);
  observeScrollReveal(element, { threshold: [0.48, 0.8], rootMargin: '0px 0px 4% 0px' });
  assert.equal(observers[0].options.rootMargin, '0px 0px 4% 0px');
  observers[0].emit(true, 0.2);
  assert.equal(element.classes.has('sr-visible'), true);
});

test('preferência de movimento reduzido mostra o conteúdo sem animação', () => {
  motion.matches = true;
  const element = elementAt(900);
  observeScrollReveal(element);
  assert.deepEqual([...element.classes], ['sr-visible']);
  assert.equal(observers.length, 0);
});

test('ativar movimento reduzido libera um bloco ainda pendente', () => {
  const element = elementAt(900);
  observeScrollReveal(element);
  motion.reduce();
  assert.deepEqual([...element.classes], ['sr-visible']);
  assert.equal(observers[0].disconnected, true);
});

test('sem IntersectionObserver o conteúdo permanece acessível', () => {
  delete globalThis.IntersectionObserver;
  const element = elementAt(900);
  observeScrollReveal(element);
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
