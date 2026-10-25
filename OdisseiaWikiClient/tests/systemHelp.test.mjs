import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const bundle = await build({
  stdin: { contents: `export * from './src/content/systemHelp'; export * from './src/components/Generic/FieldHelp/fieldHelpPosition'; export * from './src/components/Generic/FieldHelp/fieldHelpLabelLayout'; export * from './src/components/Generic/FieldHelp/FieldHelpProvider'; export * from './src/components/Generic/FieldHelp/FieldHelpBody'; export { HelpPopover } from './src/components/Generic/FieldHelp/FieldHelp.style'; export { ServerStyleSheet } from 'styled-components'; export * from './src/components/Generic/InputText/InputText'; export * from './src/components/Generic/Select/Select'; export * from './src/components/Generic/TextArea/TextArea'; export * from './src/components/Generic/CheckSelect/CheckSelect'; export * from './src/components/Generic/Search/Search'; export * from './src/components/Generic/CheckBox/CheckBox';`, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic',
  mainFields: ['module', 'main'],
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  banner: { js: `import { createRequire } from 'node:module'; const require = createRequire(${JSON.stringify(import.meta.url)});` },
});
// File URLs let Node resolve the external React instance shared with the renderer.
let bundled = bundle.outputFiles[0].text;
for (const module of ['react', 'react-dom', 'react/jsx-runtime'])
  bundled = bundled.replaceAll(`from "${module}"`, `from ${JSON.stringify(import.meta.resolve(module))}`);
const api = await import(`data:text/javascript;base64,${Buffer.from(bundled).toString('base64')}`)
  .catch((error) => { throw new Error(error.message); });
const { getSystemHelp, systemHelpCatalogue, getFieldHelpPosition, FieldHelpProvider } = api;
const render = (element) => {
  const previous = console.error;
  console.error = (message, ...args) => {
    // Existing styled inputs forward styling-only props in React's dev SSR.
    // Keep unrelated warnings visible; these tests do not change that legacy API.
    if (/non-boolean attribute|React does not recognize/.test(String(message))) return;
    previous(message, ...args);
  };
  try { return renderToStaticMarkup(element); } finally { console.error = previous; }
};

test('catálogo cru possui as sete abas, explicações e identificadores estáveis', () => {
  assert.equal(systemHelpCatalogue.systemScope, 'ODISSEIA');
  assert.equal(Object.keys(systemHelpCatalogue.modules).length, 7);
  for (const [module, entry] of Object.entries(systemHelpCatalogue.modules)) {
    assert.ok(entry.text.length > 35);
    assert.equal(getSystemHelp(module, '$module').id, `odisseia.${module}`);
    for (const [target, help] of Object.entries({ ...entry.sections, ...entry.fields })) {
      assert.ok(help.text.length > 20, `${module}.${target}`);
      assert.equal(getSystemHelp(module, target).text, help.text);
      assert.doesNotMatch(help.text, /<\/?\w+>/);
    }
  }
});

test('índice da ajuda mantém precedência de chaves/aliases e devolve referências estáveis', () => {
  const normalize = (text) => text.trim().replace(/\s*\*$/, '').toLocaleLowerCase('pt-BR');
  const original = (moduleKey, target) => {
    const module = systemHelpCatalogue.modules[moduleKey];
    if (target === '$module' || normalize(target) === normalize(module.title))
      return { id: `odisseia.${moduleKey}`, title: module.title, text: module.text };
    const exact = module.fields[target] ?? module.sections[target];
    if (exact) return { id: `odisseia.${moduleKey}.${target}`, ...exact };
    for (const [key, entry] of Object.entries({ ...module.sections, ...module.fields }))
      if (entry.aliases?.some((alias) => normalize(alias) === normalize(target)))
        return { id: `odisseia.${moduleKey}.${key}`, ...entry };
    const commonKey = target.split('.').at(-1) ?? target;
    for (const [key, entry] of Object.entries(systemHelpCatalogue.common))
      if (key === commonKey || entry.aliases?.some((alias) => normalize(alias) === normalize(target)))
        return { id: `odisseia.comum.${key}`, ...entry };
  };
  for (const [moduleKey, module] of Object.entries(systemHelpCatalogue.modules)) {
    const targets = ['$module', module.title, 'desconhecido', ...Object.entries(systemHelpCatalogue.common)
      .flatMap(([key, entry]) => [key, `colecao.${key}`, ...(entry.aliases ?? [])]),
      ...Object.entries({ ...module.sections, ...module.fields }).flatMap(([key, entry]) => [key, ...(entry.aliases ?? [])])];
    for (const target of targets.flatMap((target) => [target, ` ${target.toUpperCase()} *`])) {
      assert.deepEqual(getSystemHelp(moduleKey, target), original(moduleKey, target), `${moduleKey}.${target}`);
      assert.equal(getSystemHelp(moduleKey, target), getSystemHelp(moduleKey, target));
    }
  }
});
test('cada título de seção e tabela da configuração possui explicação ligada', () => {
  const directory = 'src/routes/Management/ManagementSystem/components/ModuleForms';
  const modules = { General: 'geral', Creation: 'criacao', Progression: 'progressao',
    Exploration: 'exploracao', Combat: 'combate', Powers: 'poderes', Survival: 'sobrevivencia', ConditionRulesEditor: 'sobrevivencia' };
  for (const file of readdirSync(directory).filter((name) => /ModuleForm\.tsx$|ConditionRulesEditor\.tsx$/.test(name))) {
    const module = modules[file.replace('ModuleForm.tsx', '').replace('.tsx', '')];
    const source = readFileSync(`${directory}/${file}`, 'utf8');
    for (const match of source.matchAll(/<HelpHeading[^>]*label="([^"]+)"/g))
      assert.ok(getSystemHelp(module, match[1]), `${file}: ${match[1]}`);
    for (const match of source.matchAll(/errorPath="([^"]+)"/g))
      assert.ok(getSystemHelp(module, match[1]), `${file}: ${match[1]}`);
  }
});
test('campos de condições, referências e percentuais apontam para o texto específico', () => {
  assert.equal(getSystemHelp('sobrevivencia', 'Recurso afetado').id, 'odisseia.sobrevivencia.condicoes.codigoRecurso');
  assert.match(getSystemHelp('sobrevivencia', 'Descanso normal ou longo').text, /simples não remove/);
  assert.match(getSystemHelp('sobrevivencia', 'Unidade').text, /não por deixar o site aberto/);
  assert.match(getSystemHelp('progressao', 'influenciasAtributos.percentualPorValor').text, /1300/);
  assert.match(getSystemHelp('combate', 'Estamina por ataque adicional').text, /três tiros ou rajadas/);
  assert.equal(getSystemHelp('geral', 'Recurso afetado'), undefined);
  assert.match(getSystemHelp('sobrevivencia', 'condicoes.tipo').text, /categoria/);
  assert.equal(getSystemHelp('combate', 'condicoes.tipo'), undefined);
});
test('inputs sem ajuda continuam sem ícone; prop opcional é reutilizável fora do Sistema', () => {
  const help = { id: 'teste.campo', title: 'Exemplo', text: 'Texto cru de exemplo.' };
  for (const name of ['InputText', 'Select', 'TextArea', 'CheckSelect', 'Search', 'CheckBox']) {
    const props = { theme: 'dark', neon: 'off', label: 'Campo', options: [], value: name === 'CheckSelect' ? [] : '' };
    assert.doesNotMatch(render(React.createElement(api[name], props)), /data-field-help=/);
    assert.match(render(React.createElement(api[name], { ...props, help })), /data-field-help="teste.campo"/);
  }
});
test('contexto da aba conecta campo à ajuda sem contaminar outras telas', () => {
  const markup = render(React.createElement(FieldHelpProvider, {
    theme: 'dark', neon: 'off', resolve: (target) => getSystemHelp('sobrevivencia', target),
  }, React.createElement(api.InputText, { theme: 'dark', neon: 'off', label: 'Recurso afetado' })));
  assert.match(markup, /data-field-help="odisseia.sobrevivencia.condicoes.codigoRecurso"/);
  assert.match(markup, /aria-expanded="false"/);
});

test('opção nativa usa legenda title; opções dinâmicas não ganham descrição automática', () => {
  const options = [{ value: 'native', label: 'Opção nativa', description: 'Uma explicação curta.' },
    { value: 'custom', label: 'Nome definido pelo usuário' }];
  const markup = render(React.createElement(api.Select, { theme: 'dark', neon: 'off', label: 'Escolha',
    options, value: 'native' }));
  assert.match(markup, /<option[^>]*value="native"[^>]*title="Uma explicação curta\."/);
  assert.doesNotMatch(markup, /<option[^>]*value="custom"[^>]*title=/);
  assert.match(markup, /<button[^>]*title="Uma explicação curta\."/);
  const checkSelect = readFileSync('src/components/Generic/CheckSelect/CheckSelect.tsx', 'utf8');
  assert.match(checkSelect, /<CheckListContainer[^>]*title=\{opt\.description\}/);
  const checkbox = render(React.createElement(api.CheckBox, { neon: 'off', label: 'Terminar por cura',
    title: 'Termina ao receber vida.' }));
  assert.match(checkbox, /title="Termina ao receber vida\."/);
});

test('catálogo de escolhas nativas tem explicações cruas, curtas e sem HTML', () => {
  const descriptions = JSON.parse(readFileSync('src/content/systemOptionHelp.pt-BR.json', 'utf8'));
  for (const [group, entries] of Object.entries(descriptions)) {
    for (const [value, text] of Object.entries(entries)) {
      assert.ok(text.length >= 15 && text.length <= 170, `${group}.${value}: ${text.length}`);
      assert.doesNotMatch(text, /<\/?\w+>/);
    }
  }
});

test('ajuda sobreposta não desloca valores nem setas e permite quebrar apenas o rótulo', () => {
  const sheet = new api.ServerStyleSheet();
  try {
    for (const name of ['InputText', 'Select', 'TextArea', 'CheckSelect', 'Search']) {
      const props = { theme: 'dark', neon: 'off', label: 'Rótulo longo para o campo', options: [],
        value: name === 'CheckSelect' ? [] : '', help: { id: 'teste', title: 'Ajuda', text: 'Explicação.' } };
      const markup = render(sheet.collectStyles(React.createElement(api[name], props)));
      assert.match(markup, /data-field-label="true"/);
    }
    const css = sheet.getStyleTags();
    assert.match(css, /\[data-field-label\][^{]*\{right:38px;margin-right:0;white-space:normal;overflow-wrap:anywhere;line-height:1\.3;/);
    assert.match(css, /padding-top:calc\(25px \+ var\(--field-help-label-extra, 0px\)\)/);
    assert.doesNotMatch(css, /padding-right:(46|74)px|right:44px/);
    // Only helped selects lower their arrow, without changing its horizontal position or rotation.
    assert.match(css, /:has\(>\s*\[data-field-help\]\)[^{]*\{position:relative;top:6px;/);
    // Select values keep their normal truncation; only the floating label wraps.
    assert.match(css, /text-overflow:ellipsis;white-space:nowrap/);
  } finally { sheet.seal(); }
});

test('bordas externas do I acompanham o campo ativo com a paleta do tema e do neon', () => {
  for (const theme of ['dark', 'light']) for (const neon of ['on', 'off']) for (const typeStyle of ['primary', 'secondary']) {
    const expected = neon === 'on' ? '#fff' : (theme === 'dark') === (typeStyle === 'primary')
      ? 'var(--clearneonBlue)' : 'var(--clearneonPink)';
    for (const name of ['InputText', 'TextArea', 'Search', 'Select', 'CheckSelect']) {
      const sheet = new api.ServerStyleSheet();
      try {
        render(sheet.collectStyles(React.createElement(api[name], { theme, neon, typeStyle,
          label: 'Campo', value: name === 'CheckSelect' ? [] : '', options: [],
          help: { id: 'teste', title: 'Ajuda', text: 'Explicação.' } })));
        const css = sheet.getStyleTags();
        assert.ok(css.includes(`--field-help-active-border:${expected};`), `${name}: ${theme}/${neon}/${typeStyle}`);
        const rule = css.match(/:has\([^{}]*input:focus[^{}]*\)[^{]*\{([^}]+)\}/)?.[1];
        assert.ok(rule);
        assert.match(rule, /border-top:2px solid var\(--field-help-active-border\)/);
        assert.match(rule, /border-right:2px solid var\(--field-help-active-border\)/);
        assert.doesNotMatch(rule, /border-left|border-bottom|box-shadow/);
        assert.match(css, /button\[aria-expanded='true'\]/);
        assert.match(css, /data-validation-error='true'[^{}]*\{--field-help-active-border:var\(--clearneonRed\)/);
      } finally { sheet.seal(); }
    }
  }
});

test('rótulo quebrado ganha espaço vertical e o ajuste some ao alargar ou remover a ajuda', () => {
  const previousWindow = globalThis.window;
  const previousObserver = globalThis.ResizeObserver;
  const properties = new Map();
  const attributes = new Set();
  let height = 15;
  let resize;
  let disconnected = false;
  const label = { get offsetHeight() { return height; } };
  const container = {
    querySelector: () => label,
    style: { setProperty: (key, value) => properties.set(key, value), removeProperty: (key) => properties.delete(key) },
    toggleAttribute: (key, enabled) => enabled ? attributes.add(key) : attributes.delete(key),
    removeAttribute: (key) => attributes.delete(key),
  };
  globalThis.window = { getComputedStyle: () => ({ lineHeight: '15px' }) };
  globalThis.ResizeObserver = class {
    constructor(callback) { resize = callback; }
    observe(target) { assert.equal(target, label); }
    disconnect() { disconnected = true; }
  };
  try {
    const cleanup = api.trackFieldHelpLabel(container);
    assert.equal(properties.get('--field-help-label-extra'), '0px');
    assert.equal(attributes.size, 0);
    height = 45;
    resize();
    assert.equal(properties.get('--field-help-label-extra'), '30px');
    assert.ok(attributes.has('data-field-label-wrapped'));
    height = 15;
    resize();
    assert.equal(properties.get('--field-help-label-extra'), '0px');
    assert.equal(attributes.size, 0);
    cleanup();
    assert.ok(disconnected);
    assert.equal(properties.size, 0);
    assert.equal(api.trackFieldHelpLabel({ querySelector: () => null }), undefined);
  } finally {
    if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
    if (previousObserver === undefined) delete globalThis.ResizeObserver; else globalThis.ResizeObserver = previousObserver;
  }
});
test('popover cabe no mobile, acompanha a âncora e abre para cima perto do fim da tela', () => {
  for (const viewport of [{ width: 360, height: 640 }, { width: 1440, height: 900 }]) {
    for (const anchor of [{ top: 30, bottom: 62, right: 50 }, { top: viewport.height - 60,
      bottom: viewport.height - 28, right: viewport.width - 8 }]) {
      const position = getFieldHelpPosition(anchor, viewport, 350);
      assert.ok(position.left >= 12);
      assert.ok(position.left + position.width <= viewport.width - 12);
      assert.ok(position.top >= 12);
      assert.ok(position.top + Math.min(350, position.height) <= viewport.height - 12);
      assert.ok(position.arrowLeft >= 12 && position.arrowLeft <= position.width - 20);
    }
  }
  assert.equal(getFieldHelpPosition({ top: 20, bottom: 52, right: 900 },
    { width: 1440, height: 900 }, 200, 360).width, 360);
});

test('slug mantém os exemplos em lista e as palavras reservadas como código', () => {
  const { slug } = JSON.parse(readFileSync('src/content/wikiHelp.pt-BR.json', 'utf8'));
  const markup = render(React.createElement(api.FieldHelpBody, { content: slug }));
  assert.equal((markup.match(/<li>/g) ?? []).length, 5);
  for (const phrase of ['teste-de-pagina', 'MainPage', 'search', 'conexoes'])
    assert.match(markup, new RegExp(`<code[^>]*>${phrase}</code>`));
  assert.doesNotMatch(markup, /<dl>/);
});

test('tags usam o componente padrão com título sci-fi e destaques verde e dourado mesmo sem neon', () => {
  const { itemTags } = JSON.parse(readFileSync('src/content/wikiHelp.pt-BR.json', 'utf8'));
  const sheet = new api.ServerStyleSheet();
  try {
    const markup = render(sheet.collectStyles(React.createElement(api.HelpPopover, {
      $dark: true, $neon: false, $top: 0, $left: 0, $width: 360, $height: 440,
      $open: true, $below: true, $arrowLeft: 320, $compact: true,
    }, React.createElement(api.FieldHelpBody, { content: itemTags, ...itemTags.presentation }))));
    const css = sheet.getStyleTags();
    assert.match(markup, /<b[^>]*>Único:<\/b>/);
    assert.match(markup, /<b[^>]*>Lendário:<\/b>/);
    assert.match(css, /DO Futuristic/);
    assert.match(css, /text-transform:uppercase/);
    assert.match(css, /color:var\(--help-accent\)!important/);
    assert.match(css, /color:var\(--clearneonGreen\)!important/);
    assert.match(css, /color:var\(--deepneonYellow\)!important/);
    assert.match(css, /border:1px solid var\(--grey\)/);
    const adapter = readFileSync('src/routes/Management/ManagementWiki/WikiForms/FormCriarConteúdo/FormItem/ItemTagInfo.tsx', 'utf8');
    assert.match(adapter, /<FieldHelp /);
    assert.doesNotMatch(adapter, /TagInfoPopover|<details/);
  } finally { sheet.seal(); }
});

test('destaques dinâmicos não interpretam HTML e a aparência pode ser escolhida pelo conteúdo', () => {
  const markup = render(React.createElement(api.FieldHelpBody, {
    accent: 'danger', listStyle: 'plain', content: { id: 'teste', title: 'Aviso',
      text: '<script>alert(1)</script> Código A+B.', highlights: [{ text: 'A+B', style: 'code' }],
      items: [{ text: 'Recurso +5', highlights: [{ text: '+5', tone: 'positive' }] }],
    },
  }));
  assert.match(markup, /&lt;script&gt;/);
  assert.doesNotMatch(markup, /<script>/);
  assert.match(markup, /<code[^>]*>A\+B<\/code>/);
  assert.match(markup, /<b[^>]*>\+5<\/b>/);
});
