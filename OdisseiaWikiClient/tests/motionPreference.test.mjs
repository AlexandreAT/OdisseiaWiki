import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { build } from 'esbuild';

const bundle = await build({ entryPoints: ['src/utils/motionPreference.ts'],
  bundle: true, write: false, format: 'esm', platform: 'node' });
const moduleUrl = `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`;
const previous = { window: globalThis.window, document: globalThis.document };
let instance = 0;
afterEach(() => {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
  }
});

async function setup({ saved, systemReduced = true, width = 1440, storageBlocked = false } = {}) {
  const storage = new Map(saved ? [['odisseia:motion', saved]] : []);
  const events = new Map();
  let mediaChanged;
  const query = { matches: systemReduced, addEventListener: (_, cb) => { mediaChanged = cb; } };
  globalThis.document = { documentElement: { dataset: {} } };
  globalThis.window = {
    innerWidth: width,
    matchMedia: () => query,
    addEventListener: (type, cb) => events.set(type, cb),
    localStorage: {
      getItem: key => { if (storageBlocked) throw Error('blocked'); return storage.get(key); },
      setItem: (key, value) => { if (storageBlocked) throw Error('blocked'); storage.set(key, value); },
    },
  };
  const api = await import(`${moduleUrl}#${++instance}`);
  api.initializeMotionPreference();
  return { ...api, storage, events, query, mediaChanged,
    cssMotion: () => document.documentElement.dataset.motion };
}

test('animações completas não dependem da largura da tela nem do Windows', async () => {
  for (const width of [390, 1440]) {
    const api = await setup({ width, systemReduced: true });
    assert.equal(api.getMotionPreference(), 'full');
    assert.equal(api.isMotionReduced(), false);
    assert.equal(api.cssMotion(), 'full');
    api.mediaChanged();
    assert.equal(api.isMotionReduced(), false);
  }
});

test('redução explícita persiste e sincroniza CSS, efeitos JS e assinantes', async () => {
  let api = await setup({ systemReduced: false });
  let updates = 0;
  const unsubscribe = api.subscribeMotionPreference(() => updates++);
  api.setMotionPreference('reduced');
  assert.equal(api.isMotionReduced(), true);
  assert.equal(api.cssMotion(), 'reduced');
  assert.equal(api.storage.get(api.MOTION_STORAGE_KEY), 'reduced');
  assert.equal(updates, 1);
  unsubscribe();
  api.setMotionPreference('full');
  assert.equal(updates, 1);
  api = await setup({ saved: 'reduced', systemReduced: false });
  assert.equal(api.isMotionReduced(), true);
  assert.equal(api.cssMotion(), 'reduced');
});

test('modo dispositivo acompanha alterações do sistema sem recarregar', async () => {
  const api = await setup({ saved: 'system' });
  assert.equal(api.isMotionReduced(), true);
  assert.equal(api.cssMotion(), 'reduced');
  api.query.matches = false;
  api.mediaChanged();
  assert.equal(api.isMotionReduced(), false);
  assert.equal(api.cssMotion(), 'full');
});

test('preferência entre abas e limpeza do armazenamento atualizam o site', async () => {
  const api = await setup();
  api.storage.set(api.MOTION_STORAGE_KEY, 'reduced');
  api.events.get('storage')({ key: api.MOTION_STORAGE_KEY });
  assert.equal(api.cssMotion(), 'reduced');
  api.storage.clear();
  api.events.get('storage')({ key: null });
  assert.equal(api.cssMotion(), 'full');
});

test('bloquear armazenamento não quebra a página nem a troca de animações', async () => {
  const api = await setup({ storageBlocked: true });
  api.setMotionPreference('reduced');
  assert.equal(api.isMotionReduced(), true);
  api.setMotionPreference('full');
  assert.equal(api.isMotionReduced(), false);
});
