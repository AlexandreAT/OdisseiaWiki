import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsSuggestOutlinedIcon from '@mui/icons-material/SettingsSuggestOutlined';
import { useEffect, useState } from 'react';
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
import { SistemaValidationErrors } from '../../systemValidation';
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
  systemCode,
  raceOptions,
  idSistemaVersao,
  onChange,
  onRetry,
  onCreateEmpty,
}: ModuleEditorProps) => {
  const [references, setReferences] = useState<SystemReferenceCatalog>({
    attributes: [], resources: [], conditions: [], testCodes: [], weaponTypes: [],
  });
  useEffect(() => {
    let active = true;
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
  }, [idSistemaVersao]);
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
  );
};
