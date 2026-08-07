import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { InputText } from '../../../../../components/Generic/InputText/InputText';
import { LoadingIndicator } from '../../../../../components/Generic/LoadingIndicator';
import { TextArea } from '../../../../../components/Generic/TextArea/TextArea';
import {
  SistemaItemCampoRuntime,
  SistemaItemEscopoRuntime,
  SistemaItemFaixaRuntime,
  SistemaItemReferenciaRuntime,
  SistemaItensConfig,
} from '../../../../../models/SistemaRpg';
import {
  atualizarCatalogoItensSistemaRpg,
  obterCatalogoItensSistemaRpg,
} from '../../../../../services/sistemasRpgService';
import { getApiErrorMessage } from '../../../../../utils/apiError';
import { ActionButton } from '../../ManagementSystem.style';
import { ConfigTable, ConfigTableColumn } from '../ConfigTable/ConfigTable';
import {
  CatalogBody,
  CatalogFooter,
  CatalogHeader,
  CatalogNotice,
  CatalogPanel,
  CatalogTree,
  ChildrenGroup,
  ScopeBadge,
  ScopeBody,
  ScopeCard,
  ScopeMetaGrid,
  ScopeSummary,
  ScopeTables,
  ScopeTools,
  ToggleField,
} from './SystemItemCatalog.style';

type ScopeLevel = 'Tipo' | 'Categoria' | 'Arquetipo';

interface SystemItemCatalogProps {
  idSistemaVersao: number;
  readOnly: boolean;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  onDirtyChange?: (dirty: boolean) => void;
}

interface ScopeEditorProps {
  scope: SistemaItemEscopoRuntime;
  path: number[];
  depth: number;
  readOnly: boolean;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  onPatch: (path: number[], patch: (scope: SistemaItemEscopoRuntime) => SistemaItemEscopoRuntime) => void;
  onRemove: (path: number[]) => void;
  onAddChild: (path: number[]) => void;
}

const FIELD_TYPES = ['Texto', 'Inteiro', 'Decimal', 'Booleano', 'Codigo', 'Lista'];
const REFERENCE_TYPES = [
  'TipoDano',
  'TipoDefesa',
  'Alcance',
  'Material',
  'ParteCorpo',
  'Lado',
  'Modificacao',
  'Lacrima',
  'Outro',
];

const fieldColumns: ConfigTableColumn<SistemaItemCampoRuntime>[] = [
  { key: 'codigo', label: 'Código', type: 'text', maxLength: 50 },
  { key: 'nome', label: 'Nome', type: 'text', maxLength: 150 },
  {
    key: 'tipo',
    label: 'Tipo do valor',
    type: 'select',
    options: FIELD_TYPES.map((value) => ({ label: value, value })),
  },
  { key: 'unidade', label: 'Unidade', type: 'text', maxLength: 50 },
  { key: 'obrigatorio', label: 'Obrigatório', type: 'checkbox' },
  { key: 'descricao', label: 'Descrição', type: 'textarea', maxLength: 600 },
  { key: 'ordem', label: 'Ordem', type: 'number', min: 0 },
];

const rangeColumns: ConfigTableColumn<SistemaItemFaixaRuntime>[] = [
  { key: 'codigoCampo', label: 'Código do campo', type: 'text', maxLength: 50 },
  { key: 'nome', label: 'Nome', type: 'text', maxLength: 150 },
  { key: 'valorMinimo', label: 'Mínimo', type: 'number', nullable: true, step: 0.01 },
  { key: 'valorMaximo', label: 'Máximo', type: 'number', nullable: true, step: 0.01 },
  { key: 'valorReferencia', label: 'Referência', type: 'number', nullable: true, step: 0.01 },
  { key: 'unidade', label: 'Unidade', type: 'text', maxLength: 50 },
  { key: 'descricao', label: 'Descrição', type: 'textarea', maxLength: 600 },
  { key: 'ordem', label: 'Ordem', type: 'number', min: 0 },
];

const referenceColumns: ConfigTableColumn<SistemaItemReferenciaRuntime>[] = [
  {
    key: 'tipo',
    label: 'Tipo',
    type: 'select',
    options: REFERENCE_TYPES.map((value) => ({ label: value, value })),
  },
  { key: 'codigo', label: 'Código', type: 'text', maxLength: 50 },
  { key: 'nome', label: 'Nome', type: 'text', maxLength: 150 },
  { key: 'valor', label: 'Valor', type: 'text', maxLength: 250 },
  { key: 'descricao', label: 'Descrição', type: 'textarea', maxLength: 600 },
  { key: 'ordem', label: 'Ordem', type: 'number', min: 0 },
];

const createField = (): SistemaItemCampoRuntime => ({
  idSistemaItemCampo: 0,
  codigo: '',
  nome: '',
  tipo: 'Texto',
  unidade: '',
  obrigatorio: false,
  descricao: '',
  ordem: 1,
  codigoCaminhoOrigem: null,
});

const createRange = (): SistemaItemFaixaRuntime => ({
  idSistemaItemFaixa: 0,
  codigoCampo: '',
  nome: '',
  valorMinimo: null,
  valorMaximo: null,
  valorReferencia: null,
  unidade: '',
  descricao: '',
  ordem: 1,
  codigoCaminhoOrigem: null,
});

const createReference = (): SistemaItemReferenciaRuntime => ({
  idSistemaItemReferencia: 0,
  tipo: 'Outro',
  codigo: '',
  nome: '',
  valor: '',
  descricao: '',
  ordem: 1,
  codigoCaminhoOrigem: null,
});

const nextLevel = (level: string): ScopeLevel | null => {
  if (level === 'Tipo') return 'Categoria';
  if (level === 'Categoria') return 'Arquetipo';
  return null;
};

const createScope = (
  level: ScopeLevel,
  order: number,
  parent?: SistemaItemEscopoRuntime,
): SistemaItemEscopoRuntime => ({
  idSistemaItemEscopo: 0,
  idEscopoPai: parent?.idSistemaItemEscopo || null,
  nivel: level,
  codigo: '',
  codigoCaminho: '',
  nome: '',
  descricao: '',
  ordem: order,
  ativo: true,
  campos: [],
  faixas: [],
  referencias: [],
  filhos: [],
});

const normalizeScope = (scope: SistemaItemEscopoRuntime): SistemaItemEscopoRuntime => ({
  ...scope,
  campos: Array.isArray(scope.campos) ? scope.campos : [],
  faixas: Array.isArray(scope.faixas) ? scope.faixas : [],
  referencias: Array.isArray(scope.referencias) ? scope.referencias : [],
  filhos: Array.isArray(scope.filhos) ? scope.filhos.map(normalizeScope) : [],
});

const normalizeCatalog = (catalog: SistemaItensConfig): SistemaItensConfig => ({
  tipos: Array.isArray(catalog.tipos) ? catalog.tipos.map(normalizeScope) : [],
});

const updateAtPath = (
  scopes: SistemaItemEscopoRuntime[],
  path: number[],
  patch: (scope: SistemaItemEscopoRuntime) => SistemaItemEscopoRuntime,
): SistemaItemEscopoRuntime[] => {
  const [current, ...rest] = path;
  return scopes.map((scope, index) => {
    if (index !== current) return scope;
    if (rest.length === 0) return patch(scope);
    return { ...scope, filhos: updateAtPath(scope.filhos, rest, patch) };
  });
};

const removeAtPath = (
  scopes: SistemaItemEscopoRuntime[],
  path: number[],
): SistemaItemEscopoRuntime[] => {
  const [current, ...rest] = path;
  if (rest.length === 0) {
    return scopes
      .filter((_, index) => index !== current)
      .map((scope, index) => ({ ...scope, ordem: index + 1 }));
  }
  return scopes.map((scope, index) => (
    index === current ? { ...scope, filhos: removeAtPath(scope.filhos, rest) } : scope
  ));
};

const validateCatalog = (catalog: SistemaItensConfig): string | null => {
  const paths = new Set<string>();
  const walk = (
    scopes: SistemaItemEscopoRuntime[],
    expectedLevel: ScopeLevel,
    parentPath = '',
  ): string | null => {
    for (const scope of scopes) {
      if (scope.nivel !== expectedLevel) return `O nível de “${scope.nome || 'escopo sem nome'}” é inválido.`;
      if (!scope.codigo.trim() || !scope.nome.trim()) return 'Todo tipo, categoria e arquétipo precisa de código e nome.';
      const code = scope.codigo.trim().toUpperCase();
      const path = parentPath ? `${parentPath}/${code}` : code;
      if (paths.has(path)) return `O caminho ${path} está duplicado.`;
      paths.add(path);
      if (scope.campos.some((field) => !field.codigo.trim() || !field.nome.trim())) {
        return `Todos os campos de ${scope.nome} precisam de código e nome.`;
      }
      if (scope.faixas.some((range) => !range.codigoCampo.trim() || !range.nome.trim())) {
        return `Todas as faixas de ${scope.nome} precisam do código do campo e de um nome.`;
      }
      if (scope.referencias.some((reference) => !reference.codigo.trim() || !reference.nome.trim())) {
        return `Todas as referências de ${scope.nome} precisam de código e nome.`;
      }
      const childLevel = nextLevel(expectedLevel);
      if (!childLevel && scope.filhos.length > 0) return `O arquétipo ${scope.nome} não pode ter filhos.`;
      if (childLevel) {
        const childError = walk(scope.filhos, childLevel, path);
        if (childError) return childError;
      }
    }
    return null;
  };
  return walk(catalog.tipos, 'Tipo');
};

const ScopeEditor = ({
  scope,
  path,
  depth,
  readOnly,
  theme,
  neon,
  onPatch,
  onRemove,
  onAddChild,
}: ScopeEditorProps) => {
  const childLevel = nextLevel(scope.nivel);
  const pathKey = `itens.${path.join('.')}`;
  const patch = (next: Partial<SistemaItemEscopoRuntime>) => onPatch(
    path,
    (current) => ({ ...current, ...next }),
  );

  return (
    <ScopeCard theme={theme} neon={neon} $depth={depth}>
      <ScopeSummary>
        <ScopeBadge $inactive={!scope.ativo}>{scope.nivel}</ScopeBadge>
        <span className="scope-name">{scope.nome || `Novo ${scope.nivel.toLocaleLowerCase('pt-BR')}`}</span>
        <code>{scope.codigoCaminho || scope.codigo || 'SEM_CODIGO'}</code>
        <small>{scope.filhos.length} {scope.filhos.length === 1 ? 'filho' : 'filhos'}</small>
      </ScopeSummary>

      <ScopeBody disabled={readOnly}>
        <ScopeMetaGrid>
          <InputText
            theme={theme}
            neon={neon}
            label="Código"
            value={scope.codigo}
            onChange={(event) => patch({ codigo: event.target.value.toUpperCase() })}
            required
          />
          <InputText
            theme={theme}
            neon={neon}
            label="Nome"
            value={scope.nome}
            onChange={(event) => patch({ nome: event.target.value })}
            required
          />
          <InputText
            theme={theme}
            neon={neon}
            label="Ordem"
            type="number"
            value={scope.ordem}
            onChange={(event) => patch({ ordem: Number(event.target.value) })}
          />
          <ToggleField>
            <input
              type="checkbox"
              checked={scope.ativo}
              onChange={(event) => patch({ ativo: event.target.checked })}
            />
            Ativo no runtime
          </ToggleField>
        </ScopeMetaGrid>

        <TextArea
          theme={theme}
          neon={neon}
          label="Descrição do escopo"
          value={scope.descricao ?? ''}
          onChange={(event) => patch({ descricao: event.target.value })}
          rows={2}
          fullWidth
        />

        {!readOnly && (
          <ScopeTools>
            {childLevel && (
              <ActionButton type="button" theme={theme} neon={neon} $compact onClick={() => onAddChild(path)}>
                <AddIcon /> Adicionar {childLevel.toLocaleLowerCase('pt-BR')}
              </ActionButton>
            )}
            <ActionButton type="button" theme={theme} neon={neon} $compact $danger onClick={() => onRemove(path)}>
              <DeleteOutlineIcon /> Excluir {scope.nivel.toLocaleLowerCase('pt-BR')}
            </ActionButton>
          </ScopeTools>
        )}

        <ScopeTables>
          <ConfigTable
            title="Campos"
            description="Propriedades aceitas neste nível. Campos dos níveis superiores são herdados."
            rows={scope.campos}
            columns={fieldColumns}
            createRow={createField}
            onChange={(campos) => patch({ campos })}
            theme={theme}
            neon={neon}
            readOnly={readOnly}
            errorPath={`${pathKey}.campos`}
          />
          <ConfigTable
            title="Faixas e escalas"
            description="Limites conhecidos e valor de referência usados pelo runtime e pelos gráficos."
            rows={scope.faixas}
            columns={rangeColumns}
            createRow={createRange}
            onChange={(faixas) => patch({ faixas })}
            theme={theme}
            neon={neon}
            readOnly={readOnly}
            errorPath={`${pathKey}.faixas`}
          />
          <ConfigTable
            title="Referências"
            description="Opções mecânicas como tipos de dano, defesa, alcance, materiais e slots."
            rows={scope.referencias}
            columns={referenceColumns}
            createRow={createReference}
            onChange={(referencias) => patch({ referencias })}
            theme={theme}
            neon={neon}
            readOnly={readOnly}
            errorPath={`${pathKey}.referencias`}
          />
        </ScopeTables>

        {childLevel && scope.filhos.length > 0 && (
          <ChildrenGroup>
            <h5>{childLevel === 'Categoria' ? 'Categorias' : 'Arquétipos'} de {scope.nome || scope.codigo}</h5>
            {scope.filhos.map((child, index) => (
              <ScopeEditor
                key={`${pathKey}-${child.idSistemaItemEscopo || index}`}
                scope={child}
                path={[...path, index]}
                depth={depth + 1}
                readOnly={readOnly}
                theme={theme}
                neon={neon}
                onPatch={onPatch}
                onRemove={onRemove}
                onAddChild={onAddChild}
              />
            ))}
          </ChildrenGroup>
        )}
      </ScopeBody>
    </ScopeCard>
  );
};

export const SystemItemCatalog = ({
  idSistemaVersao,
  readOnly,
  theme,
  neon,
  onDirtyChange,
}: SystemItemCatalogProps) => {
  const [catalog, setCatalog] = useState<SistemaItensConfig | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const dirty = useMemo(
    () => catalog !== null && JSON.stringify(catalog) !== savedSnapshot,
    [catalog, savedSnapshot],
  );

  const loadCatalog = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    setValidationError(null);
    try {
      const response = normalizeCatalog(await obterCatalogoItensSistemaRpg(
        idSistemaVersao,
        { signal },
      ));
      setCatalog(response);
      setSavedSnapshot(JSON.stringify(response));
    } catch (requestError) {
      if (signal?.aborted) return;
      setCatalog(null);
      setSavedSnapshot('');
      setError(getApiErrorMessage(requestError, 'Não foi possível carregar o catálogo de itens.'));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [idSistemaVersao]);

  useEffect(() => {
    const controller = new AbortController();
    void loadCatalog(controller.signal);
    return () => controller.abort();
  }, [loadCatalog]);

  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (!dirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty]);

  const patchScope = useCallback((
    path: number[],
    patch: (scope: SistemaItemEscopoRuntime) => SistemaItemEscopoRuntime,
  ) => {
    setCatalog((current) => current
      ? { ...current, tipos: updateAtPath(current.tipos, path, patch) }
      : current);
    setValidationError(null);
  }, []);

  const removeScope = useCallback((path: number[]) => {
    setCatalog((current) => current
      ? { ...current, tipos: removeAtPath(current.tipos, path) }
      : current);
    setValidationError(null);
  }, []);

  const addChild = useCallback((path: number[]) => {
    setCatalog((current) => {
      if (!current) return current;
      return {
        ...current,
        tipos: updateAtPath(current.tipos, path, (scope) => {
          const level = nextLevel(scope.nivel);
          if (!level) return scope;
          return {
            ...scope,
            filhos: [...scope.filhos, createScope(level, scope.filhos.length + 1, scope)],
          };
        }),
      };
    });
    setValidationError(null);
  }, []);

  const addType = useCallback(() => {
    setCatalog((current) => ({
      tipos: [...(current?.tipos ?? []), createScope('Tipo', (current?.tipos.length ?? 0) + 1)],
    }));
    setValidationError(null);
  }, []);

  const save = useCallback(async () => {
    if (!catalog || readOnly || !dirty) return;
    const localError = validateCatalog(catalog);
    if (localError) {
      setValidationError(localError);
      toast.error(localError);
      return;
    }

    setSaving(true);
    setValidationError(null);
    try {
      const saved = normalizeCatalog(await atualizarCatalogoItensSistemaRpg(
        idSistemaVersao,
        catalog,
      ));
      setCatalog(saved);
      setSavedSnapshot(JSON.stringify(saved));
      toast.success('Catálogo de itens salvo.');
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, 'Não foi possível salvar o catálogo de itens.');
      setValidationError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [catalog, dirty, idSistemaVersao, readOnly]);

  return (
    <CatalogPanel theme={theme} neon={neon}>
      <CatalogHeader>
        <div>
          <h3><Inventory2OutlinedIcon /> Catálogo versionado de itens</h3>
          <p>
            Organize tipos, categorias e arquétipos. Campos, faixas e referências são herdados
            pelos níveis abaixo e consumidos pelos formulários e páginas no runtime.
          </p>
        </div>
        <div className="catalog-header-actions">
          <ActionButton
            type="button"
            theme={theme}
            neon={neon}
            $compact
            disabled={loading || saving}
            onClick={() => void loadCatalog()}
          >
            <RefreshIcon /> Recarregar
          </ActionButton>
          {!readOnly && (
            <ActionButton type="button" theme={theme} neon={neon} $compact onClick={addType} disabled={loading}>
              <AddIcon /> Novo tipo
            </ActionButton>
          )}
        </div>
      </CatalogHeader>

      <CatalogBody>
        {readOnly && (
          <CatalogNotice $warning>
            Este catálogo é somente leitura. Duplique a versão para alterar suas regras de itens.
          </CatalogNotice>
        )}
        {loading && <CatalogNotice role="status"><LoadingIndicator compact label="Carregando catálogo de itens" /></CatalogNotice>}
        {!loading && error && (
          <CatalogNotice $error role="alert">{error}</CatalogNotice>
        )}
        {!loading && !error && catalog && catalog.tipos.length === 0 && (
          <CatalogNotice>
            Nenhum tipo configurado nesta versão. O runtime manterá os fallbacks legados até o catálogo ser preenchido.
          </CatalogNotice>
        )}
        {!loading && !error && catalog && catalog.tipos.length > 0 && (
          <CatalogTree>
            {catalog.tipos.map((scope, index) => (
              <ScopeEditor
                key={scope.idSistemaItemEscopo || index}
                scope={scope}
                path={[index]}
                depth={0}
                readOnly={readOnly}
                theme={theme}
                neon={neon}
                onPatch={patchScope}
                onRemove={removeScope}
                onAddChild={addChild}
              />
            ))}
          </CatalogTree>
        )}
        {validationError && <CatalogNotice $error role="alert">{validationError}</CatalogNotice>}

        {!readOnly && catalog && !loading && !error && (
          <CatalogFooter>
            <span>{dirty ? 'Alterações não salvas no catálogo.' : 'Catálogo sincronizado.'}</span>
            <div className="catalog-save-actions">
              {dirty && (
                <ActionButton
                  type="button"
                  theme={theme}
                  neon={neon}
                  $compact
                  disabled={saving}
                  onClick={() => void loadCatalog()}
                >
                  <RefreshIcon /> Descartar
                </ActionButton>
              )}
              <ActionButton
                type="button"
                theme={theme}
                neon={neon}
                $compact
                disabled={!dirty || saving}
                onClick={() => void save()}
              >
                <SaveOutlinedIcon /> {saving ? 'Salvando...' : 'Salvar catálogo'}
              </ActionButton>
            </div>
          </CatalogFooter>
        )}
      </CatalogBody>
    </CatalogPanel>
  );
};
