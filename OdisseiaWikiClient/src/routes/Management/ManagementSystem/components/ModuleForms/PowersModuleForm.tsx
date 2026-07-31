import { CheckBox } from '../../../../../components/Generic/CheckBox/CheckBox';
import { InputText } from '../../../../../components/Generic/InputText/InputText';
import { TextArea } from '../../../../../components/Generic/TextArea/TextArea';
import { SistemaTipoMagia } from '../../../../../models/SistemaRpg';
import { ConfigTable, ConfigTableColumn } from '../ConfigTable/ConfigTable';
import { ModuleFormProps } from './ModuleForm.types';
import {
  FieldGrid,
  InlineChecks,
  ModuleFieldset,
  ModuleIntro,
  SectionCard,
} from './ModuleForms.style';

const magicColumns: ConfigTableColumn<SistemaTipoMagia>[] = [
  { key: 'codigo', label: 'Código', type: 'text', maxLength: 50 },
  { key: 'nome', label: 'Nome', type: 'text', maxLength: 120 },
  { key: 'cor', label: 'Cor', type: 'text', maxLength: 32 },
  { key: 'afinidade', label: 'Afinidade', type: 'text', maxLength: 100 },
  { key: 'custoBase', label: 'Custo base', type: 'number', min: 0 },
  { key: 'descricao', label: 'Descrição', type: 'textarea', maxLength: 1000 },
  { key: 'ordem', label: 'Ordem', type: 'number', min: 0 },
];

const createMagicType = (): SistemaTipoMagia => ({
  codigo: '',
  nome: '',
  descricao: '',
  cor: '',
  afinidade: '',
  custoBase: 0,
  ordem: 1,
});

export const PowersModuleForm = ({
  value,
  onChange,
  errors,
  readOnly,
  theme,
  neon,
}: ModuleFormProps<'poderes'>) => {
  const skillConfig = value.skillConfig ?? {
    maximoSkills: 0,
    nivelMaximoSkill: 0,
    maximoUltimates: 0,
    nivelDesbloqueioUltimate: 0,
    maximoMagias: 0,
    usaCooldown: true,
    permiteArtesEtericas: true,
    observacoes: '',
  };

  return (
    <ModuleFieldset disabled={readOnly}>
      <ModuleIntro theme={theme} neon={neon}>
        <div>
          <h3>Poderes</h3>
          <p>
            Tipos de magia, aprendizado, skills, ultimate, cooldowns e Artes Etéricas permanecem
            configurados em um módulo próprio, sem acoplar as entidades narrativas da Wiki.
          </p>
        </div>
      </ModuleIntro>

      <SectionCard theme={theme} neon={neon}>
        <h4>Magias e afinidades</h4>
        <FieldGrid $columns={2}>
          <InputText theme={theme} neon={neon} label="Limite de magias" type="number" value={value.limiteMagias} onChange={(event) => onChange({ ...value, limiteMagias: Number(event.target.value) })} error={Boolean(errors.limiteMagias)} errorMessage={errors.limiteMagias} />
          <InlineChecks>
            <CheckBox neon={neon} label="Permitir magias compostas" checked={value.permiteMagiasCompostas} onChange={(permiteMagiasCompostas) => onChange({ ...value, permiteMagiasCompostas })} disabled={readOnly} />
          </InlineChecks>
        </FieldGrid>
        <TextArea theme={theme} neon={neon} label="Regra de aprendizado" value={value.regraAprendizadoMagia ?? ''} onChange={(event) => onChange({ ...value, regraAprendizadoMagia: event.target.value })} fullWidth />
      </SectionCard>

      <ConfigTable
        title="Tipos de magia"
        description="Catálogo de afinidades e categorias mágicas disponíveis nesta versão."
        rows={value.tiposMagia}
        columns={magicColumns}
        createRow={createMagicType}
        onChange={(tiposMagia) => onChange({ ...value, tiposMagia })}
        theme={theme}
        neon={neon}
        readOnly={readOnly}
        errors={errors}
        errorPath="tiposMagia"
      />

      <SectionCard theme={theme} neon={neon}>
        <h4>Skills e ultimate</h4>
        <p>Limites globais usados como referência para slots e progressão das fichas.</p>
        <FieldGrid $columns={5}>
          <InputText theme={theme} neon={neon} label="Máximo de skills" type="number" value={skillConfig.maximoSkills} onChange={(event) => onChange({ ...value, skillConfig: { ...skillConfig, maximoSkills: Number(event.target.value) } })} error={Boolean(errors['skillConfig.maximoSkills'])} errorMessage={errors['skillConfig.maximoSkills']} />
          <InputText theme={theme} neon={neon} label="Nível máximo da skill" type="number" value={skillConfig.nivelMaximoSkill} onChange={(event) => onChange({ ...value, skillConfig: { ...skillConfig, nivelMaximoSkill: Number(event.target.value) } })} error={Boolean(errors['skillConfig.nivelMaximoSkill'])} errorMessage={errors['skillConfig.nivelMaximoSkill']} />
          <InputText theme={theme} neon={neon} label="Máximo de ultimates" type="number" value={skillConfig.maximoUltimates} onChange={(event) => onChange({ ...value, skillConfig: { ...skillConfig, maximoUltimates: Number(event.target.value) } })} error={Boolean(errors['skillConfig.maximoUltimates'])} errorMessage={errors['skillConfig.maximoUltimates']} />
          <InputText theme={theme} neon={neon} label="Nível da ultimate" type="number" value={skillConfig.nivelDesbloqueioUltimate} onChange={(event) => onChange({ ...value, skillConfig: { ...skillConfig, nivelDesbloqueioUltimate: Number(event.target.value) } })} error={Boolean(errors['skillConfig.nivelDesbloqueioUltimate'])} errorMessage={errors['skillConfig.nivelDesbloqueioUltimate']} />
          <InputText theme={theme} neon={neon} label="Máximo de magias" type="number" value={skillConfig.maximoMagias ?? ''} onChange={(event) => onChange({ ...value, skillConfig: { ...skillConfig, maximoMagias: event.target.value === '' ? null : Number(event.target.value) } })} error={Boolean(errors['skillConfig.maximoMagias'])} errorMessage={errors['skillConfig.maximoMagias']} />
        </FieldGrid>
        <InlineChecks>
          <CheckBox neon={neon} label="Usar cooldown" checked={skillConfig.usaCooldown} onChange={(usaCooldown) => onChange({ ...value, skillConfig: { ...skillConfig, usaCooldown } })} disabled={readOnly} />
          <CheckBox neon={neon} label="Permitir Artes Etéricas" checked={skillConfig.permiteArtesEtericas} onChange={(permiteArtesEtericas) => onChange({ ...value, skillConfig: { ...skillConfig, permiteArtesEtericas } })} disabled={readOnly} />
        </InlineChecks>
        <TextArea theme={theme} neon={neon} label="Observações sobre skills e poderes" value={skillConfig.observacoes ?? ''} onChange={(event) => onChange({ ...value, skillConfig: { ...skillConfig, observacoes: event.target.value } })} fullWidth />
      </SectionCard>
    </ModuleFieldset>
  );
};
