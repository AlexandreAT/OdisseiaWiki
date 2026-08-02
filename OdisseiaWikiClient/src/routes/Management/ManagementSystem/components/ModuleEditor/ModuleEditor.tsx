import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsSuggestOutlinedIcon from '@mui/icons-material/SettingsSuggestOutlined';
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
import { SistemaValidationErrors } from '../../systemValidation';
import { CombatModuleForm } from '../ModuleForms/CombatModuleForm';
import { CreationModuleForm } from '../ModuleForms/CreationModuleForm';
import { ExplorationModuleForm } from '../ModuleForms/ExplorationModuleForm';
import { GeneralModuleForm } from '../ModuleForms/GeneralModuleForm';
import { RaceOption } from '../ModuleForms/ModuleForm.types';
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
  raceOptions: RaceOption[];
  onChange: (config: AnyModuleConfig) => void;
  onRetry: () => void;
  onCreateEmpty: () => void;
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
  raceOptions,
  onChange,
  onRetry,
  onCreateEmpty,
}: ModuleEditorProps) => {
  if (loading) {
    return (
      <ModuleContent>
        <StatePanel theme={theme} neon={neon} role="status">
          <SettingsSuggestOutlinedIcon />
          Carregando configuração do módulo...
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
    <ModuleContent data-system-module={moduleKey}>
      {errorCount > 0 && (
        <CurrentModuleError role="alert">
          Este módulo possui {errorCount} {errorCount === 1 ? 'inconsistência' : 'inconsistências'}.
          Corrija os campos destacados antes de salvar ou publicar.
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
          value={config as SistemaModuloConfigMap['criacao']}
          onChange={onChange}
          errors={errors}
          readOnly={readOnly}
          theme={theme}
          neon={neon}
          raceOptions={raceOptions}
        />
      )}
      {moduleKey === 'progressao' && (
        <ProgressionModuleForm
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
          value={config as SistemaModuloConfigMap['sobrevivencia']}
          onChange={onChange}
          errors={errors}
          readOnly={readOnly}
          theme={theme}
          neon={neon}
        />
      )}
    </ModuleContent>
  );
};
