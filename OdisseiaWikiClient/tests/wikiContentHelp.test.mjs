import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const bundle = await build({
  stdin: { contents: `export * from './src/content/wikiContentHelp';
    export * from './src/components/Generic/FieldHelp/WikiContentHelpProvider';
    export * from './src/components/Generic/FieldHelp/FieldHelp';
    export * from './src/components/Generic/InputText/InputText';
    export * from './src/components/Generic/Select/Select';
    export * from './src/components/Generic/CheckBox/CheckBox';`, loader: 'ts', resolveDir: process.cwd() },
  bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic', mainFields: ['module', 'main'],
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  banner: { js: `import {createRequire} from 'node:module'; const require=createRequire(${JSON.stringify(import.meta.url)});` },
});
const source = bundle.outputFiles[0].text.replace(/((?:from|import)\s*)(["'])(react(?:-dom|\/jsx-runtime)?)\2/g,
  (_, prefix, _quote, name) => prefix + JSON.stringify(import.meta.resolve(name)));
const api = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
  .catch(error => { throw new Error(error.message.replace(/data:text\/javascript;base64,[A-Za-z0-9+/=]+/g, '[test bundle]')); });
const { getWikiContentHelp, wikiContentHelpCatalogue, WikiContentHelpProvider } = api;
const forms = 'src/routes/Management/ManagementWiki/WikiForms/FormCriarConteúdo';

test('explicações da wiki têm identidade estável, texto cru e aliases explícitos', () => {
  const ids = new Set();
  for (const [scope, entries] of Object.entries(wikiContentHelpCatalogue)) {
    for (const [key, entry] of Object.entries(entries)) {
      const help = getWikiContentHelp(scope, key);
      assert.ok(help.title.trim()); assert.ok(help.text.trim());
      assert.equal(help.id, `wiki.content.${scope}.${key}`);
      assert.ok(!ids.has(help.id)); ids.add(help.id);
      assert.equal(help.presentation.density, 'compact');
      for (const label of entry.labels) {
        assert.equal(getWikiContentHelp(scope, label), help);
        assert.equal(getWikiContentHelp(scope, ` ${label.toUpperCase()} * `), help);
      }
    }
  }
});

test('campos óbvios e nomes dinâmicos não recebem definições presumidas', () => {
  for (const scope of Object.keys(wikiContentHelpCatalogue)) {
    for (const label of ['Nome', 'Nome do Item *', 'Título *', 'Imagem', 'Cidade', 'RESISTÊNCIA', 'Meu atributo', 'Minha condição'])
      assert.equal(getWikiContentHelp(scope, label), undefined, `${scope}.${label}`);
  }
  assert.equal(getWikiContentHelp('item', 'Duração (opcional)'), undefined);
  assert.equal(getWikiContentHelp('condition', 'Efeito'), undefined);
  assert.notEqual(getWikiContentHelp('condition', 'Duração (opcional)').id,
    getWikiContentHelp('equipment', 'Duração').id);
});

test('os cinco formulários ligam as seções ao catálogo correto', () => {
  for (const [name, scope] of [['FormItem', 'item'], ['FormRace', 'race'], ['FormCity', 'city'],
    ['FormCharacter', 'character'], ['FormPage', 'page']]) {
    const form = readFileSync(`${forms}/${name}/${name}.tsx`, 'utf8');
    assert.match(form, new RegExp(`<WikiContentHelpProvider scope="${scope}" theme=\\{theme\\} neon=\\{neon\\}>`));
    for (const [, label] of form.matchAll(/<FieldHelp label="([^"]+)"/g))
      assert.ok(getWikiContentHelp(scope, label), `${name}: ${label}`);
  }
  const fields = readFileSync(`${forms}/FormCharacter/MapItensForm.tsx`, 'utf8');
  for (const scope of ['equipment', 'test', 'condition'])
    assert.match(fields, new RegExp(`<WikiContentHelpProvider scope="${scope}"`));
  assert.match(fields, /help=\{getWikiContentHelp\('equipment', 'attributeBonus'\)\}/);
  assert.match(fields, /help=\{getWikiContentHelp\('condition', 'value'\)\}/);
});

test('ajuda contextual reutiliza o I padrão sem alterar valor, seleção ou modo visual', () => {
  const previous = console.error;
  console.error = (message, ...args) => {
    if (/non-boolean attribute|React does not recognize/.test(String(message))) return;
    previous(message, ...args);
  };
  try {
    for (const theme of ['dark', 'light']) for (const neon of ['on', 'off']) {
      const markup = renderToStaticMarkup(React.createElement(WikiContentHelpProvider,
        { scope: 'condition', theme, neon },
        React.createElement(api.InputText, { label: 'Duração (opcional)', value: 4, theme, neon }),
        React.createElement(api.Select, { label: 'Quando aplicar', value: 'AO_USAR', theme, neon,
          options: [{ value: 'AO_USAR', label: 'Ao usar a ação' }] }),
        React.createElement(api.FieldHelp, { label: 'Condições aplicadas', inline: true })));
      assert.match(markup, /data-field-help="wiki.content.condition.duration"/);
      assert.match(markup, /data-field-help="wiki.content.condition.trigger"/);
      assert.match(markup, /data-field-help="wiki.content.condition.section"/);
      assert.match(markup, /value="4"/);
      assert.match(markup, /value="AO_USAR" selected=""/);
      assert.match(markup, /aria-label="Ajuda: Quando aplicar"/);
      assert.match(markup, /aria-expanded="false"/);
    }
  } finally { console.error = previous; }
});

test('explicações diferenciam descrição, recuperação imediata, duração e defesas', () => {
  assert.match(getWikiContentHelp('equipment', 'Efeito').text, /não é lido como regra automática/);
  assert.match(getWikiContentHelp('equipment', 'Restaura Vida').text, /ao consumir uma unidade/);
  assert.match(getWikiContentHelp('condition', 'Duração em').text, /não pelo relógio real/);
  assert.match(getWikiContentHelp('equipment', 'Proteção').text, /continua gasto ao desequipar/);
  assert.match(getWikiContentHelp('equipment', 'Escudo').text, /único impacto/);
  assert.match(getWikiContentHelp('equipment', 'Armadura').text, /Não é uma barra/);
  assert.match(getWikiContentHelp('binding', 'Acompanhar publicação atual').text, /não atualiza automaticamente/);
});

test('cadência, custo de munição e limites do Sistema não são apresentados como a mesma regra', () => {
  assert.match(getWikiContentHelp('equipment', 'Cadência por turno').text, /não é o teto de tiros por turno/);
  assert.match(getWikiContentHelp('equipment', 'Cadência por turno').text, /rolagem manual/);
  assert.match(getWikiContentHelp('equipment', 'Munição por tiro').text, /três tiros no turno gastam três balas/);
  assert.match(getWikiContentHelp('equipment', 'Munição por rajada').text, /Vazio ou zero usa a cadência/);
  assert.match(getWikiContentHelp('equipment', 'Limite de tiros por turno (0 = livre)').text, /Sistema permite 5/);
  assert.match(getWikiContentHelp('equipment', 'Limite de ataques por turno (0 = livre)').text, /menor limite aplicável/);
  assert.match(getWikiContentHelp('equipment', 'Capacidade de munição').text, /Não define o limite de tiros por turno/);
  assert.match(getWikiContentHelp('equipment', 'Controlar munição pela engine').text, /mesmo se esta opção antiga estiver desmarcada/);
});

test('slug e tags preservam suas ajudas especiais e referências passam ao I padrão', () => {
  const page = readFileSync(`${forms}/FormPage/FormPage.tsx`, 'utf8');
  const tags = readFileSync(`${forms}/FormItem/ItemTagInfo.tsx`, 'utf8');
  assert.match(page, /help=\{wikiHelp.slug as FieldHelpContent\}/);
  assert.match(tags, /wikiHelp.itemTags/);
  const references = readFileSync(`${forms}/FormPage/PageBlockComponents/RelationBlockEditor.tsx`, 'utf8');
  assert.match(references, /<FieldHelp label="Referências da página"/);
  assert.doesNotMatch(references, /ReferenceInfoPopover|showReferenceInfo/);
});
