import RefreshIcon from '@mui/icons-material/Refresh';
import { FieldHelpProvider } from '../../../../../components/Generic/FieldHelp/FieldHelpProvider';
import { getSystemHelp } from '../../../../../content/systemHelp';
import SettingsSuggestOutlinedIcon from '@mui/icons-material/SettingsSuggestOutlined';
import { useCallback, useEffect, useState } from 'react';
import { obterCatalogoItensSistemaRpg, obterConfiguracaoSistemaRpg } from '../../../../../services/sistemasRpgService';
import { LoadingIndicator } from '../../../../../components/Generic/LoadingIndicator';
import {
  SistemaModuloConfigMap,
  SistemaModuloKey,
} from '../../../../../models/SistemaRpg';
import {
  ActionButton,
  CurrentModuleError,
  ModuleContent,
  StatePanel,
} from '../../ManagementSystem.style';
import { describeSistemaValidationErrors, SistemaValidationErrors } from '../../systemValidation';
import { CombatModuleForm } from '../ModuleForms/CombatModuleForm';
import { CreationModuleForm } from '../ModuleForms/CreationModuleForm';
import { ExplorationModuleForm } from '../ModuleForms/ExplorationModuleForm';
import { GeneralModuleForm } from '../ModuleForms/GeneralModuleForm';
import { RaceOption, type SystemReferenceCatalog, type SystemReferenceOption } from '../ModuleForms/ModuleForm.types';
import { PowersModuleForm } from '../ModuleForms/PowersModuleForm';
import { ProgressionModuleForm } from '../ModuleForms/ProgressionModuleForm';
import { SurvivalModuleForm } from '../ModuleForms/SurvivalModuleForm';

type AnyModuleConfig = SistemaModuloConfigMap[SistemaModuloKey];

interface ModuleEditorProps {
  moduleKey: SistemaModuloKey;
  config: AnyModuleConfig | null;
  loading: boolean;
  error: string | null;
  errors: SistemaValidationErrors;
  readOnly: boolean;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  systemCode: string;
  raceOptions: RaceOption[];
  idSistemaVersao: number;
  lastSavedAt: Date | null;
  onChange: (config: AnyModuleConfig) => void;
  onRetry: () => void;
  onCreateEmpty: () => void;
  onUploadBusyChange?: (busy: boolean) => void;
}

export const ModuleEditor = ({
  moduleKey,
  config,
  loading,
  error,
  errors,
  readOnly,
  theme,
  neon,
  systemCode,
  raceOptions,
  idSistemaVersao,
  lastSavedAt,
  onChange,
  onRetry,
  onCreateEmpty,
  onUploadBusyChange,
}: ModuleEditorProps) => {
  const resolveHelp = useCallback((target: string) => getSystemHelp(moduleKey, target), [moduleKey]);
  const [references, setReferences] = useState<SystemReferenceCatalog>({
    attributes: [], resources: [], conditions: [], testCodes: [], weaponTypes: [],
  });
  useEffect(() => {
    let active = true;
    setReferences({ attributes: [], resources: [], conditions: [], testCodes: [], weaponTypes: [] });
    const options = (entries: { codigo: string; nome: string }[]): SystemReferenceOption[] =>
      entries.filter((entry) => entry.codigo).map((entry) => ({ value: entry.codigo, label: entry.nome || entry.codigo }));
    void Promise.allSettled([
      obterConfiguracaoSistemaRpg(idSistemaVersao, 'criacao'),
      obterConfiguracaoSistemaRpg(idSistemaVersao, 'sobrevivencia'),
      obterConfiguracaoSistemaRpg(idSistemaVersao, 'combate'),
      obterCatalogoItensSistemaRpg(idSistemaVersao),
    ]).then(([creation, survival, combat, items]) => {
      if (!active) return;
      const weaponTypes = items.status === 'fulfilled' ? items.value.tipos.flatMap((type) =>
        type.filhos.flatMap((category) => category.filhos.map((archetype) =>
          ({ value: archetype.codigo, label: archetype.nome })))) : [];
      setReferences({
        attributes: creation.status === 'fulfilled' ? options(creation.value.atributos) : [],
        resources: creation.status === 'fulfilled' ? options(creation.value.recursos) : [],
        conditions: survival.status === 'fulfilled' ? options(survival.value.condicoes) : [],
        testCodes: combat.status === 'fulfilled' ? options(combat.value.resultadosDado.map((entry) =>
          ({ codigo: entry.codigoTeste, nome: entry.nomeTeste }))) : [],
        weaponTypes: [{ value: 'arma_de_fogo', label: 'Armas de fogo (geral)' }, ...weaponTypes],
      });
    });
    return () => { active = false; };
  }, [idSistemaVersao, moduleKey, lastSavedAt]);
  if (loading) {
    return (
      <ModuleContent>
        <StatePanel theme={theme} neon={neon} role="status">
          <SettingsSuggestOutlinedIcon />
          <LoadingIndicator compact label="Carregando módulo" />
        </StatePanel>
      </ModuleContent>
    );
  }

  if (error) {
    return (
      <ModuleContent>
        <StatePanel theme={theme} neon={neon} $error role="alert">
          <strong>{error}</strong>
          <div>
            <ActionButton type="button" theme={theme} neon={neon} onClick={onRetry}>
              <RefreshIcon /> Tentar novamente
            </ActionButton>
            {!readOnly && (
              <ActionButton type="button" theme={theme} neon={neon} onClick={onCreateEmpty}>
                Iniciar módulo vazio
              </ActionButton>
            )}
          </div>
        </StatePanel>
      </ModuleContent>
    );
  }

  if (!config) return null;

  const errorCount = Object.keys(errors).length;
  return (
    <FieldHelpProvider theme={theme} neon={neon} resolve={resolveHelp}>
    <ModuleContent data-system-module={moduleKey}>
      {errorCount > 0 && (
        <CurrentModuleError role="alert" data-validation-error="true" tabIndex={-1}>
          Este módulo possui {errorCount} {errorCount === 1 ? 'inconsistência' : 'inconsistências'}.
          Corrija os campos destacados antes de salvar ou publicar.
          <ul>{describeSistemaValidationErrors(errors, config).map((message, index) => (
            <li key={index}>{message}</li>
          ))}</ul>
        </CurrentModuleError>
      )}

      {moduleKey === 'geral' && (
        <GeneralModuleForm
          value={config as SistemaModuloConfigMap['geral']}
          onChange={onChange}
          errors={errors}
          readOnly={readOnly}
          theme={theme}
          neon={neon}
        />
      )}
      {moduleKey === 'criacao' && (
        <CreationModuleForm
          references={references}
          value={config as SistemaModuloConfigMap['criacao']}
          onChange={onChange}
          errors={errors}
          readOnly={readOnly}
          theme={theme}
          neon={neon}
          systemCode={systemCode}
          raceOptions={raceOptions}
        />
      )}
      {moduleKey === 'progressao' && (
        <ProgressionModuleForm
          references={references}
          value={config as SistemaModuloConfigMap['progressao']}
          onChange={onChange}
          errors={errors}
          readOnly={readOnly}
          theme={theme}
          neon={neon}
        />
      )}
      {moduleKey === 'exploracao' && (
        <ExplorationModuleForm
          value={config as SistemaModuloConfigMap['exploracao']}
          onChange={onChange}
          errors={errors}
          readOnly={readOnly}
          theme={theme}
          neon={neon}
        />
      )}
      {moduleKey === 'combate' && (
        <CombatModuleForm
          references={references}
          value={config as SistemaModuloConfigMap['combate']}
          onChange={onChange}
          errors={errors}
          readOnly={readOnly}
          theme={theme}
          neon={neon}
        />
      )}
      {moduleKey === 'poderes' && (
        <PowersModuleForm
          value={config as SistemaModuloConfigMap['poderes']}
          onChange={onChange}
          errors={errors}
          readOnly={readOnly}
          theme={theme}
          neon={neon}
        />
      )}
      {moduleKey === 'sobrevivencia' && (
        <SurvivalModuleForm
          onUploadBusyChange={onUploadBusyChange}
          idSistemaVersao={idSistemaVersao}
          references={references}
          value={config as SistemaModuloConfigMap['sobrevivencia']}
          onChange={onChange}
          errors={errors}
          readOnly={readOnly}
          theme={theme}
          neon={neon}
        />
      )}
    </ModuleContent>
    </FieldHelpProvider>
  );
};
