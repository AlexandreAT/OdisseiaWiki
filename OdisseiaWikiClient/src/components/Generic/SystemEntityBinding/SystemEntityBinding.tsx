import { CheckBox } from '../CheckBox/CheckBox';
import { Select } from '../Select/Select';
import { SystemRuntimeIndicator } from '../SystemRuntimeIndicator';
import { getSistemaVersaoStatusLabel } from '../../../models/SistemaRpg';
import { SistemaEntidadeGlobalFormState } from '../../../hooks/useSistemaEntidadeGlobalForm';
import { BindingGrid, BindingHeader, BindingSection } from './SystemEntityBinding.style';
import { WikiContentHelpProvider } from '../FieldHelp/WikiContentHelpProvider';
import { FieldHelp } from '../FieldHelp/FieldHelp';

interface SystemEntityBindingProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  state: SistemaEntidadeGlobalFormState;
}

export const SystemEntityBinding = ({ theme, neon, state }: SystemEntityBindingProps) => {
  return (
    <WikiContentHelpProvider scope="binding" theme={theme} neon={neon}>
    <BindingSection>
      <BindingHeader>
        <h3>Sistema de RPG <FieldHelp label="Sistema de RPG" inline /></h3>
      </BindingHeader>

      <SystemRuntimeIndicator contexto={state.contexto} loading={state.loading} error={state.error} />

      <BindingGrid>
        <Select
          theme={theme}
          neon={neon}
          label="Sistema"
          value={state.effectiveSystemId ?? ''}
          options={state.systems
            .filter((system) => system.ativo || system.idSistemaRpg === state.effectiveSystemId)
            .map((system) => ({
              value: system.idSistemaRpg,
              label: `${system.nome}${system.ativo ? '' : ' (inativo — vínculo existente)'}`,
            }))}
          onChange={(event) => state.selectSystem(event.target.value ? Number(event.target.value) : null)}
          disabled={state.loading}
          allowEmptyOption={false}
          width="100%"
        />

        {!state.vinculo.acompanharPublicacaoAtual && (
          <Select
            theme={theme}
            neon={neon}
            label="Versão fixa publicada"
            value={state.vinculo.idSistemaVersao ?? ''}
            options={state.versions.map((version) => ({
              value: version.idSistemaVersao,
              label: `${version.numeroVersao} — ${getSistemaVersaoStatusLabel(version.status)}${
                getSistemaVersaoStatusLabel(version.status) === 'Arquivado' ? ' (vínculo existente)' : ''
              }`,
            }))}
            onChange={(event) => state.setVinculo({
              idSistemaVersao: event.target.value ? Number(event.target.value) : null,
            })}
            disabled={state.loading}
            required
            width="100%"
          />
        )}
      </BindingGrid>

      <CheckBox
        neon={neon}
        label="Acompanhar publicação atual"
        checked={state.vinculo.acompanharPublicacaoAtual}
        onChange={state.toggleFollowCurrent}
        disabled={state.loading}
      />
    </BindingSection>
    </WikiContentHelpProvider>
  );
};
