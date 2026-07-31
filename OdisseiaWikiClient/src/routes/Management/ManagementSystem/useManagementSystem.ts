import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AtualizarSistemaRpgPayload,
  CriarSistemaRpgPayload,
  CriarSistemaVersaoPayload,
  DuplicarSistemaVersaoPayload,
  isSistemaVersaoRascunho,
  SistemaModuloConfigMap,
  SistemaModuloKey,
  SistemaRpgResumo,
  SistemaVersaoResumo,
} from '../../../models/SistemaRpg';
import { getRacas } from '../../../services/racasService';
import {
  arquivarVersaoSistemaRpg,
  atualizarConfiguracaoSistemaRpg,
  atualizarSistemaRpg,
  criarSistemaRpg,
  criarVersaoSistemaRpg,
  duplicarVersaoSistemaRpg,
  excluirSistemaRpg,
  excluirVersaoSistemaRpg,
  listarSistemasRpg,
  listarVersoesSistemaRpg,
  obterConfiguracaoSistemaRpg,
  publicarVersaoSistemaRpg,
} from '../../../services/sistemasRpgService';
import { getApiErrorMessage } from '../../../utils/apiError';
import { revealFirstValidationError } from '../../../utils/formValidationFeedback';
import { RaceOption } from './components/ModuleForms/ModuleForm.types';
import { createDefaultModuleConfig, normalizeModuleConfig } from './systemDefaults';
import { SistemaValidationErrors, validateSistemaModule } from './systemValidation';

type AnyModuleConfig = SistemaModuloConfigMap[SistemaModuloKey];

interface ManagementSystemState {
  systems: SistemaRpgResumo[];
  systemsLoading: boolean;
  systemsError: string | null;
  selectedSystem: SistemaRpgResumo | null;
  versions: SistemaVersaoResumo[];
  versionsLoading: boolean;
  versionsError: string | null;
  selectedVersion: SistemaVersaoResumo | null;
  activeModule: SistemaModuloKey;
  moduleConfig: AnyModuleConfig | null;
  moduleLoading: boolean;
  moduleError: string | null;
  validationErrors: SistemaValidationErrors;
  dirty: boolean;
  saving: boolean;
  lastSavedAt: Date | null;
  raceOptions: RaceOption[];
  isReadOnly: boolean;
}

const MODULE_KEYS: SistemaModuloKey[] = [
  'geral',
  'criacao',
  'progressao',
  'exploracao',
  'combate',
  'poderes',
  'sobrevivencia',
];

const parseInitialQuery = () => {
  const params = new URLSearchParams(window.location.search);
  const systemId = Number(params.get('system'));
  const versionId = Number(params.get('version'));
  const moduleParam = params.get('module') as SistemaModuloKey | null;
  return {
    systemId: Number.isFinite(systemId) && systemId > 0 ? systemId : null,
    versionId: Number.isFinite(versionId) && versionId > 0 ? versionId : null,
    module: moduleParam && MODULE_KEYS.includes(moduleParam) ? moduleParam : 'geral' as SistemaModuloKey,
  };
};

const extractApiValidationErrors = (error: unknown): SistemaValidationErrors => {
  const data = (error as {
    response?: { data?: { errors?: Record<string, unknown> } };
  } | null)?.response?.data;
  if (!data?.errors) return {};

  const result: SistemaValidationErrors = {};
  Object.entries(data.errors).forEach(([rawPath, messages]) => {
    if (!Array.isArray(messages) || typeof messages[0] !== 'string') return;
    const path = rawPath
      .replace(/\[(\d+)\]/g, '.$1')
      .split('.')
      .map((segment) => segment ? `${segment.charAt(0).toLowerCase()}${segment.slice(1)}` : segment)
      .join('.');
    result[path] = messages[0];
  });
  return result;
};

const saveModuleByKey = async (
  idSistemaVersao: number,
  moduleKey: SistemaModuloKey,
  config: AnyModuleConfig,
): Promise<AnyModuleConfig> => {
  switch (moduleKey) {
    case 'geral':
      return atualizarConfiguracaoSistemaRpg(idSistemaVersao, 'geral', config as SistemaModuloConfigMap['geral']);
    case 'criacao':
      return atualizarConfiguracaoSistemaRpg(idSistemaVersao, 'criacao', config as SistemaModuloConfigMap['criacao']);
    case 'progressao':
      return atualizarConfiguracaoSistemaRpg(idSistemaVersao, 'progressao', config as SistemaModuloConfigMap['progressao']);
    case 'exploracao':
      return atualizarConfiguracaoSistemaRpg(idSistemaVersao, 'exploracao', config as SistemaModuloConfigMap['exploracao']);
    case 'combate':
      return atualizarConfiguracaoSistemaRpg(idSistemaVersao, 'combate', config as SistemaModuloConfigMap['combate']);
    case 'poderes':
      return atualizarConfiguracaoSistemaRpg(idSistemaVersao, 'poderes', config as SistemaModuloConfigMap['poderes']);
    case 'sobrevivencia':
      return atualizarConfiguracaoSistemaRpg(idSistemaVersao, 'sobrevivencia', config as SistemaModuloConfigMap['sobrevivencia']);
  }
};

export const useManagementSystem = () => {
  const initialQuery = useRef(parseInitialQuery());
  const [systems, setSystems] = useState<SistemaRpgResumo[]>([]);
  const [systemsLoading, setSystemsLoading] = useState(true);
  const [systemsError, setSystemsError] = useState<string | null>(null);
  const [selectedSystemId, setSelectedSystemId] = useState<number | null>(initialQuery.current.systemId);
  const [versions, setVersions] = useState<SistemaVersaoResumo[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionsError, setVersionsError] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(initialQuery.current.versionId);
  const [activeModule, setActiveModule] = useState<SistemaModuloKey>(initialQuery.current.module);
  const [moduleConfig, setModuleConfigState] = useState<AnyModuleConfig | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [moduleLoading, setModuleLoading] = useState(false);
  const [moduleError, setModuleError] = useState<string | null>(null);
  const [serverValidationErrors, setServerValidationErrors] = useState<SistemaValidationErrors>({});
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [raceOptions, setRaceOptions] = useState<RaceOption[]>([]);

  const selectedSystem = useMemo(
    () => systems.find((system) => system.idSistemaRpg === selectedSystemId) ?? null,
    [selectedSystemId, systems],
  );
  const selectedVersion = useMemo(
    () => versions.find((version) => version.idSistemaVersao === selectedVersionId) ?? null,
    [selectedVersionId, versions],
  );
  const localValidationErrors = useMemo(() => {
    if (!moduleConfig) return {};
    switch (activeModule) {
      case 'geral':
        return validateSistemaModule('geral', moduleConfig as SistemaModuloConfigMap['geral']);
      case 'criacao':
        return validateSistemaModule('criacao', moduleConfig as SistemaModuloConfigMap['criacao']);
      case 'progressao':
        return validateSistemaModule('progressao', moduleConfig as SistemaModuloConfigMap['progressao']);
      case 'exploracao':
        return validateSistemaModule('exploracao', moduleConfig as SistemaModuloConfigMap['exploracao']);
      case 'combate':
        return validateSistemaModule('combate', moduleConfig as SistemaModuloConfigMap['combate']);
      case 'poderes':
        return validateSistemaModule('poderes', moduleConfig as SistemaModuloConfigMap['poderes']);
      case 'sobrevivencia':
        return validateSistemaModule('sobrevivencia', moduleConfig as SistemaModuloConfigMap['sobrevivencia']);
    }
  }, [activeModule, moduleConfig]);
  const validationErrors = useMemo(
    () => ({ ...localValidationErrors, ...serverValidationErrors }),
    [localValidationErrors, serverValidationErrors],
  );
  const dirty = Boolean(moduleConfig) && JSON.stringify(moduleConfig) !== savedSnapshot;
  const isReadOnly = !selectedVersion || !isSistemaVersaoRascunho(selectedVersion.status);

  const loadSystems = useCallback(async (signal?: AbortSignal) => {
    setSystemsLoading(true);
    setSystemsError(null);
    try {
      const result = await listarSistemasRpg({ signal });
      const normalized = Array.isArray(result) ? result : [];
      setSystems(normalized);
      setSelectedSystemId((current) => (
        current && normalized.some((system) => system.idSistemaRpg === current)
          ? current
          : null
      ));
    } catch (error) {
      if (signal?.aborted) return;
      setSystemsError(getApiErrorMessage(error, 'Não foi possível carregar os sistemas de RPG.'));
    } finally {
      if (!signal?.aborted) setSystemsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadSystems(controller.signal);
    void getRacas(undefined, undefined, { signal: controller.signal })
      .then((result) => setRaceOptions((result.racas ?? []).map((race) => ({
        id: race.idraca,
        nome: race.nome,
      }))))
      .catch(() => undefined);
    return () => controller.abort();
  }, [loadSystems]);

  const loadVersions = useCallback(async (idSistemaRpg: number, signal?: AbortSignal) => {
    setVersionsLoading(true);
    setVersionsError(null);
    try {
      const result = await listarVersoesSistemaRpg(idSistemaRpg, { signal });
      const ordered = [...(Array.isArray(result) ? result : [])].sort((left, right) => (
        new Date(right.dataAtualizacao).getTime() - new Date(left.dataAtualizacao).getTime()
      ));
      setVersions(ordered);
      setSelectedVersionId((current) => {
        if (current && ordered.some((version) => version.idSistemaVersao === current)) return current;
        const requested = initialQuery.current.versionId;
        if (requested && ordered.some((version) => version.idSistemaVersao === requested)) return requested;
        return ordered.find((version) => isSistemaVersaoRascunho(version.status))?.idSistemaVersao
          ?? ordered[0]?.idSistemaVersao
          ?? null;
      });
    } catch (error) {
      if (signal?.aborted) return;
      setVersions([]);
      setSelectedVersionId(null);
      setVersionsError(getApiErrorMessage(error, 'Não foi possível carregar as versões deste sistema.'));
    } finally {
      if (!signal?.aborted) setVersionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedSystemId) {
      setVersions([]);
      setSelectedVersionId(null);
      return;
    }
    const controller = new AbortController();
    void loadVersions(selectedSystemId, controller.signal);
    return () => controller.abort();
  }, [loadVersions, selectedSystemId]);

  const loadModule = useCallback(async (
    idSistemaVersao: number,
    moduleKey: SistemaModuloKey,
    signal?: AbortSignal,
  ) => {
    setModuleLoading(true);
    setModuleError(null);
    setServerValidationErrors({});
    try {
      const result = await obterConfiguracaoSistemaRpg(idSistemaVersao, moduleKey, { signal });
      const normalized = normalizeModuleConfig(moduleKey, result);
      setModuleConfigState(normalized);
      setSavedSnapshot(JSON.stringify(normalized));
    } catch (error) {
      if (signal?.aborted) return;
      setModuleConfigState(null);
      setSavedSnapshot('');
      setModuleError(getApiErrorMessage(error, 'Não foi possível carregar este módulo.'));
    } finally {
      if (!signal?.aborted) setModuleLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedVersionId) {
      setModuleConfigState(null);
      setSavedSnapshot('');
      return;
    }
    const controller = new AbortController();
    void loadModule(selectedVersionId, activeModule, controller.signal);
    return () => controller.abort();
  }, [activeModule, loadModule, selectedVersionId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('area', 'sistema');
    if (selectedSystemId) params.set('system', String(selectedSystemId));
    else params.delete('system');
    if (selectedVersionId) params.set('version', String(selectedVersionId));
    else params.delete('version');
    params.set('module', activeModule);
    const query = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
  }, [activeModule, selectedSystemId, selectedVersionId]);

  useEffect(() => {
    if (!dirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty]);

  const selectSystem = useCallback((idSistemaRpg: number | null) => {
    setSelectedSystemId(idSistemaRpg);
    setSelectedVersionId(null);
    setModuleConfigState(null);
    setSavedSnapshot('');
    setActiveModule('geral');
  }, []);

  const selectVersion = useCallback((idSistemaVersao: number) => {
    setSelectedVersionId(idSistemaVersao);
    setModuleConfigState(null);
    setSavedSnapshot('');
    setActiveModule('geral');
  }, []);

  const selectModule = useCallback((moduleKey: SistemaModuloKey) => {
    setActiveModule(moduleKey);
    setModuleConfigState(null);
    setSavedSnapshot('');
  }, []);

  const setModuleConfig = useCallback((config: AnyModuleConfig) => {
    setModuleConfigState(config);
    setServerValidationErrors({});
  }, []);

  const retrySystems = useCallback(() => void loadSystems(), [loadSystems]);
  const retryVersions = useCallback(() => {
    if (selectedSystemId) void loadVersions(selectedSystemId);
  }, [loadVersions, selectedSystemId]);
  const retryModule = useCallback(() => {
    if (selectedVersionId) void loadModule(selectedVersionId, activeModule);
  }, [activeModule, loadModule, selectedVersionId]);

  const saveModule = useCallback(async (): Promise<boolean> => {
    if (!selectedVersionId || !moduleConfig || isReadOnly) return false;
    if (Object.keys(localValidationErrors).length > 0) {
      toast.error('Corrija os campos destacados antes de salvar.');
      window.requestAnimationFrame(() => revealFirstValidationError(document.body));
      return false;
    }

    setSaving(true);
    setServerValidationErrors({});
    try {
      const saved = await saveModuleByKey(selectedVersionId, activeModule, moduleConfig);
      const normalized = normalizeModuleConfig(activeModule, saved);
      setModuleConfigState(normalized);
      setSavedSnapshot(JSON.stringify(normalized));
      setLastSavedAt(new Date());
      toast.success('Módulo salvo com sucesso.');
      return true;
    } catch (error) {
      const apiErrors = extractApiValidationErrors(error);
      setServerValidationErrors(apiErrors);
      toast.error(getApiErrorMessage(error, 'Não foi possível salvar o módulo.'));
      window.requestAnimationFrame(() => revealFirstValidationError(document.body));
      return false;
    } finally {
      setSaving(false);
    }
  }, [activeModule, isReadOnly, localValidationErrors, moduleConfig, selectedVersionId]);

  const createSystem = useCallback(async (payload: CriarSistemaRpgPayload): Promise<boolean> => {
    try {
      const created = await criarSistemaRpg(payload);
      await loadSystems();
      setSelectedSystemId(created.idSistemaRpg);
      toast.success('Sistema criado com sucesso.');
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível criar o sistema.'));
      return false;
    }
  }, [loadSystems]);

  const updateSystem = useCallback(async (
    idSistemaRpg: number,
    payload: AtualizarSistemaRpgPayload,
  ): Promise<boolean> => {
    try {
      await atualizarSistemaRpg(idSistemaRpg, payload);
      await loadSystems();
      toast.success('Sistema atualizado.');
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível atualizar o sistema.'));
      return false;
    }
  }, [loadSystems]);

  const toggleSystemActive = useCallback(async (system: SistemaRpgResumo): Promise<boolean> => updateSystem(
    system.idSistemaRpg,
    {
      nome: system.nome,
      descricao: system.descricao ?? undefined,
      ativo: !system.ativo,
    },
  ), [updateSystem]);

  const deleteSystem = useCallback(async (idSistemaRpg: number): Promise<boolean> => {
    try {
      await excluirSistemaRpg(idSistemaRpg);
      if (selectedSystemId === idSistemaRpg) selectSystem(null);
      await loadSystems();
      toast.success('Sistema excluído.');
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível excluir o sistema. Verifique se existem mesas ou versões vinculadas.'));
      return false;
    }
  }, [loadSystems, selectSystem, selectedSystemId]);

  const createVersion = useCallback(async (payload: CriarSistemaVersaoPayload): Promise<boolean> => {
    if (!selectedSystemId) return false;
    try {
      const created = await criarVersaoSistemaRpg(selectedSystemId, payload);
      await loadVersions(selectedSystemId);
      setSelectedVersionId(created.idSistemaVersao);
      setActiveModule('geral');
      toast.success('Rascunho criado.');
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível criar a versão.'));
      return false;
    }
  }, [loadVersions, selectedSystemId]);

  const duplicateVersion = useCallback(async (
    idSistemaVersao: number,
    payload: DuplicarSistemaVersaoPayload,
  ): Promise<boolean> => {
    if (!selectedSystemId) return false;
    try {
      const created = await duplicarVersaoSistemaRpg(idSistemaVersao, payload);
      await loadVersions(selectedSystemId);
      setSelectedVersionId(created.idSistemaVersao);
      setActiveModule('geral');
      toast.success('Versão duplicada como novo rascunho.');
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível duplicar a versão.'));
      return false;
    }
  }, [loadVersions, selectedSystemId]);

  const publishVersion = useCallback(async (idSistemaVersao: number): Promise<boolean> => {
    if (!selectedSystemId) return false;
    try {
      await publicarVersaoSistemaRpg(idSistemaVersao);
      await Promise.all([loadVersions(selectedSystemId), loadSystems()]);
      toast.success('Versão publicada. As mesas existentes não foram migradas automaticamente.');
      return true;
    } catch (error) {
      setServerValidationErrors(extractApiValidationErrors(error));
      toast.error(getApiErrorMessage(error, 'A versão não pôde ser publicada. Revise os módulos obrigatórios.'));
      return false;
    }
  }, [loadSystems, loadVersions, selectedSystemId]);

  const archiveVersion = useCallback(async (idSistemaVersao: number): Promise<boolean> => {
    if (!selectedSystemId) return false;
    try {
      await arquivarVersaoSistemaRpg(idSistemaVersao);
      await Promise.all([loadVersions(selectedSystemId), loadSystems()]);
      toast.success('Versão arquivada. Mesas vinculadas continuam preservadas.');
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível arquivar a versão.'));
      return false;
    }
  }, [loadSystems, loadVersions, selectedSystemId]);

  const deleteVersion = useCallback(async (idSistemaVersao: number): Promise<boolean> => {
    if (!selectedSystemId) return false;
    try {
      await excluirVersaoSistemaRpg(selectedSystemId, idSistemaVersao);
      if (selectedVersionId === idSistemaVersao) setSelectedVersionId(null);
      await loadVersions(selectedSystemId);
      toast.success('Rascunho excluído.');
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível excluir a versão. Versões publicadas ou em uso são protegidas.'));
      return false;
    }
  }, [loadVersions, selectedSystemId, selectedVersionId]);

  const state: ManagementSystemState = {
    systems,
    systemsLoading,
    systemsError,
    selectedSystem,
    versions,
    versionsLoading,
    versionsError,
    selectedVersion,
    activeModule,
    moduleConfig,
    moduleLoading,
    moduleError,
    validationErrors,
    dirty,
    saving,
    lastSavedAt,
    raceOptions,
    isReadOnly,
  };

  return {
    ...state,
    selectSystem,
    selectVersion,
    selectModule,
    setModuleConfig,
    retrySystems,
    retryVersions,
    retryModule,
    saveModule,
    createSystem,
    updateSystem,
    toggleSystemActive,
    deleteSystem,
    createVersion,
    duplicateVersion,
    publishVersion,
    archiveVersion,
    deleteVersion,
    discardModuleChanges: retryModule,
    createEmptyModule: () => setModuleConfigState(createDefaultModuleConfig(activeModule)),
  };
};
