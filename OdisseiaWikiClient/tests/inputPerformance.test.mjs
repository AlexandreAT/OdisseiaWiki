import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import React, { createRef, useState } from 'react';
import { act, create } from 'react-test-renderer';
import { renderToStaticMarkup } from 'react-dom/server';

const bundle = await build({
  stdin: { contents: `export * from './src/components/Generic/InputText/InputText';
    export * from './src/components/Generic/TextArea/TextArea';
    export * from './src/components/Generic/Search/Search';
    export * from './src/components/Generic/StatusInput/StatusInput';
    export * from './src/components/Generic/Select/Select';
    export { LabelSpan as SelectLabelSpan } from './src/components/Generic/Select/Select.style';
    export * from './src/components/Generic/CheckBox/CheckBox';
    export {InputCheckbox} from './src/components/Generic/CheckBox/CheckBox.style';
    export {InventoryCardSelection} from './src/routes/Game/GameRunShell/RunInventoryCardSelection.style';
    export {ServerStyleSheet} from 'styled-components';
    export * from './src/components/Generic/CheckSelect/CheckSelect';
    export * from './src/routes/Management/ManagementSystem/components/ConfigTable/ConfigTable';`, loader: 'ts', resolveDir: process.cwd() },
  plugins: [{ name: 'baseline-control', setup(builder) {
    // Test the real controls/handlers, not the decorative MUI SVG implementation.
    builder.onResolve({ filter: /^@mui\/icons-material\// }, ({ path }) => ({ path, namespace: 'test-icon' }));
    builder.onLoad({ filter: /.*/, namespace: 'test-icon' }, () => ({ loader: 'js',
      contents: `import { createElement } from 'react'; export default function Icon() { return createElement('svg'); }` }));
    builder.onLoad({ filter: /InputText\.tsx$/ }, ({ path }) => ({
      // Same control/render path as before memoization; test-only export.
      contents: readFileSync(path, 'utf8') + '\nexport { InputTextComponent as BaselineInputText };', loader: 'tsx',
    }));
  } }],
  bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic', mainFields: ['module', 'main'],
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  banner: { js: `import { createRequire } from 'node:module'; const require = createRequire(${JSON.stringify(import.meta.url)});` },
});
let source = bundle.outputFiles[0].text;
source = source.replace(/((?:from|import)\s*)(["'])(react(?:-dom|\/jsx-runtime)?)\2/g,
  (_, prefix, _quote, name) => prefix + JSON.stringify(import.meta.resolve(name)));
const api = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
  .catch((error) => { throw new Error(error.message.replace(/data:text\/javascript;base64,[A-Za-z0-9+/=]+/g, '[test bundle]')); });

const previousDocument = globalThis.document;
before(() => { globalThis.document = { addEventListener() {}, removeEventListener() {} }; });
after(() => { if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument; });
const base = { theme: 'dark', neon: 'off', label: 'Campo' };
const change = (value) => ({ target: { value }, currentTarget: { value }, nativeEvent: { isComposing: false } });

test('checkbox padrão usa dois tons escuros e borda/glow azul somente com neon ligado', () => {
  for (const neon of ['on', 'off']) {
    const sheet = new api.ServerStyleSheet();
    try {
      renderToStaticMarkup(sheet.collectStyles(React.createElement(api.InputCheckbox, { $neon: neon, checked: true, readOnly: true })));
      const css = sheet.getStyleTags();
      assert.match(css, /background-color:var\(--deepgrey\)/);
      assert.match(css, /:checked\{background-color:var\(--black\)/);
      assert.match(css, /flex:0 0 20px;width:20px;height:20px/);
      assert.match(css, /:checked::after\{[^}]*border:solid var\(--neonBlue\)/);
      assert.match(css, /:focus-visible\{outline:2px solid var\(--whitesmoke\)/);
      assert.match(css, /:disabled\{opacity:\.45;cursor:not-allowed/);
      assert.match(css, /data-motion='reduced'[^}]*transition:none/);
      if (neon === 'on') {
        assert.match(css, /:checked\{[^}]*border-color:var\(--whitesmoke\);box-shadow:0 0 4px var\(--neonBlue\),inset 0 0 3px var\(--neonBlue\)/);
      } else {
        assert.match(css, /:checked\{[^}]*border-color:var\(--neonBlue\);box-shadow:none/);
        assert.doesNotMatch(css, /inset|drop-shadow|0 0 4px/);
      }
      assert.doesNotMatch(css, /inset 0px 0px 5px|#[0-9a-f]{3,8}/i);
    } finally { sheet.seal(); }
  }
});

test('checkbox do card tem apenas o quadrado nativo, sem moldura/fundo/sombra no posicionador', () => {
  const sheet = new api.ServerStyleSheet();
  try {
    renderToStaticMarkup(sheet.collectStyles(React.createElement(api.InventoryCardSelection)));
    const css = sheet.getStyleTags();
    assert.match(css, /top:18px;right:18px/);
    assert.match(css, /width:20px;height:20px/);
    assert.doesNotMatch(css, /border:|border-radius:|background:|box-shadow:/);
    assert.match(css, /label\{position:absolute/);
  } finally { sheet.seal(); }
});

test('checkbox mantém label, estado controlado/interno, callback atual e neon no input sem prop DOM extra', () => {
  let renderer; const calls = [];
  try {
    act(() => { renderer = create(React.createElement(api.CheckBox, { label: 'Selecionar', neon: 'off' })); });
    const id = renderer.root.findByType('input').props.id;
    assert.equal(renderer.root.findByType('label').props.htmlFor, id);
    act(() => renderer.root.findByType('input').props.onChange({ target: { checked: true } }));
    assert.equal(renderer.root.findByType('input').props.checked, true);
    act(() => renderer.update(React.createElement(api.CheckBox, { label: 'Selecionar', neon: 'on', checked: false,
      onChange: value => calls.push(['primeiro', value]) })));
    assert.equal(renderer.root.findByType(api.InputCheckbox).props.$neon, 'on');
    assert.equal(renderer.root.findByType('input').props.$neon, undefined);
    assert.equal(renderer.root.findByType('input').props.checked, false);
    act(() => renderer.update(React.createElement(api.CheckBox, { label: 'Selecionar', neon: 'off', checked: false,
      onChange: value => calls.push(['atual', value]) })));
    act(() => renderer.root.findByType('input').props.onChange({ target: { checked: true } }));
    assert.deepEqual(calls, [['atual', true]]);
    assert.equal(renderer.root.findByType('input').props.checked, false);
    assert.equal(renderer.root.findByType('input').props.id, id);
    act(() => renderer.update(React.createElement(api.CheckBox, { label: 'Selecionar', neon: 'off', disabled: true })));
    assert.equal(renderer.root.findByType('input').props.disabled, true);
  } finally { if (renderer) act(() => renderer.unmount()); }
});

test('checkbox das tabelas acompanha neon mesmo com linhas memoizadas e preserva edição/readonly', () => {
  const rows = [{ ativo: true }], changes = [], props = { title: 'Opções', rows,
    columns: [{ key: 'ativo', label: 'Ativo', type: 'checkbox' }], createRow: () => ({ ativo: false }),
    onChange: value => changes.push(value), theme: 'dark', neon: 'off', errorPath: 'opcoes' };
  let renderer;
  try {
    act(() => { renderer = create(React.createElement(api.ConfigTable, props)); });
    assert.equal(renderer.root.findByType(api.InputCheckbox).props.$neon, 'off');
    act(() => renderer.update(React.createElement(api.ConfigTable, { ...props, neon: 'on' })));
    assert.equal(renderer.root.findByType(api.InputCheckbox).props.$neon, 'on');
    assert.equal(renderer.root.findByType('input').props['aria-label'], 'Ativo');
    act(() => renderer.root.findByType('input').props.onChange({ target: { checked: false } }));
    assert.deepEqual(changes, [[{ ativo: false }]]);
    act(() => renderer.update(React.createElement(api.ConfigTable, { ...props, readOnly: true })));
    assert.equal(renderer.root.findByType('input').props.disabled, true);
  } finally { if (renderer) act(() => renderer.unmount()); }
});

test('uma tecla em 100 campos só refaz o controle alterado, mesmo com callbacks inline', (t) => {
  const countUpdatedControls = (Control) => {
    function DenseForm() {
      const [values, setValues] = useState(Array(100).fill('inicial'));
      return React.createElement('form', null, values.map((value, index) => React.createElement(Control, {
        ...base, key: index, name: `campo-${index}`, value,
        onChange: (event) => setValues(values.map((current, position) => position === index ? event.target.value : current)),
      })));
    }
    let renderer;
    act(() => { renderer = create(React.createElement(DenseForm)); });
    const before = renderer.root.findAllByType('input').map((input) => input.props);
    act(() => renderer.root.findAllByType('input')[0].props.onChange(change('novo')));
    const after = renderer.root.findAllByType('input');
    assert.equal(after[0].props.value, 'novo');
    const updated = after.filter((input, index) => input.props !== before[index]).length;
    act(() => renderer.unmount());
    return updated;
  };
  const baseline = countUpdatedControls(api.BaselineInputText);
  const optimized = countUpdatedControls(api.InputText);
  assert.equal(baseline, 100);
  assert.equal(optimized, 1);
  t.diagnostic(`Controles refeitos por tecla: ${baseline} antes; ${optimized} depois.`);
});

for (const name of ['InputText', 'TextArea', 'Search', 'StatusInput']) {
  test(`${name}: não refaz o campo inalterado e chama o callback novo de forma síncrona`, () => {
    const calls = [];
    const props = (version) => ({ ...base, value: '12', type: name === 'StatusInput' ? 'vida' : 'text',
      onChange: (event) => calls.push({ version, event }) });
    let renderer;
    act(() => { renderer = create(React.createElement(api[name], props(1))); });
    const tag = name === 'TextArea' ? 'textarea' : 'input';
    const before = renderer.root.findByType(tag).props;
    act(() => renderer.update(React.createElement(api[name], props(2))));
    assert.equal(renderer.root.findByType(tag).props, before);
    const event = change('13');
    event.nativeEvent.isComposing = true;
    renderer.root.findByType(tag).props.onChange(event);
    assert.deepEqual(calls, [{ version: 2, event }]);
    act(() => renderer.update(React.createElement(api[name], { ...props(3), value: '' })));
    assert.equal(renderer.root.findByType(tag).props.value, '');
    act(() => renderer.unmount());
  });
}

test('transformação/rejeição do formulário e salvar imediatamente mantêm o valor real', () => {
  let saved;
  function Form() {
    const [value, setValue] = useState('');
    return React.createElement('form', null,
      React.createElement(api.InputText, { ...base, value, onChange: (event) => {
        if (!event.target.value.includes('!')) setValue(event.target.value.toUpperCase());
      } }),
      React.createElement('button', { onClick: () => { saved = value; } }));
  }
  let renderer;
  act(() => { renderer = create(React.createElement(Form)); });
  for (const value of ['a', 'áb', 'inválido!']) act(() => renderer.root.findByType('input').props.onChange(change(value)));
  assert.equal(renderer.root.findByType('input').props.value, 'ÁB');
  act(() => renderer.root.findByType('button').props.onClick());
  assert.equal(saved, 'ÁB');
  act(() => renderer.unmount());
});

test('ref, seleção do número ao focar, limites e validação nativa continuam ativos', () => {
  const ref = createRef();
  let selected = 0;
  let focused = 0;
  let prevented = false;
  const node = { select: () => { selected++; } };
  let renderer;
  act(() => { renderer = create(React.createElement(api.InputText, { ...base, ref, type: 'number',
    value: 25, min: 0, max: 100, required: true, errorMessage: 'Valor necessário', onFocus: () => { focused++; } }),
  { createNodeMock: (element) => element.type === 'input' ? node : null }); });
  assert.equal(ref.current, node);
  const input = renderer.root.findByType('input');
  assert.equal(input.props.min, 0);
  assert.equal(input.props.max, 100);
  assert.equal(input.props.required, true);
  globalThis.document.activeElement = node;
  act(() => input.props.onFocus({ currentTarget: node }));
  assert.equal(selected, 1);
  assert.equal(focused, 1);
  act(() => input.props.onInvalid({ preventDefault: () => { prevented = true; } }));
  assert.ok(prevented);
  assert.equal(renderer.root.findByType('input').props['aria-invalid'], true);
  assert.ok(JSON.stringify(renderer.toJSON()).includes('Valor necessário'));
  act(() => renderer.root.findByType('input').props.onChange(change('30')));
  assert.equal(renderer.root.findByType('input').props['aria-invalid'], false);
  act(() => renderer.unmount());
  assert.equal(ref.current, null);
});

test('select preserva opções equivalentes, mas reage a renomear e alterar a descrição', () => {
  let renderer;
  const props = (label, description) => ({ ...base, value: 'x',
    onChange: () => {}, options: [{ value: 'x', label, description }] });
  act(() => { renderer = create(React.createElement(api.Select, props('Inicial', 'Ajuda'))); });
  const before = renderer.root.findByType('select').props;
  act(() => renderer.update(React.createElement(api.Select, props('Inicial', 'Ajuda'))));
  assert.equal(renderer.root.findByType('select').props, before);
  act(() => renderer.update(React.createElement(api.Select, props('Nome novo', 'Ajuda nova'))));
  const option = renderer.root.findAllByType('option').find((option) => option.props.value === 'x');
  assert.deepEqual(option.children, ['Nome novo']);
  assert.equal(option.props.title, 'Ajuda nova');
  act(() => renderer.unmount());
});

test('select reconhece opções reais de código vazio e mantém o título acima do texto', () => {
  let renderer;
  const props = { ...base, label: 'Modificadores de combate', value: '', allowEmptyOption: false,
    options: [{ value: '', label: 'Automático pelo tipo de arma' }, { value: 'distancia', label: 'À distância' }] };
  act(() => { renderer = create(React.createElement(api.Select, props)); });
  assert.equal(renderer.root.findByType(api.SelectLabelSpan).props.active, true);
  act(() => renderer.root.findByType('button').props.onBlur());
  assert.equal(renderer.root.findByType(api.SelectLabelSpan).props.active, true);
  act(() => renderer.update(React.createElement(api.Select, { ...props, options: [] })));
  assert.equal(renderer.root.findByType(api.SelectLabelSpan).props.active, false);
  act(() => renderer.update(React.createElement(api.Select, props)));
  assert.equal(renderer.root.findByType(api.SelectLabelSpan).props.active, true);
  act(() => renderer.update(React.createElement(api.Select, { ...props, value: 0, options: [{ value: 0, label: 'Zero' }] })));
  assert.equal(renderer.root.findByType(api.SelectLabelSpan).props.active, true);
  act(() => renderer.update(React.createElement(api.Select, { ...props, options: [{ value: '', label: '' }] })));
  assert.equal(renderer.root.findByType(api.SelectLabelSpan).props.active, false);
  act(() => renderer.unmount());
});

test('select com checkbox sem value não entra em ciclo de sincronização de estado', () => {
  let renderer;
  const props = { ...base, options: [{ value: 'x', label: 'Opção' }] };
  act(() => { renderer = create(React.createElement(api.CheckSelect, props)); });
  const before = renderer.toJSON();
  act(() => renderer.update(React.createElement(api.CheckSelect, { ...props, options: [...props.options] })));
  assert.deepEqual(renderer.toJSON(), before);
  act(() => renderer.unmount());
});

test('pesquisa mantém sugestões ordenadas e seleção sem atrasar o onChange', () => {
  const typed = [];
  const selected = [];
  let renderer;
  act(() => { renderer = create(React.createElement(api.Search, { ...base, value: 'agu',
    suggestions: ['x|Outro', 'a|Águia', 'b|Água'], onChange: (event) => typed.push(event.target.value),
    onSelectSuggestion: (value) => selected.push(value) })); });
  assert.equal(renderer.root.findAllByType('li').length, 0);
  act(() => renderer.root.findByType('input').props.onFocus({}));
  const options = renderer.root.findAllByType('li');
  assert.deepEqual(options.map((option) => option.children[0]), ['Água', 'Águia']);
  act(() => renderer.root.findByType('input').props.onChange(change('água')));
  assert.deepEqual(typed, ['água']);
  act(() => options[0].props.onClick());
  assert.deepEqual(selected, ['b|Água']);
  assert.equal(renderer.root.findAllByType('li').length, 0);
  act(() => renderer.unmount());
});

test('textarea mantém o efeito do rótulo ao rolar', () => {
  const node = { scrollTop: 0 };
  let renderer;
  act(() => { renderer = create(React.createElement(api.TextArea, { ...base, value: 'Texto longo' }),
    { createNodeMock: (element) => element.type === 'textarea' ? node : null }); });
  const label = () => renderer.root.findAllByType('span').find((span) => span.props['data-field-label']);
  node.scrollTop = 20;
  act(() => renderer.root.findByType('textarea').props.onScroll());
  assert.equal(label().props.style.opacity, 0);
  node.scrollTop = 0;
  act(() => renderer.root.findByType('textarea').props.onScroll());
  assert.equal(label().props.style.opacity, 1);
  act(() => renderer.unmount());
});

test('calculadora de status continua usando valor e callback atuais', () => {
  const values = [];
  let renderer;
  const props = (version) => ({ ...base, type: 'vida', value: 100, maxValue: 200,
    enableCalculator: true, onChange: (event) => values.push([version, event.target.value]) });
  act(() => { renderer = create(React.createElement(api.StatusInput, props(1))); });
  act(() => renderer.root.findAllByType('button').find((button) => button.props.title === 'Aplicar cálculo rápido').props.onClick());
  act(() => renderer.update(React.createElement(api.StatusInput, props(2))));
  const calculator = () => renderer.root.findAllByType('input').find((input) => input.props.placeholder === '+100 / -50 / *2');
  act(() => calculator().props.onChange(change('-25')));
  act(() => calculator().props.onKeyDown({ key: 'Enter' }));
  assert.deepEqual(values, [[2, '75']]);
  act(() => renderer.unmount());
});

test('tabela só refaz a linha editada e preserva edições, validação e ações de linhas', () => {
  const columns = [{ key: 'nome', label: 'Nome', type: 'text' }, { key: 'valor', label: 'Valor', type: 'number' }];
  let current;
  let setErrors;
  function TableForm() {
    const [rows, setRows] = useState([{ idLinha: 1, nome: 'A', valor: 1, ordem: 1 },
      { idLinha: 2, nome: 'B', valor: 2, ordem: 2 }]);
    const [errors, updateErrors] = useState({});
    current = rows;
    setErrors = updateErrors;
    return React.createElement(api.ConfigTable, { ...base, title: 'Teste', rows, columns,
      onChange: (next) => setRows(next), errors: { ...errors }, errorPath: 'linhas',
      createRow: () => ({ nome: '', valor: 0, ordem: 1 }) });
  }
  let renderer;
  act(() => { renderer = create(React.createElement(TableForm)); });
  const inputs = () => renderer.root.findAllByType('input');
  const untouched = inputs()[2].props;
  act(() => inputs()[0].props.onChange(change('A editado')));
  assert.equal(inputs()[2].props, untouched);
  act(() => inputs()[3].props.onChange(change('3')));
  assert.deepEqual(current.map((row) => [row.nome, row.valor]), [['A editado', 1], ['B', 3]]);
  act(() => setErrors({ 'linhas.1.valor': 'Valor inválido' }));
  assert.ok(JSON.stringify(renderer.toJSON()).includes('Valor inválido'));
  const buttons = (label) => renderer.root.findAllByType('button').filter((button) => button.props['aria-label'] === label);
  act(() => buttons('Duplicar linha')[1].props.onClick());
  assert.equal(current.length, 3);
  assert.equal(current[2].nome, 'B');
  assert.equal(current[2].valor, 3);
  assert.equal(current[2].idLinha, undefined);
  act(() => buttons('Mover linha para cima')[2].props.onClick());
  assert.equal(current[1].idLinha, undefined);
  act(() => buttons('Excluir linha')[0].props.onClick());
  assert.deepEqual(current.map((row) => row.nome), ['B', 'B']);
  assert.deepEqual(current.map((row) => row.ordem), [1, 2]);
  act(() => renderer.unmount());
});
