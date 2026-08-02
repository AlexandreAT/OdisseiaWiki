import { CheckBox } from '../../../../../components/Generic/CheckBox/CheckBox';
import { InputText } from '../../../../../components/Generic/InputText/InputText';
import { TextArea } from '../../../../../components/Generic/TextArea/TextArea';
import {
  SistemaResultadoDado,
  SistemaTipoDano,
  SistemaTipoDefesa,
} from '../../../../../models/SistemaRpg';
import { ConfigTable, ConfigTableColumn } from '../ConfigTable/ConfigTable';
import { ModuleFormProps } from './ModuleForm.types';
import {
  FieldGrid,
  InlineChecks,
  ModuleFieldset,
  ModuleIntro,
  SectionCard,
} from './ModuleForms.style';

const resultColumns: ConfigTableColumn<SistemaResultadoDado>[] = [
  { key: 'codigoTeste', label: 'Código do teste', type: 'text', maxLength: 50 },
  { key: 'nomeTeste', label: 'Nome do teste', type: 'text', maxLength: 120 },
  { key: 'dado', label: 'Dado', type: 'text', maxLength: 12 },
  { key: 'quantidadeDados', label: 'Quantidade', type: 'number', min: 1 },
  { key: 'resultadoMinimo', label: 'Mínimo', type: 'number', min: 1 },
  { key: 'resultadoMaximo', label: 'Máximo', type: 'number', min: 1 },
  { key: 'exigeNatural', label: 'Natural', type: 'checkbox' },
  { key: 'codigoResultado', label: 'Cód. resultado', type: 'text', maxLength: 50 },
  { key: 'nomeResultado', label: 'Resultado', type: 'text', maxLength: 120 },
  { key: 'descricao', label: 'Descrição', type: 'textarea', maxLength: 1000 },
  { key: 'ordem', label: 'Ordem', type: 'number', min: 0 },
];

const damageColumns: ConfigTableColumn<SistemaTipoDano>[] = [
  { key: 'codigo', label: 'Código', type: 'text', maxLength: 50 },
  { key: 'nome', label: 'Nome', type: 'text', maxLength: 120 },
  { key: 'ignoraArmadura', label: 'Ignora armadura', type: 'checkbox' },
  { key: 'ignoraProtecao', label: 'Ignora proteção', type: 'checkbox' },
  { key: 'ignoraEscudo', label: 'Ignora escudo', type: 'checkbox' },
  { key: 'periodico', label: 'Periódico', type: 'checkbox' },
  { key: 'area', label: 'Em área', type: 'checkbox' },
  { key: 'descricao', label: 'Descrição', type: 'textarea', maxLength: 1000 },
  { key: 'ordem', label: 'Ordem', type: 'number', min: 0 },
];

const defenseColumns: ConfigTableColumn<SistemaTipoDefesa>[] = [
  { key: 'codigo', label: 'Código', type: 'text', maxLength: 50 },
  { key: 'nome', label: 'Nome', type: 'text', maxLength: 120 },
  { key: 'ordemAplicacao', label: 'Ordem de aplicação', type: 'number', min: 0 },
  { key: 'tipoComportamento', label: 'Comportamento', type: 'text', maxLength: 100 },
  { key: 'formula', label: 'Fórmula', type: 'text', maxLength: 250 },
  { key: 'descricao', label: 'Descrição', type: 'textarea', maxLength: 1000 },
  { key: 'ordem', label: 'Ordem visual', type: 'number', min: 0 },
];

const createResult = (): SistemaResultadoDado => ({
  codigoTeste: '',
  nomeTeste: '',
  dado: 'D20',
  quantidadeDados: 1,
  resultadoMinimo: 1,
  resultadoMaximo: 1,
  exigeNatural: false,
  codigoResultado: '',
  nomeResultado: '',
  descricao: '',
  ordem: 1,
});

const createDamage = (): SistemaTipoDano => ({
  codigo: '',
  nome: '',
  descricao: '',
  ignoraArmadura: false,
  ignoraProtecao: false,
  ignoraEscudo: false,
  periodico: false,
  area: false,
  ordem: 1,
});

const createDefense = (): SistemaTipoDefesa => ({
  codigo: '',
  nome: '',
  descricao: '',
  ordemAplicacao: 1,
  tipoComportamento: '',
  formula: '',
  ordem: 1,
});

const createDefaultD20Results = (): SistemaResultadoDado[] => [
  { ...createResult(), codigoTeste: 'ATAQUE', nomeTeste: 'Teste de ataque', resultadoMinimo: 1, resultadoMaximo: 1, exigeNatural: true, codigoResultado: 'FALHA_CRITICA', nomeResultado: 'Falha crítica', ordem: 1 },
  { ...createResult(), codigoTeste: 'ATAQUE', nomeTeste: 'Teste de ataque', resultadoMinimo: 2, resultadoMaximo: 10, codigoResultado: 'ERRO', nomeResultado: 'Erro', ordem: 2 },
  { ...createResult(), codigoTeste: 'ATAQUE', nomeTeste: 'Teste de ataque', resultadoMinimo: 11, resultadoMaximo: 17, codigoResultado: 'ACERTO', nomeResultado: 'Acerto', ordem: 3 },
  { ...createResult(), codigoTeste: 'ATAQUE', nomeTeste: 'Teste de ataque', resultadoMinimo: 18, resultadoMaximo: 19, codigoResultado: 'ACERTO_PRECISO', nomeResultado: 'Acerto preciso', ordem: 4 },
  { ...createResult(), codigoTeste: 'ATAQUE', nomeTeste: 'Teste de ataque', resultadoMinimo: 20, resultadoMaximo: 20, exigeNatural: true, codigoResultado: 'CRITICO', nomeResultado: 'Crítico', ordem: 5 },
];

export const CombatModuleForm = ({
  value,
  onChange,
  errors,
  readOnly,
  theme,
  neon,
}: ModuleFormProps<'combate'>) => (
  <ModuleFieldset disabled={readOnly}>
    <ModuleIntro theme={theme} neon={neon}>
      <div>
        <h3>Combate</h3>
        <p>
          Modele iniciativa, turnos, intervalos de resultado e catálogos de dano e defesa. O editor
          detecta sobreposições, lacunas e resultados fora do dado informado.
        </p>
      </div>
    </ModuleIntro>

    <SectionCard theme={theme} neon={neon}>
      <h4>Iniciativa e turno</h4>
      <InlineChecks>
        <CheckBox neon={neon} label="Usar iniciativa" checked={value.usaIniciativa} onChange={(usaIniciativa) => onChange({ ...value, usaIniciativa })} disabled={readOnly} />
      </InlineChecks>
      <FieldGrid $columns={2}>
        <InputText theme={theme} neon={neon} label="Fórmula de iniciativa" value={value.formulaIniciativa ?? ''} onChange={(event) => onChange({ ...value, formulaIniciativa: event.target.value })} />
        <InputText theme={theme} neon={neon} label="Segundos por turno" type="number" value={value.segundosPorTurno} onChange={(event) => onChange({ ...value, segundosPorTurno: Number(event.target.value) })} error={Boolean(errors.segundosPorTurno)} errorMessage={errors.segundosPorTurno} />
      </FieldGrid>
      <TextArea theme={theme} neon={neon} label="Declaração e ordem das ações" value={value.regraDeclaracaoAcoes ?? ''} onChange={(event) => onChange({ ...value, regraDeclaracaoAcoes: event.target.value })} fullWidth />
    </SectionCard>

    <ConfigTable
      title="Resultados de dados"
      description="Agrupe intervalos pelo mesmo código de teste e dado. Intervalos precisam cobrir resultados sem sobreposição."
      rows={value.resultadosDado}
      columns={resultColumns}
      createRow={createResult}
      onChange={(resultadosDado) => onChange({ ...value, resultadosDado })}
      theme={theme}
      neon={neon}
      readOnly={readOnly}
      errors={errors}
      errorPath="resultadosDado"
      toolbar={!readOnly && value.resultadosDado.length === 0 ? (
        <button type="button" onClick={() => onChange({ ...value, resultadosDado: createDefaultD20Results() })}>
          Usar faixas D20 comuns
        </button>
      ) : undefined}
    />

    <ConfigTable
      title="Tipos de dano"
      description="Catálogo de dano e comportamento frente às camadas defensivas."
      rows={value.tiposDano}
      columns={damageColumns}
      createRow={createDamage}
      onChange={(tiposDano) => onChange({ ...value, tiposDano })}
      theme={theme}
      neon={neon}
      readOnly={readOnly}
      errors={errors}
      errorPath="tiposDano"
    />

    <ConfigTable
      title="Tipos de defesa"
      description="Defina a ordem de aplicação e se a camada reduz, absorve, desgasta ou bloqueia o dano."
      rows={value.tiposDefesa}
      columns={defenseColumns}
      createRow={createDefense}
      onChange={(tiposDefesa) => onChange({ ...value, tiposDefesa })}
      theme={theme}
      neon={neon}
      readOnly={readOnly}
      errors={errors}
      errorPath="tiposDefesa"
    />
  </ModuleFieldset>
);
