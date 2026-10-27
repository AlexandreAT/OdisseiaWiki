import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { build } from 'esbuild';
import React from 'react';
import { act, create } from 'react-test-renderer';

const bundle = await build({
  stdin: { contents: `export * from './src/routes/Management/ManagementSystem/components/SystemWorkspace/SystemWorkspace';
    export * from './src/routes/Management/ManagementWiki/WikiForms/FormBuscarConteúdo/EntityEditFloatingActions';
    export * from './src/routes/Hub/UserCharacters/CharacterEdit/CharacterEdit.style';
    export * from './src/components/Generic/CheckSelect/CheckSelect';
    export * from './src/components/Generic/InputText/InputText';
    export * from './src/routes/Management/ManagementSystem/components/SystemItemCatalog/SystemItemCatalog.style';
    export * from './src/content/itemCatalogHelp';
    export * from './src/services/sistemasRpgService';`, loader: 'ts', resolveDir: process.cwd() },
  plugins: [{ name: 'system-save-dependencies', setup(builder) {
    builder.onResolve({ filter: /^@mui\/icons-material\// }, ({ path }) => ({ path, namespace: 'test-icon' }));
    builder.onLoad({ filter: /.*/, namespace: 'test-icon' }, () => ({ loader: 'js',
      contents: `import {createElement} from 'react'; export default function Icon(){return createElement('svg');}` }));
    for (const name of ['ModuleEditor', 'SystemVersionOperations', 'ConfigTable']) {
      builder.onResolve({ filter: new RegExp(`/${name}/${name}$`) }, () => ({ path: name, namespace: 'test-leaf' }));
    }
    builder.onLoad({ filter: /.*/, namespace: 'test-leaf' }, ({ path }) => ({ loader: 'js',
      contents: `export function ${path}(){return null;}` }));
    builder.onResolve({ filter: /services\/sistemasRpgService$/ }, () => ({ path: 'catalog', namespace: 'test-api' }));
    builder.onLoad({ filter: /.*/, namespace: 'test-api' }, () => ({ loader: 'js', contents: `
      export const savedCatalogs = [];
      let resolveSave;
      export const finishSave = () => resolveSave();
      let fixture = {tipos: []}; export const setCatalogFixture = value => {fixture = value;};
      export const obterCatalogoItensSistemaRpg = async () => structuredClone(fixture);
      export const atualizarCatalogoItensSistemaRpg = (id, config) => {
        savedCatalogs.push({id, config});
        return new Promise(resolve => {resolveSave = () => resolve(config);});
      };` }));
    builder.onResolve({ filter: /^react-hot-toast$/ }, () => ({ path: 'toast', namespace: 'test-toast' }));
    builder.onLoad({ filter: /.*/, namespace: 'test-toast' }, () => ({ loader: 'js',
      contents: `export default {success(){},error(){}};` }));
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
const previousWindow = globalThis.window;
before(() => {
  globalThis.document = { addEventListener() {}, removeEventListener() {} };
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
});
after(() => {
  if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
  if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
});

const noop = () => {};
const base = {
  system: { nome: 'Odisseia', codigo: 'ODISSEIA', ativo: true, quantidadeMesas: 1 },
  versions: [], versionsLoading: false, versionsError: null,
  selectedVersion: { idSistemaVersao: 7, numeroVersao: '1.2', status: 'Rascunho', quantidadeMesas: 1 },
  activeModule: 'sobrevivencia', moduleConfig: {}, moduleLoading: false, moduleError: null,
  validationErrors: {}, dirty: false, saving: false, lastSavedAt: null, readOnly: false,
  raceOptions: [], theme: 'dark', neon: 'off',
  ...Object.fromEntries(['onBack', 'onEditSystem', 'onToggleSystem', 'onDeleteSystem', 'onRetryVersions',
    'onCreateVersion', 'onSelectVersion', 'onDuplicateVersion', 'onPublishVersion', 'onArchiveVersion',
    'onDeleteVersion', 'onMigrationComplete', 'onSelectModule', 'onChangeModule', 'onRetryModule',
    'onCreateEmptyModule', 'onSave', 'onDiscard', 'onCatalogDirtyChange'].map(key => [key, noop])),
};
const mount = async (props = {}) => {
  let renderer;
  await act(async () => { renderer = create(React.createElement(api.SystemWorkspace, { ...base, ...props })); });
  return renderer;
};
const quick = renderer => renderer.root.findByProps({ 'aria-label': 'Salvar alterações e continuar editando', type: 'button' });
const text = node => typeof node === 'string' ? node : (node.children ?? []).map(text).join('');
const addType = renderer => act(() => renderer.root.findAllByType('button').find(button => text(button).includes('Novo tipo')).props.onClick());

const archetype = (code, allowed) => ({ idSistemaItemEscopo: 0, codigo: code, nome: code, codigoCaminho: `TRAJE/PROTECOES/${code}`,
  nivel: 'Arquetipo', ativo: true, ordem: 1, filhos: [], campos: [], faixas: [], referencias: [], arquetiposCompativeis: allowed });
const catalogFixture = () => ({ tipos: [{ ...archetype('TRAJE'), nivel: 'Tipo', codigoCaminho: 'TRAJE', filhos: [
  {...archetype('PROTECOES'), nivel:'Categoria', filhos:[archetype('COLETE',['TRAJE/PROTECOES/OUTROS']),archetype('OUTROS',['TRAJE/PROTECOES/COLETE'])]},
] }] });

test('catálogo tem aba própria e alternar preserva o rascunho e o salvamento centralizado', async () => {
  api.setCatalogFixture(catalogFixture());
  const renderer = await mount();
  try {
    const tab = () => renderer.root.findAllByType('button').find(node => text(node) === 'Catálogo de itens');
    assert.equal(renderer.root.findByProps({'aria-label':'Catálogo de itens da versão'}).props.hidden,true);
    act(() => tab().props.onClick());
    assert.equal(tab().props['aria-pressed'],true);
    assert.equal(renderer.root.findByProps({'aria-label':'Configuração do módulo'}).props.hidden,true);
    act(() => renderer.root.findAllByType(api.InputText).find(node => node.props.label === 'Nome').props.onChange({target:{value:'Trajes alterados'}}));
    act(() => renderer.root.findAllByType('button').find(node => text(node) === 'Sobrevivência').props.onClick());
    assert.equal(renderer.root.findByProps({'aria-label':'Catálogo de itens da versão'}).props.hidden,true);
    act(() => tab().props.onClick());
    assert.equal(renderer.root.findAllByType(api.InputText).find(node => node.props.label === 'Nome').props.value,'Trajes alterados');
    assert.equal(quick(renderer).props.disabled,false);
  } finally { act(()=>renderer.unmount()); api.setCatalogFixture({tipos:[]}); }
});

test('compatibilidade usa CheckSelect padrão ao lado da exclusão e atualiza opções novas e pares', async () => {
  api.setCatalogFixture(catalogFixture());
  const renderer = await mount();
  try {
    const selects = () => renderer.root.findAllByType(api.CheckSelect);
    assert.equal(selects().length,2);
    assert.deepEqual(selects()[0].props.value,['TRAJE/PROTECOES/OUTROS']);
    act(()=>selects()[0].props.onChange([]));
    assert.deepEqual(selects()[1].props.value,[]);
    act(()=>renderer.root.findAllByType('button').find(node=>text(node).includes('Adicionar arquétipo')).props.onClick());
    const codes = () => renderer.root.findAllByType(api.InputText).filter(node=>node.props.label==='Código');
    act(()=>codes().at(-1).props.onChange({target:{value:'OCULOS'}}));
    const names = () => renderer.root.findAllByType(api.InputText).filter(node=>node.props.label==='Nome');
    act(()=>names().at(-1).props.onChange({target:{value:'Óculos'}}));
    assert.equal(selects().length,3);
    assert.equal(selects()[0].props.options.at(-1).label,'Óculos');
    act(()=>selects()[0].props.onChange(['TRAJE/PROTECOES/OCULOS']));
    assert.deepEqual(selects()[2].props.value,['TRAJE/PROTECOES/COLETE']);
    const tools = renderer.root.findAllByType(api.ScopeTools).filter(node=>node.findAllByType(api.CheckSelect).length);
    assert.equal(tools.length,3);
    assert.ok(text(tools[0]).includes('Excluir arquétipo'));
    const categories = renderer.root.findAllByType(api.ScopeCard).filter(node=>node.props.$depth===1);
    assert.equal(categories[0].props.open,true,'categoria única abre automaticamente');
    assert.ok(renderer.root.findAllByType(api.ScopeTableGroup).every(node=>!node.props.open),'tabelas começam recolhidas');
  } finally { act(()=>renderer.unmount()); api.setCatalogFixture({tipos:[]}); }
});

test('versão publicada permite consultar ajudas sem permitir editar a compatibilidade', async () => {
  api.setCatalogFixture(catalogFixture());
  const renderer = await mount({readOnly:true});
  try {
    assert.ok(renderer.root.findAllByType(api.CheckSelect).every(node=>node.props.disabled));
    assert.ok(renderer.root.findAllByType(api.InputText).every(node=>node.props.disabled));
    assert.ok(renderer.root.findAllByType(api.ScopeBody).every(node=>!node.props.disabled));
    assert.equal(api.resolveItemCatalogHelp('itens.0.0.faixas.valorMinimo').title,'Mínimo');
    assert.equal(api.resolveItemCatalogHelp('itens.0.nome'),undefined);
    assert.equal(api.resolveItemCatalogHelp('itens.0.campos.ordem').id,api.itemCatalogHelp.ordem.id);
    const help = renderer.root.findAllByProps({role:'button'}).find(node=>String(node.props['aria-label']).includes('Pode usar junto com'));
    assert.ok(help && !help.props.disabled);
    const combobox = renderer.root.findAllByProps({role:'combobox'})[0];
    assert.equal(combobox.props['aria-disabled'],true); assert.equal(combobox.props.tabIndex,-1);
    act(()=>combobox.props.onKeyDown({key:'Enter',preventDefault(){},stopPropagation(){}}));
    assert.equal(renderer.root.findAllByProps({role:'combobox'})[0].props['aria-expanded'],false);
  } finally { act(()=>renderer.unmount()); api.setCatalogFixture({tipos:[]}); }
});

test('sistema reutiliza exatamente os controles e as posições responsivas da ficha', async () => {
  const renderer = await mount();
  assert.equal(renderer.root.findAllByType(api.EntityEditFloatingActions).length, 1);
  assert.equal(renderer.root.findAllByType(api.FloatingActions).length, 1);
  assert.equal(renderer.root.findAllByType(api.FloatingSaveButton).length, 1);
  assert.equal(renderer.root.findAllByType(api.SyncIconBadge).length, 1);
  assert.equal(quick(renderer).props.disabled, true);
  assert.equal(renderer.root.findByType(api.SyncIconBadge).props.synced, true);
  act(() => renderer.unmount());
});

test('salvar rápido chama o salvamento existente e mantém spinner e estado de alterações', async () => {
  let saves = 0;
  const props = { ...base, dirty: true, onSave: () => { saves++; } };
  const renderer = await mount(props);
  assert.equal(quick(renderer).props.disabled, false);
  assert.equal(renderer.root.findByType(api.SyncIconBadge).props.synced, false);
  act(() => quick(renderer).props.onClick());
  assert.equal(saves, 1);
  act(() => renderer.update(React.createElement(api.SystemWorkspace, { ...props, saving: true })));
  assert.equal(quick(renderer).props.disabled, true);
  assert.equal(quick(renderer).props['aria-busy'], true);
  assert.equal(renderer.root.findAllByProps({ role: 'status', 'aria-label': 'Salvando' }).length > 0, true);
  act(() => quick(renderer).props.onClick());
  assert.equal(saves, 1);
  act(() => renderer.update(React.createElement(api.SystemWorkspace, { ...props, dirty: false })));
  assert.equal(renderer.root.findByType(api.SyncIconBadge).props.synced, true);
  assert.equal(quick(renderer).props.disabled, true);
  act(() => renderer.unmount());
});

test('catálogo também participa do salvar rápido, com validação e confirmação real da API', async () => {
  api.savedCatalogs.length = 0;
  let moduleSaves = 0;
  const renderer = await mount({ onSave: () => { moduleSaves++; } });
  addType(renderer);
  assert.equal(renderer.root.findByType(api.SyncIconBadge).props.synced, false);
  await act(async () => quick(renderer).props.onClick());
  assert.equal(api.savedCatalogs.length, 0, 'não salva catálogo inválido');
  assert.equal(renderer.root.findByType(api.SyncIconBadge).props.synced, false);
  const fields = renderer.root.findAllByType('input');
  act(() => fields.find(field => field.props.required).props.onChange({ target: { value: 'ARMA' } }));
  act(() => renderer.root.findAllByType('input').filter(field => field.props.required)[1].props.onChange({ target: { value: 'Arma' } }));
  await act(async () => quick(renderer).props.onClick());
  assert.equal(api.savedCatalogs.length, 1);
  assert.equal(api.savedCatalogs[0].id, 7);
  assert.equal(api.savedCatalogs[0].config.tipos[0].nome, 'Arma');
  assert.equal(moduleSaves, 0, 'módulo sem alterações não é reenviado');
  assert.equal(quick(renderer).props['aria-busy'], true);
  assert.ok(renderer.root.findAllByType(api.InputText).every(node => node.props.disabled), 'impede perder edições durante o salvamento');
  assert.equal(renderer.root.findAllByType('button').find(button => text(button).includes('Novo tipo')).props.disabled, true);
  act(() => quick(renderer).props.onClick());
  assert.equal(api.savedCatalogs.length, 1, 'bloqueia duplo clique');
  await act(async () => api.finishSave());
  assert.ok(renderer.root.findAllByType(api.InputText).every(node => !node.props.disabled), 'libera edição após confirmação');
  assert.equal(renderer.root.findByType(api.SyncIconBadge).props.synced, true);
  act(() => renderer.unmount());
});

test('não mostra salvamento em versões somente leitura ou sem versão selecionada', async () => {
  for (const props of [{ readOnly: true }, { selectedVersion: null }]) {
    const renderer = await mount(props);
    assert.equal(renderer.root.findAllByType(api.EntityEditFloatingActions).length, 0);
    act(() => renderer.unmount());
  }
});

test('um clique salva módulo e catálogo alterados sem declarar sucesso se o módulo continua pendente', async () => {
  api.savedCatalogs.length = 0;
  let moduleSaves = 0;
  const renderer = await mount({ dirty: true, onSave: () => { moduleSaves++; } });
  addType(renderer);
  act(() => renderer.root.findAllByType('input').filter(field => field.props.required)[0].props.onChange({ target: { value: 'TRAJE' } }));
  act(() => renderer.root.findAllByType('input').filter(field => field.props.required)[1].props.onChange({ target: { value: 'Traje' } }));
  await act(async () => quick(renderer).props.onClick());
  assert.equal(moduleSaves, 1);
  assert.equal(api.savedCatalogs.length, 1);
  await act(async () => api.finishSave());
  assert.equal(renderer.root.findByType(api.SyncIconBadge).props.synced, false);
  act(() => renderer.unmount());
});

test('trocar versão não reaproveita alterações pendentes do catálogo anterior', async () => {
  const renderer = await mount();
  addType(renderer);
  assert.equal(quick(renderer).props.disabled, false);
  await act(async () => renderer.update(React.createElement(api.SystemWorkspace, {
    ...base, selectedVersion: { ...base.selectedVersion, idSistemaVersao: 8 },
  })));
  assert.equal(renderer.root.findByType(api.SyncIconBadge).props.synced, true);
  assert.equal(quick(renderer).props.disabled, true);
  act(() => renderer.unmount());
});
