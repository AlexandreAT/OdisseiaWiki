import { CheckBox } from '../../../../../components/Generic/CheckBox/CheckBox';
import { InputText } from '../../../../../components/Generic/InputText/InputText';
import { TextArea } from '../../../../../components/Generic/TextArea/TextArea';
import { SistemaModulo } from '../../../../../models/SistemaRpg';
import { ConfigTable, ConfigTableColumn } from '../ConfigTable/ConfigTable';
import { ModuleFormProps } from './ModuleForm.types';
import {
  FieldGrid,
  InlineChecks,
  ModuleFieldset,
  ModuleIntro,
  ModuleWarning,
  SectionCard,
} from './ModuleForms.style';

const moduleTypeOptions = [
  { value: 'RegrasBase', label: 'Regras base' },
  { value: 'CriacaoPersonagem', label: 'Criação de personagem' },
  { value: 'Progressao', label: 'Progressão' },
  { value: 'Atributos', label: 'Atributos' },
  { value: 'Recursos', label: 'Recursos' },
  { value: 'Movimento', label: 'Movimento' },
  { value: 'PontosAcao', label: 'Pontos de ação' },
  { value: 'Combate', label: 'Combate' },
  { value: 'Furtividade', label: 'Furtividade' },
  { value: 'Equipamentos', label: 'Equipamentos' },
  { value: 'Defesas', label: 'Defesas' },
  { value: 'Danos', label: 'Danos' },
  { value: 'Magias', label: 'Magias' },
  { value: 'Skills', label: 'Skills' },
  { value: 'Condicoes', label: 'Condições' },
  { value: 'Descanso', label: 'Descanso' },
  { value: 'Exploracao', label: 'Exploração' },
  { value: 'Morte', label: 'Morte' },
  { value: 'Poderes', label: 'Poderes' },
  { value: 'Sobrevivencia', label: 'Sobrevivência' },
];

const columns: ConfigTableColumn<SistemaModulo>[] = [
  { key: 'tipoModulo', label: 'Tipo do módulo', type: 'select', width: '220px', options: moduleTypeOptions },
  { key: 'habilitado', label: 'Habilitado', type: 'checkbox', width: '100px' },
  { key: 'schemaVersion', label: 'Versão do schema', type: 'number', min: 1, width: '130px' },
  { key: 'ordem', label: 'Ordem', type: 'number', min: 0, width: '90px' },
];

const createModule = (): SistemaModulo => ({
  tipoModulo: 'Atributos',
  habilitado: true,
  schemaVersion: 1,
  ordem: 1,
});

export const GeneralModuleForm = ({
  value,
  onChange,
  errors,
  readOnly,
  theme,
  neon,
}: ModuleFormProps<'geral'>) => (
  <ModuleFieldset disabled={readOnly}>
    <ModuleIntro theme={theme} neon={neon}>
      <div>
        <h3>Visão geral dos módulos</h3>
        <p>
          Controle quais partes desta versão estão habilitadas e qual versão de schema cada
          configuração utiliza. Os dados mecânicos continuam separados nos módulos seguintes.
        </p>
      </div>
    </ModuleIntro>

    {readOnly && (
      <ModuleWarning>
        Esta versão está protegida. Duplique-a para criar um novo rascunho editável.
      </ModuleWarning>
    )}

    <SectionCard theme={theme} neon={neon}>
      <h4>Regras fundamentais</h4>
      <p>Convenções usadas como base quando uma regra mais específica não determinar outro comportamento.</p>
      <FieldGrid $columns={4}>
        <InputText theme={theme} neon={neon} label="Dado do teste geral" value={value.dadoTesteGeral} onChange={(event) => onChange({ ...value, dadoTesteGeral: event.target.value.toUpperCase() })} error={Boolean(errors.dadoTesteGeral)} errorMessage={errors.dadoTesteGeral} required />
        <InputText theme={theme} neon={neon} label="Crítico natural" type="number" value={value.criticoNatural} onChange={(event) => onChange({ ...value, criticoNatural: Number(event.target.value) })} error={Boolean(errors.criticoNatural)} errorMessage={errors.criticoNatural} />
        <InputText theme={theme} neon={neon} label="Falha crítica natural" type="number" value={value.falhaCriticaNatural} onChange={(event) => onChange({ ...value, falhaCriticaNatural: Number(event.target.value) })} error={Boolean(errors.falhaCriticaNatural)} errorMessage={errors.falhaCriticaNatural} />
        <InputText theme={theme} neon={neon} label="Arredondamento" value={value.regraArredondamento} onChange={(event) => onChange({ ...value, regraArredondamento: event.target.value })} error={Boolean(errors.regraArredondamento)} errorMessage={errors.regraArredondamento} required />
      </FieldGrid>
      <InlineChecks>
        <CheckBox neon={neon} label="Usar vantagem" checked={value.usaVantagem} onChange={(usaVantagem) => onChange({ ...value, usaVantagem })} disabled={readOnly} />
        <CheckBox neon={neon} label="Usar desvantagem" checked={value.usaDesvantagem} onChange={(usaDesvantagem) => onChange({ ...value, usaDesvantagem })} disabled={readOnly} />
        <CheckBox neon={neon} label="Regra específica prevalece" checked={value.regraEspecificaPrevalece} onChange={(regraEspecificaPrevalece) => onChange({ ...value, regraEspecificaPrevalece })} disabled={readOnly} />
        <CheckBox neon={neon} label="Autoridade final do mestre" checked={value.autoridadeMestre} onChange={(autoridadeMestre) => onChange({ ...value, autoridadeMestre })} disabled={readOnly} />
      </InlineChecks>
      <TextArea theme={theme} neon={neon} label="Observações e ambiguidades" value={value.observacoesRegrasFundamentais ?? ''} onChange={(event) => onChange({ ...value, observacoesRegrasFundamentais: event.target.value })} fullWidth />
    </SectionCard>

    <ConfigTable
      title="Módulos da versão"
      description="A ordem define como os módulos serão apresentados e interpretados futuramente pelo motor da mesa."
      rows={value.modulos}
      columns={columns}
      createRow={createModule}
      onChange={(modulos) => onChange({ ...value, modulos })}
      theme={theme}
      neon={neon}
      readOnly={readOnly}
      errors={errors}
      errorPath="modulos"
    />
  </ModuleFieldset>
);
