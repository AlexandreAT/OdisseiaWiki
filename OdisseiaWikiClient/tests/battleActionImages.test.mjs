import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { renderToStaticMarkup } from 'react-dom/server';

const bundle = await build({
  stdin: { contents: `export { BattleBeatText } from './src/routes/Game/BattleReplay/BattleBeatText';
    export { BattleSourceText } from './src/routes/Game/BattleReplay/BattleSourceText';
    export { buildBattleBeats, splitBattleSources } from './src/routes/Game/BattleReplay/battlePresentation';
    export { ServerStyleSheet } from 'styled-components';`, resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, write: false, format: 'cjs', platform: 'node', jsx: 'automatic',
  mainFields: ['module', 'main'], external: ['react', 'react-dom', 'react/jsx-runtime'],
  loader: { '.svg': 'text' },
  plugins: [{ name: 'icons', setup(builder) {
    builder.onResolve({ filter: /^@mui\/icons-material\// }, args => ({ path: args.path, namespace: 'icons' }));
    builder.onLoad({ filter: /.*/, namespace: 'icons' }, args => ({ contents:
      `import React from 'react'; export default function Icon(props) {return React.createElement('svg', {...props, 'data-icon': ${JSON.stringify(args.path)}});}`, loader: 'js' }));
  } }],
});
const module = { exports: {} };
new Function('require', 'module', 'exports', bundle.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
const { BattleBeatText, BattleSourceText, buildBattleBeats, splitBattleSources } = module.exports;
let view;
afterEach(() => { if (view) act(() => view.unmount()); view = null; });
const text = node => typeof node === 'string' ? node : Array.isArray(node) ? node.map(text).join('')
  : node?.children ? text(node.children) : '';
const preview = events => ({ personagem: { id: 'hero', nome: 'Herói' }, oponente: { id: 'enemy', nome: 'Inimigo' },
  resultado: { events: events.map((event, index) => ({ sequence: index + 1, round: 1, actorId: 'hero', ...event })) } });

test('ações com dado conservam a miniatura, o nome e os resultados no replay e no histórico', () => {
  const beats = buildBattleBeats(preview([
    { type: 'ACTION_SELECTED', payload: { actionId: 'item:aquila', actionName: 'Aquila', quantity: 3, sourceType: 'ARMA', image: 'assets/aquila.png' } },
    { type: 'DICE_ROLLED', payload: { resultCode: 'ACERTO', roll: { valorNatural: 15 } } },
    { type: 'DAMAGE_CALCULATED', payload: { damage: 100 } },
  ]));
  act(() => { view = create(React.createElement(BattleBeatText, { beat: beats[0], rolling: true })); });
  assert.equal(view.root.findByType('img').props.src, '/assets/aquila.png');
  assert.match(text(view.toJSON()), /Aquila ×3/);
  assert.doesNotMatch(text(view.toJSON()), /100 de dano/);
  act(() => view.update(React.createElement(BattleBeatText, { beat: beats[0] })));
  assert.equal(view.root.findByType('img').props.src, '/assets/aquila.png');
  assert.match(text(view.toJSON()), /100 de dano/);
});

test('consumíveis sem dado e condições periódicas usam as próprias imagens salvas', () => {
  const beats = buildBattleBeats(preview([
    { type: 'ACTION_SELECTED', payload: { actionId: 'item:seringa', actionName: 'Seringa', directUse: true, sourceType: 'ITEM', image: '/seringa.png' } },
    { type: 'CONDITION_APPLIED', targetId: 'hero', payload: { code: 'REGEN', name: 'Regeneração', image: '/regen.png', remainingTurns: 4 } },
    { type: 'ITEM_CONSUMED', payload: { remainingQuantity: 1 } },
    { type: 'TURN_STARTED', payload: {} },
    { type: 'CONDITION_EFFECT', targetId: 'hero', payload: { code: 'REGEN', name: 'Regeneração', operation: 'SOMAR', resource: 'VIDA', before: 100, after: 200, moment: 'INICIO_TURNO' } },
    { type: 'CONDITION_EXPIRED', payload: { code: 'REGEN', name: 'Regeneração' } },
  ]));
  act(() => { view = create(React.createElement(BattleBeatText, { beat: beats[0] })); });
  assert.deepEqual(view.root.findAllByType('img').map(img => img.props.src), ['/seringa.png', '/regen.png']);
  assert.match(text(view.toJSON()), /Regeneração \(4 turnos\)/);
  for (const beat of beats.slice(1)) {
    act(() => view.update(React.createElement(BattleBeatText, { beat })));
    assert.equal(view.root.findByType('img').props.src, '/regen.png');
  }
});

test('cada tipo tem ícone padrão e imagens quebradas também retornam ao ícone', () => {
  for (const kind of ['ITEM', 'ARMA', 'MAGIA', 'SKILL', 'PROTESE', 'CONDICAO', 'DESCANSO', 'ATAQUE']) {
    act(() => { view = create(React.createElement(BattleSourceText, { text: 'Nome', sources: [{ name: 'Nome', kind }] })); });
    assert.equal(view.root.findAllByType('img').length, 0);
    assert.equal(view.root.findAllByType('svg').length, 1);
    assert.equal(text(view.toJSON()), 'Nome');
    act(() => view.unmount()); view = null;
  }
  act(() => { view = create(React.createElement(BattleSourceText, { text: 'Magia', sources: [{ name: 'Magia', kind: 'MAGIA', image: '/inexistente.png' }] })); });
  act(() => view.root.findByType('img').props.onError());
  assert.equal(view.root.findAllByType('img').length, 0);
  assert.equal(view.root.findAllByType('svg').length, 1);
});

test('nomes são literais, sem HTML, preferindo o mais específico e sem casar dentro de palavras', () => {
  const sources = [{ name: 'Mana', kind: 'CONDICAO' }, { name: 'Mana suprema', kind: 'CONDICAO' },
    { name: '<Arma> [X]+', kind: 'ARMA' }];
  const original = 'Manancial, Mana suprema e <Arma> [X]+: Mana.';
  const parts = splitBattleSources(original, sources);
  assert.equal(parts.map(part => part.text).join(''), original);
  assert.deepEqual(parts.filter(part => part.source).map(part => part.source.name), ['Mana suprema', '<Arma> [X]+', 'Mana']);
});

test('registros antigos sem metadados continuam legíveis com ícones padrão', () => {
  const [beat] = buildBattleBeats(preview([{ type: 'ACTION_SELECTED', payload: { actionName: 'Raio', actionId: 'magia:raio', directUse: true } }]));
  assert.equal(beat.sources[0].kind, 'MAGIA');
  act(() => { view = create(React.createElement(BattleBeatText, { beat })); });
  assert.equal(view.root.findAllByType('svg').length, 1);
  assert.match(text(view.toJSON()), /Herói — usou Raio/);
});

test('miniaturas maiores reservam largura, mas não aumentam a caixa vertical do texto', () => {
  const sheet = new module.exports.ServerStyleSheet();
  try {
    renderToStaticMarkup(sheet.collectStyles(React.createElement(BattleSourceText, {
      text: 'Kakurui', sources: [{ name: 'Kakurui', kind: 'PROTESE', image: '/kakurui.png' }],
    })));
    const css = sheet.getStyleTags();
    assert.match(css, /width:2em;height:1em/);
    assert.match(css, /position:absolute;top:50%;left:0;transform:translateY\(-50%\)/);
    assert.match(css, /width:100%;height:2em/);
  } finally { sheet.seal(); }
});
