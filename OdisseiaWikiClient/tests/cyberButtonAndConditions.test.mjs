import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import React, { useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { act, create } from 'react-test-renderer';

const bundle = await build({
  stdin: { contents: `export * from './src/components/Generic/HighlightButton/HighlightButton';
    export * from './src/components/Generic/HighlightButton/HighlightButton.styles';
    export * from './src/components/Generic/HighlightButton/buttonGeometry';
    export * from './src/utils/systemItemFormCatalog';
    export * from './src/routes/Hub/UserCharacters/CharacterCreate/tableColumnsConfig';
    export { InputText } from './src/components/Generic/InputText/InputText';
    export { ConditionEffectFieldsForTest, ImplanteAtributosForm, TestSpecificationFields } from './src/routes/Management/ManagementWiki/WikiForms/FormCriarConteúdo/FormCharacter/MapItensForm';
    export { atributosFormMap, atributosSkillFormMap, atributosMagiaFormMap } from './src/routes/Management/ManagementWiki/WikiForms/FormCriarConteúdo/FormCharacter/MapItensForm';
    export { ServerStyleSheet } from 'styled-components';`, loader: 'ts', resolveDir: process.cwd() },
  plugins: [{ name: 'condition-editor-isolation', setup(builder) {
    builder.onResolve({ filter: /Generic\/Modal\/Modal$/ }, () => ({ path: 'Modal', namespace: 'test-modal' }));
    builder.onLoad({ filter: /.*/, namespace: 'test-modal' }, () => ({ loader: 'js',
      contents: `import {createElement} from 'react'; export function Modal({children}){return createElement('section',{'data-editor-modal':true},children);}` }));
    builder.onResolve({ filter: /Generic\/(RichTextModal|ImageUploader\/ImageUploader)$/ }, () => ({ path: 'image', namespace: 'test-image' }));
    builder.onLoad({ filter: /.*/, namespace: 'test-image' }, () => ({ loader: 'js',
      contents: 'export function ImageUploader(){return null;} export default function RichTextModal(){return null;}' }));
    builder.onLoad({ filter: /MapItensForm\.tsx$/ }, ({ path }) => ({ loader: 'tsx',
      contents: readFileSync(path, 'utf8') + '\nexport { ConditionEffectFields as ConditionEffectFieldsForTest };' }));
    for (const name of ['WeaponAccessories', 'WeaponModifiers']) {
      builder.onResolve({ filter: new RegExp(`/${name}/${name}$`) }, () => ({ path: name, namespace: 'test-leaf' }));
    }
    builder.onLoad({ filter: /.*/, namespace: 'test-leaf' }, ({ path }) => ({ loader: 'js',
      contents: `export function ${path}(){return null;}` }));
  } }],
  bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic', mainFields: ['module', 'main'],
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  banner: { js: `import {createRequire} from 'node:module'; const require=createRequire(${JSON.stringify(import.meta.url)});` },
});
const source = bundle.outputFiles[0].text.replace(/((?:from|import)\s*)(["'])(react(?:-dom|\/jsx-runtime)?)\2/g,
  (_, prefix, _quote, name) => prefix + JSON.stringify(import.meta.resolve(name)));
const api = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
  .catch(error => { throw new Error(error.message.replace(/data:text\/javascript;base64,[A-Za-z0-9+/=]+/g, '[test bundle]')); });

const previousDocument = globalThis.document;
before(() => { globalThis.document = { addEventListener() {}, removeEventListener() {} }; });
after(() => { if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument; });
const base = { theme: 'dark', neon: 'off' };
const text = node => typeof node === 'string' ? node : (node.children ?? []).map(text).join('');
const button = (renderer, label) => renderer.root.findAllByType('button').find(node => text(node) === label);

test('todas as variações de itens, magias e skills reutilizam a ajuda padrão nos campos técnicos', () => {
  const helpIds = (Component, props) => {
    let renderer;
    act(() => { renderer = create(React.createElement(Component, { ...base, onChange() {}, ...props })); });
    try {
      return renderer.root.findAll(node => typeof node.type === 'string' && node.props['data-field-help'])
        .map(node => node.props['data-field-help']);
    } finally { act(() => renderer.unmount()); }
  };
  for (const forms of [api.atributosFormMap, api.atributosSkillFormMap, api.atributosMagiaFormMap]) {
    for (const [type, Component] of Object.entries(forms)) {
      assert.ok(helpIds(Component, { value: {}, managementLayout: true })
        .some(id => id.startsWith('wiki.content.equipment.')), type);
    }
  }
  const conditions = helpIds(api.ConditionEffectFieldsForTest,
    { value: [{ codigo: 'REGEN', gatilho: 'AO_USAR', duracao: 4 }],
      options: [{ value: 'REGEN', label: 'Regeneração' }] });
  assert.ok(conditions.includes('wiki.content.condition.duration'));
  assert.ok(!conditions.includes('wiki.content.equipment.narrativeDuration'));
  const testFields = helpIds(api.TestSpecificationFields, { value: { codigoTeste: 'ATAQUE_COMUM' } });
  assert.ok(testFields.includes('wiki.content.test.total'));
  assert.ok(testFields.includes('wiki.content.test.attribute'));
  const weapon = helpIds(api.atributosFormMap.arma, { value: { controlaMunicao: true }, managementLayout: true });
  for (const field of ['cadence', 'ammunition', 'magazine', 'currentAmmo', 'ammoPerShot', 'ammoPerBurst',
    'attackLimit', 'shotLimit', 'burstLimit']) assert.ok(weapon.includes(`wiki.content.equipment.${field}`), field);
});

test('prótese reutiliza combate das armas sem perder bônus e mostra defesas antes da configuração', () => {
  let renderer, current;
  const catalog = api.buildSistemaItemFormCatalog('implante', {}, [], [
    { codigoTeste: 'ATAQUE_COMUM', nomeTeste: 'Ataque comum', dado: 'D20', quantidadeDados: 1 }], [],
    [{ codigo: 'PRECISAO', nome: 'Precisão', ativo: true }]);
  function Form() {
    const [value, setValue] = useState({ parteCorpo: 'braco', bonus: { vida: 200, precisao: 2 } });
    current = value;
    return React.createElement(api.ImplanteAtributosForm, { ...base, value, onChange: setValue,
      managementLayout: true, sistemaItemCatalogo: catalog });
  }
  act(() => { renderer = create(React.createElement(Form)); });
  const field = label => renderer.root.findAllByType(api.InputText).find(node => node.props.label === label);
  assert.ok(field('Proteção')); assert.ok(field('Armadura')); assert.ok(field('Escudo'));
  assert.ok(field('Bônus de Precisão')); assert.equal(field('Dano corpo a corpo'), undefined);
  act(() => field('Proteção').props.onChange({ target: { value: '300' } }));
  act(() => renderer.root.findByType(api.TestSpecificationFields).props.onChange({ codigoTeste: 'ATAQUE_COMUM', usaTotalParaFaixas: true }));
  assert.ok(field('Dano corpo a corpo')); assert.ok(field('Dano Curto')); assert.ok(field('Dano Médio')); assert.ok(field('Dano Longo'));
  assert.deepEqual(renderer.root.findByType(api.TestSpecificationFields).props.attributeOptions, catalog.attributeOptions);
  act(() => field('Dano corpo a corpo').props.onChange({ target: { value: '80' } }));
  assert.equal(current.danoBase, 80); assert.equal(current.protecaoBase, 300);
  assert.deepEqual(current.bonus, { vida: 200, precisao: 2 });
  assert.equal(current.parteCorpo, 'braco'); assert.equal(current.aplicaTeste, true);
  const content = text(renderer.toJSON());
  assert.ok(content.indexOf('Defesas') < content.indexOf('Configuração'));
  act(() => renderer.root.findByType(api.TestSpecificationFields).props.onChange(undefined));
  assert.equal(current.aplicaTeste, false); assert.equal(field('Dano corpo a corpo'), undefined);
  assert.equal(current.danoBase, 80); assert.deepEqual(current.bonus, { vida: 200, precisao: 2 });
  act(() => renderer.unmount());
});

test('CyberButton usa contorno SVG fechado e neon da mesma silhueta, sem diagonal sobreposta', () => {
  const sheet = new api.ServerStyleSheet();
  const previous = console.error;
  console.error = (message, ...args) => {
    if (/non-boolean attribute|React does not recognize/.test(String(message))) return;
    previous(message, ...args);
  };
  try {
    const markup = renderToStaticMarkup(sheet.collectStyles(React.createElement(React.Fragment, null,
      ...['dark', 'light'].flatMap(theme => ['on', 'off'].flatMap(neon => ['primary', 'secondary'].flatMap(colorType =>
        ['fit-content', '100%', '240px'].map(width => React.createElement(api.CyberButton, {
          key: `${theme}-${neon}-${colorType}-${width}`, theme, neon, colorType, width,
          height: width === '240px' ? '80px' : 'auto', text: 'Exigir teste de reação',
        }))))))));
    const css = sheet.getStyleTags();
    assert.doesNotMatch(css, /calc\((fit-content|auto|min-content|max-content)/);
    assert.match(css, /width:fit-content/);
    assert.match(css, /min-height:calc\(80px \+ 15px\)/);
    assert.match(css, /display:inline-grid/);
    assert.match(css, /grid-area:1\s*\/\s*1/);
    assert.match(css, /clip-path:path\('M /);
    assert.match(css, /filter:drop-shadow/);
    assert.doesNotMatch(css, /box-shadow:|transform:rotate|::before|::after/);
    assert.equal((markup.match(/<path /g) ?? []).length, 48);
    assert.equal((markup.match(/vector-effect="non-scaling-stroke"/g) ?? []).length, 48);
    assert.equal((markup.match(/<linearGradient /g) ?? []).length, 24);
    assert.doesNotMatch(api.ButtonClipController.componentStyle.rules.join(''), /clip-path/);
    for (const Layer of [api.ButtonBoxShadow, api.ButtonClipBorder, api.ButtonContentContainer]) {
      const rules = Layer.componentStyle.rules.join('');
      assert.match(rules, /grid-area: 1 \/ 1/);
      assert.match(rules, /width: 100%/);
      assert.match(rules, Layer === api.ButtonContentContainer ? /height: auto/ : /height: 100%/);
    }
  } finally { console.error = previous; sheet.seal(); }
});

test('botão sem tamanho explícito acompanha textos longos e cresce se precisar quebrar linha', () => {
  const wrapper = api.ButtonClipController.componentStyle.rules.join('');
  const content = api.ButtonContentContainer.componentStyle.rules.join('');
  assert.match(wrapper, /height: auto/);
  assert.match(wrapper, /max-width: 100%/);
  assert.match(content, /height: auto/);
  assert.match(content, /white-space: normal/);
  assert.match(content, /overflow-wrap: anywhere/);
  assert.match(content, /line-height: 1.35/);
  const sheet = new api.ServerStyleSheet();
  const previous = console.error;
  console.error = () => {};
  try {
    renderToStaticMarkup(sheet.collectStyles(React.createElement(api.CyberButton, { ...base, text: 'Adicionar efeito especial' })));
    const css = sheet.getStyleTags();
    assert.match(css, /width:fit-content/);
    assert.match(css, /min-width:115px/);
    assert.match(css, /min-height:50px/);
  } finally { console.error = previous; sheet.seal(); }
});

test('ações pareadas compartilham a regra horizontal no desktop e largura cheia no mobile', () => {
  const rules = api.cyberButtonActionRow.join('');
  assert.match(rules, /flex-direction: row/);
  assert.match(rules, /flex-wrap: nowrap/);
  assert.match(rules, /@media \(max-width: 768px\)/);
  assert.match(rules, /flex-wrap: wrap/);
  assert.match(rules, /flex: 1 1 auto; width: 100%/);
  const usages = [
    ['src/routes/Login/AccountActionField/AccountActionField.style.ts', 'ButtonContainer'],
    ['src/routes/Login/LoginField/LoginField.style.ts', 'ButtonContainer'],
    ['src/routes/Login/RegisterField/RegisterField.style.ts', 'ContainerButtons'],
    ['src/components/CharacterVisibility/CharacterVisibilityModal.style.ts', 'ModalFooter'],
    ['src/components/Generic/Modal/Modal.style.tsx', 'ModalFooterContainer'],
    ['src/components/Generic/ImageUploader/ImageCropperModal.style.ts', 'ButtonsContainer'],
    ['src/components/Generic/RichTextModal/RichTextModal.style.ts', 'ModalFooter'],
    ['src/routes/Management/ManagementSystem/ManagementSystem.style.ts', 'DialogFooter'],
    ['src/routes/Management/ManagementGame/ManagementGame.style.ts', 'GameAdminActions'],
    ['src/routes/Game/GameRunShell/RunLoadout.style.ts', 'LoadoutActions'],
    ['src/routes/Game/GameRunShell/RunInventory.style.ts', 'InventorySaveActions'],
    ['src/routes/Game/GameRunShell/RunVictoryScreen.style.ts', 'VictoryActions'],
    ...['Item', 'Page', 'Race', 'City'].map(name => [
      `src/routes/Management/ManagementWiki/WikiForms/FormCriarConteúdo/Form${name}/Form${name}.style.ts`,
      name === 'Page' ? 'ActionButtonsContainer' : 'ButtonsContainer',
    ]),
  ];
  for (const [file, name] of usages) {
    const source = readFileSync(file, 'utf8');
    const start = source.indexOf(`export const ${name} =`);
    assert.ok(start >= 0, file);
    const group = source.slice(start, source.indexOf('`;', start));
    assert.ok(group.includes('${cyberButtonActionRow}'), `${file}: usa o padrão central`);
    const desktop = group.split('@media')[0];
    assert.doesNotMatch(desktop, /flex-wrap:\s*wrap\s*;|flex-direction:\s*column/, file);
  }
});

test('ações de próteses e navegação não forçam mais dimensões internas diferentes do contorno', () => {
  const source = readFileSync('src/routes/Management/ManagementWiki/WikiForms/FormCriarConteúdo/FormCharacter/FormCharacter.style.ts', 'utf8');
  const prosthesis = source.slice(source.indexOf('export const ProsthesisActions'));
  assert.doesNotMatch(prosthesis, /calc\(100% - 15px\)|height:[^;]+!important/);
  assert.ok(prosthesis.includes('${cyberButtonsFillWidth}'));
  for (const file of ['src/routes/Management/ManagementWiki/WikiForms/ManagementEntityToolbar.style.ts',
    'src/components/Generic/MultiStepNavigation/MultiStepNavigation.style.ts']) {
    const style = readFileSync(file, 'utf8');
    assert.match(style, /padding: 4px/);
    assert.match(style, /height: auto !important/);
    assert.doesNotMatch(style, /height: (36|44)px !important/);
  }
});

test('geometria mantém o traço inteiro dentro do recorte, com junções contínuas em qualquer tamanho', () => {
  for (const [width, height] of [[100, 50], [620, 190], [220, 50], [310, 80], [42, 30], [4, 4]]) {
    const geometry = api.createButtonGeometry(width, height);
    for (const path of [geometry.face, geometry.border]) {
      assert.match(path, /^M .* Z$/);
      assert.equal((path.match(/M /g) ?? []).length, 1, 'um único contorno, sem segmento solto');
      assert.doesNotMatch(path, /NaN|Infinity/);
    }
    const diagonal = / H ([\d.]+) L 1 ([\d.]+) V/.exec(geometry.border);
    assert.ok(diagonal);
    const x = Number(diagonal[1]);
    const y = Number(diagonal[2]);
    const cutWidth = Math.min(18, width / 3);
    const cutHeight = Math.min(12, height / 3);
    const distance = (px, py) => (cutHeight * px - cutWidth * py + cutWidth * (height - cutHeight)) /
      Math.hypot(cutWidth, cutHeight);
    assert.ok(Math.abs(distance(x, height - 1) - 1) < 0.000001);
    assert.ok(Math.abs(distance(1, y) - 1) < 0.000001);
    assert.ok(x < width - 1 && y > 1 && y < height - 1);
  }
});

test('redimensionamento atualiza face, contorno e brilho juntos, e desconecta o observador', () => {
  const previousObserver = globalThis.ResizeObserver;
  let resize;
  let disconnects = 0;
  globalThis.ResizeObserver = class {
    constructor(callback) { resize = callback; }
    observe() {}
    disconnect() { disconnects++; }
  };
  let renderer;
  const node = { offsetWidth: 220, offsetHeight: 50 };
  try {
    act(() => { renderer = create(React.createElement(api.CyberButton, { ...base, width: 'fit-content', text: 'Salvar' }),
      { createNodeMock: element => element.type === 'button' ? node : null }); });
    for (const [width, height] of [[220, 50], [620, 80], [160, 100]]) {
      node.offsetWidth = width;
      node.offsetHeight = height;
      act(() => resize());
      const paths = renderer.root.findAllByType('path');
      assert.equal(paths.length, 2);
      assert.equal(paths[0].props.d, paths[1].props.d);
      assert.equal(paths[0].props.d, api.createButtonGeometry(width, height).border);
      assert.equal(renderer.root.findByType(api.ButtonContentContainer).props.$facePath,
        api.createButtonGeometry(width, height).face);
    }
    act(() => renderer.unmount());
    assert.equal(disconnects, 1);
  } finally {
    if (previousObserver === undefined) delete globalThis.ResizeObserver; else globalThis.ResizeObserver = previousObserver;
  }
});

test('CyberButton preserva clique, submit, loading e decoração sem interceptar eventos', () => {
  let clicks = 0;
  let renderer;
  const props = { ...base, text: 'Salvar', type: 'submit', onClick: () => { clicks++; } };
  act(() => { renderer = create(React.createElement(api.CyberButton, props)); });
  assert.equal(renderer.root.findByType('button').props.type, 'submit');
  act(() => renderer.root.findByType('button').props.onClick());
  assert.equal(clicks, 1);
  assert.equal(renderer.root.findByType(api.ButtonClipBorder).props['aria-hidden'], 'true');
  act(() => renderer.update(React.createElement(api.CyberButton, { ...props, loading: true })));
  assert.equal(renderer.root.findByType('button').props.disabled, true);
  assert.equal(renderer.root.findByType('button').props['aria-busy'], true);
  act(() => renderer.unmount());
});

const options = [{ value: 'REGENERACAO', label: 'Regeneração' }, { value: 'CEGUEIRA', label: 'Cegueira' }];
function editor(props = {}, initial = []) {
  const changes = [];
  function Host() {
    const [value, setValue] = useState(initial);
    return React.createElement(api.ConditionEffectFieldsForTest, { ...base, options, value,
      onChange: next => { changes.push(next); setValue(next); }, ...props });
  }
  let renderer;
  act(() => { renderer = create(React.createElement(Host)); });
  return { renderer, changes };
}

test('primeiro clique em adicionar já cria e abre uma condição; ocultar e reabrir não duplica', () => {
  const { renderer, changes } = editor({ useOnly: true });
  assert.equal(renderer.root.findAllByType('button').length, 1);
  act(() => button(renderer, 'Adicionar condição').props.onClick());
  assert.equal(changes.length, 1);
  assert.deepEqual(changes[0], [{ codigo: 'REGENERACAO', gatilho: 'AO_USAR', alvo: 'USUARIO', unidadeDuracao: 'Turno' }]);
  assert.ok(button(renderer, 'Remover'), 'editor já está aberto');
  act(() => button(renderer, 'Ocultar condições').props.onClick());
  assert.equal(button(renderer, 'Remover'), undefined);
  act(() => button(renderer, 'Mostrar condições · 1').props.onClick());
  assert.equal(changes.length, 1);
  act(() => button(renderer, 'Adicionar outra condição').props.onClick());
  assert.equal(changes.at(-1).length, 2);
  assert.equal(changes.at(-1)[1].codigo, 'CEGUEIRA');
  assert.equal(button(renderer, 'Adicionar outra condição'), undefined, 'não duplica condições já escolhidas');
  act(() => renderer.unmount());
});

test('condições existentes mantêm valores e gatilhos, e novas origens preservam seu tipo', () => {
  const existing = [{ codigo: 'REGENERACAO', gatilho: 'AO_USAR', alvo: 'USUARIO', duracao: 4, valoresEfeitos: { 0: 100 } }];
  const { renderer, changes } = editor({}, existing);
  assert.ok(button(renderer, 'Ocultar condições'));
  assert.equal(changes.length, 0);
  act(() => button(renderer, 'Adicionar outra condição').props.onClick());
  assert.deepEqual(changes[0][0], existing[0]);
  assert.equal(changes[0][1].gatilho, 'ACERTO');
  act(() => renderer.unmount());
  const defensive = editor({ allowEquipTrigger: true });
  act(() => button(defensive.renderer, 'Adicionar condição').props.onClick());
  assert.equal(defensive.changes[0][0].gatilho, 'AO_EQUIPAR');
  act(() => defensive.renderer.unmount());
});

test('sem condições no Sistema, abrir informa a ausência sem criar uma referência inválida', () => {
  const { renderer, changes } = editor({ options: [] });
  act(() => button(renderer, 'Adicionar condição').props.onClick());
  assert.equal(changes.length, 0);
  assert.ok(renderer.root.findAllByType('p').some(node => text(node).includes('Sistema não tem condições configuradas')));
  assert.equal(button(renderer, 'Adicionar condição'), undefined);
  act(() => renderer.unmount());
});

const characterContext = {
  idSistemaVersao: 7,
  itens: { tipos: [] },
  criacao: { atributos: [{ codigo: 'AGILIDADE', nome: 'Agilidade', ativo: true }] },
  combate: { resultadosDado: [{ codigoTeste: 'ATAQUE_COMUM', nomeTeste: 'Ataque', dado: 'D20', quantidadeDados: 1,
    codigoResultado: 'CRITICO', nomeResultado: 'Crítico' }] },
  sobrevivencia: { condicoes: [{ codigo: 'SANGRAMENTO', nome: 'Sangramento', operacaoEfeito: 'SUBTRAIR',
    codigoRecurso: 'VIDA', valorEfeito: 50, momentoEfeito: 'INICIO_TURNO' }] },
};
const itemValue = { condicoes: [{ codigo: 'sangramento', gatilho: 'RESULTADO_CLASSIFICADO', codigoResultado: 'critico',
  duracao: 4, unidadeDuracao: 'Turno', valoresEfeitos: { 0: 80 } }] };
const errorText = renderer => renderer.root.findAllByProps({ role: 'alert' }).map(text).join(' ');
const optionLabels = renderer => renderer.root.findAllByType('option').map(text);
const editorNode = (factory, row, context, onChange = () => {}, onRowChange = () => {}, theme = 'dark') =>
  api[factory](theme, 'off', context).find(column => column.key === 'atributos')
    .customRender(itemValue, row, onChange, onRowChange);

test('todos os tipos de itens, incluindo próteses, recebem condições e resultados da versão da ficha', () => {
  for (const tipo of ['arma', 'traje', 'consumiveis', 'acessorio', 'implante', 'outro']) {
    let renderer;
    const row = { tipo, nome: 'Teste', atributos: itemValue };
    act(() => { renderer = create(editorNode('createItemColumns', row, characterContext)); });
    act(() => button(renderer, 'Editar').props.onClick());
    assert.ok(optionLabels(renderer).includes('Sangramento'), tipo);
    assert.ok(optionLabels(renderer).includes('Crítico'), tipo);
    assert.doesNotMatch(errorText(renderer), /não existe/, tipo);
    assert.equal(button(renderer, 'Adicionar outra condição'), undefined, 'código legado não vira condição duplicada');
    act(() => renderer.unmount());
  }
});

test('catálogo carregado depois atualiza modal aberto e versão sem a condição ainda acusa ausência real', () => {
  const row = { tipo: 'arma', nome: 'Espada', atributos: itemValue };
  let renderer;
  act(() => { renderer = create(editorNode('createItemColumns', row, null)); });
  act(() => button(renderer, 'Editar').props.onClick());
  assert.doesNotMatch(errorText(renderer), /não existe/);
  assert.ok(renderer.root.findAllByProps({ role: 'status' }).some(node => text(node).includes('não foram carregadas')));
  act(() => renderer.update(editorNode('createItemColumns', row, characterContext)));
  assert.ok(optionLabels(renderer).includes('Sangramento'));
  assert.doesNotMatch(errorText(renderer), /não existe/);
  const otherVersion = { ...characterContext, idSistemaVersao: 8, sobrevivencia: { condicoes: [] } };
  act(() => renderer.update(editorNode('createItemColumns', row, otherVersion)));
  assert.match(errorText(renderer), /não existe no Sistema atual/);
  assert.equal(itemValue.condicoes[0].codigo, 'sangramento', 'não remove nem regrava a configuração automaticamente');
  act(() => renderer.unmount());
});

test('magias e skills recebem faixas classificadas e condições, e usam callbacks atuais sem perder valores', () => {
  for (const factory of ['createItemColumns', 'createSkillsColumns', 'createMagiasColumns']) {
    const row = { tipo: factory === 'createItemColumns' ? 'arma' : 'ataque', nome: 'Origem', atributos: itemValue };
    const changes = [];
    let renderer;
    act(() => { renderer = create(editorNode(factory, row, characterContext, value => changes.push({ version: 1, value }))); });
    act(() => button(renderer, 'Editar').props.onClick());
    assert.ok(optionLabels(renderer).includes('Crítico'), factory);
    assert.ok(optionLabels(renderer).includes('Sangramento'), factory);
    act(() => renderer.update(editorNode(factory, row, characterContext, value => changes.push({ version: 2, value }), () => {}, 'light')));
    const effectInput = renderer.root.findAllByType(api.InputText).find(node => node.props.label.startsWith('VIDA · subtrair'));
    assert.ok(effectInput, factory);
    act(() => effectInput.props.onChange({ target: { value: '120' } }));
    assert.equal(changes.at(-1).version, 2, factory);
    const condition = changes.at(-1).value.condicoes[0];
    assert.equal(condition.valoresEfeitos[0], 120);
    assert.equal(condition.duracao, 4);
    assert.equal(condition.gatilho, 'RESULTADO_CLASSIFICADO');
    assert.equal(condition.codigo, 'sangramento');
    act(() => renderer.unmount());
  }
});

test('fichas de criação/edição de jogador e NPC passam o contexto atual à tabela de itens', () => {
  const paths = [
    ['src/routes/Hub/UserCharacters/CharacterCreate/CharacterCreate.tsx', 'runtimeContext'],
    ['src/routes/Hub/UserCharacters/CharacterEdit/CharacterEdit.tsx', 'runtimeContext'],
    ['src/routes/Management/ManagementWiki/WikiForms/FormCriarConteúdo/FormCharacter/FormCharacter.tsx', 'sistema.contexto'],
    ['src/routes/Management/ManagementWiki/WikiForms/FormBuscarConteúdo/NpcCharacterEdit.tsx', 'powerContext'],
  ];
  for (const [path, context] of paths) {
    assert.ok(readFileSync(path, 'utf8').includes(`createItemColumns(theme, neon, ${context})`), path);
  }
  const source = readFileSync(paths[3][0], 'utf8');
  assert.match(source, /clone && targetMesaId \? targetRuntime.contexto : sistema.contexto/);
  assert.equal(api.buildCharacterEntryCatalog('arma', {}, null), undefined);
  const catalog = api.buildCharacterEntryCatalog('arma', itemValue, characterContext);
  assert.equal(catalog.conditionOptions[0].value, 'SANGRAMENTO');
  assert.equal(catalog.resultOptions[0].value, 'CRITICO');
  assert.equal(catalog.testOptions[0].value, 'ATAQUE_COMUM');
});
