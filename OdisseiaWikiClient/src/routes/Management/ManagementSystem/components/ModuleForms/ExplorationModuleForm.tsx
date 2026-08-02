import { CheckBox } from '../../../../../components/Generic/CheckBox/CheckBox';
import { InputText } from '../../../../../components/Generic/InputText/InputText';
import { TextArea } from '../../../../../components/Generic/TextArea/TextArea';
import { SistemaAcaoConfig } from '../../../../../models/SistemaRpg';
import { ConfigTable, ConfigTableColumn } from '../ConfigTable/ConfigTable';
import { ModuleFormProps } from './ModuleForm.types';
import {
  FieldGrid,
  InlineChecks,
  ModuleFieldset,
  ModuleIntro,
  SectionCard,
} from './ModuleForms.style';

const actionColumns: ConfigTableColumn<SistemaAcaoConfig>[] = [
  { key: 'codigo', label: 'Código', type: 'text', maxLength: 50 },
  { key: 'nome', label: 'Nome', type: 'text', maxLength: 120 },
  { key: 'tipo', label: 'Tipo', type: 'text', maxLength: 80 },
  { key: 'custoPontosAcao', label: 'Pontos de ação', type: 'number', min: 0 },
  { key: 'custoEstamina', label: 'Estamina', type: 'number', min: 0 },
  { key: 'custoMana', label: 'Mana', type: 'number', min: 0 },
  { key: 'encerraTurno', label: 'Encerra turno', type: 'checkbox' },
  { key: 'permiteCombo', label: 'Permite combo', type: 'checkbox' },
  { key: 'exigeAlvo', label: 'Exige alvo', type: 'checkbox' },
  { key: 'formula', label: 'Fórmula', type: 'text', maxLength: 250 },
  { key: 'descricao', label: 'Descrição', type: 'textarea', maxLength: 1000 },
  { key: 'ordem', label: 'Ordem', type: 'number', min: 0 },
];

const createAction = (): SistemaAcaoConfig => ({
  codigo: '',
  nome: '',
  tipo: '',
  custoPontosAcao: 0,
  custoEstamina: 0,
  custoMana: 0,
  encerraTurno: false,
  permiteCombo: false,
  exigeAlvo: false,
  formula: '',
  descricao: '',
  ordem: 1,
});

export const ExplorationModuleForm = ({
  value,
  onChange,
  errors,
  readOnly,
  theme,
  neon,
}: ModuleFormProps<'exploracao'>) => {
  const movimento = value.movimento ?? {
    usaGrid: true,
    metrosPorQuadrado: 2,
    movimentoGratuito: 0,
    custoEstaminaPorQuadrado: 0,
    maximoQuadradosTurno: 0,
    permiteMoverAposAtaque: true,
    observacoes: '',
  };
  const pontosAcao = value.pontosAcao ?? {
    habilitado: false,
    pontosPorTurno: 0,
    segundosPorPonto: 0,
    permiteAcumular: false,
    limiteAcumulado: 0,
  };

  return (
    <ModuleFieldset disabled={readOnly}>
      <ModuleIntro theme={theme} neon={neon}>
        <div>
          <h3>Exploração e ações</h3>
          <p>
            Regras de grid, movimento, carga, furtividade e custos das ações. Valores ambíguos
            podem permanecer documentados até que o mestre escolha a interpretação da mesa.
          </p>
        </div>
      </ModuleIntro>

      <SectionCard theme={theme} neon={neon}>
        <h4>Grid e movimento</h4>
        <p>Defina a escala espacial e os custos básicos usados durante turnos e exploração.</p>
        <InlineChecks>
          <CheckBox neon={neon} label="Usar grid" checked={movimento.usaGrid} onChange={(usaGrid) => onChange({ ...value, movimento: { ...movimento, usaGrid } })} disabled={readOnly} />
          <CheckBox neon={neon} label="Mover após atacar" checked={movimento.permiteMoverAposAtaque} onChange={(permiteMoverAposAtaque) => onChange({ ...value, movimento: { ...movimento, permiteMoverAposAtaque } })} disabled={readOnly} />
        </InlineChecks>
        <FieldGrid $columns={4}>
          <InputText theme={theme} neon={neon} label="Metros por quadrado" type="number" value={movimento.metrosPorQuadrado} onChange={(event) => onChange({ ...value, movimento: { ...movimento, metrosPorQuadrado: Number(event.target.value) } })} error={Boolean(errors['movimento.metrosPorQuadrado'])} errorMessage={errors['movimento.metrosPorQuadrado']} />
          <InputText theme={theme} neon={neon} label="Movimento gratuito" type="number" value={movimento.movimentoGratuito} onChange={(event) => onChange({ ...value, movimento: { ...movimento, movimentoGratuito: Number(event.target.value) } })} error={Boolean(errors['movimento.movimentoGratuito'])} errorMessage={errors['movimento.movimentoGratuito']} />
          <InputText theme={theme} neon={neon} label="Estamina por quadrado" type="number" value={movimento.custoEstaminaPorQuadrado} onChange={(event) => onChange({ ...value, movimento: { ...movimento, custoEstaminaPorQuadrado: Number(event.target.value) } })} error={Boolean(errors['movimento.custoEstaminaPorQuadrado'])} errorMessage={errors['movimento.custoEstaminaPorQuadrado']} />
          <InputText theme={theme} neon={neon} label="Máximo por turno" type="number" value={movimento.maximoQuadradosTurno ?? ''} onChange={(event) => onChange({ ...value, movimento: { ...movimento, maximoQuadradosTurno: event.target.value === '' ? null : Number(event.target.value) } })} error={Boolean(errors['movimento.maximoQuadradosTurno'])} errorMessage={errors['movimento.maximoQuadradosTurno']} />
        </FieldGrid>
        <TextArea theme={theme} neon={neon} label="Observações sobre movimento" value={movimento.observacoes ?? ''} onChange={(event) => onChange({ ...value, movimento: { ...movimento, observacoes: event.target.value } })} fullWidth />
      </SectionCard>

      <SectionCard theme={theme} neon={neon}>
        <h4>Pontos de ação</h4>
        <p>O módulo pode ser desativado para sistemas que usam apenas ações narrativas ou cadência.</p>
        <InlineChecks>
          <CheckBox neon={neon} label="Habilitar pontos de ação" checked={pontosAcao.habilitado} onChange={(habilitado) => onChange({ ...value, pontosAcao: { ...pontosAcao, habilitado } })} disabled={readOnly} />
          <CheckBox neon={neon} label="Permitir acumular" checked={pontosAcao.permiteAcumular} onChange={(permiteAcumular) => onChange({ ...value, pontosAcao: { ...pontosAcao, permiteAcumular } })} disabled={readOnly} />
        </InlineChecks>
        <FieldGrid $columns={3}>
          <InputText theme={theme} neon={neon} label="Pontos por turno" type="number" value={pontosAcao.pontosPorTurno} onChange={(event) => onChange({ ...value, pontosAcao: { ...pontosAcao, pontosPorTurno: Number(event.target.value) } })} error={Boolean(errors['pontosAcao.pontosPorTurno'])} errorMessage={errors['pontosAcao.pontosPorTurno']} />
          <InputText theme={theme} neon={neon} label="Segundos por ponto" type="number" value={pontosAcao.segundosPorPonto} onChange={(event) => onChange({ ...value, pontosAcao: { ...pontosAcao, segundosPorPonto: Number(event.target.value) } })} error={Boolean(errors['pontosAcao.segundosPorPonto'])} errorMessage={errors['pontosAcao.segundosPorPonto']} />
          <InputText theme={theme} neon={neon} label="Limite acumulado" type="number" value={pontosAcao.limiteAcumulado} onChange={(event) => onChange({ ...value, pontosAcao: { ...pontosAcao, limiteAcumulado: Number(event.target.value) } })} error={Boolean(errors['pontosAcao.limiteAcumulado'])} errorMessage={errors['pontosAcao.limiteAcumulado']} />
        </FieldGrid>
      </SectionCard>

      <SectionCard theme={theme} neon={neon}>
        <h4>Carga e furtividade</h4>
        <InlineChecks>
          <CheckBox neon={neon} label="Carga possui limite" checked={value.cargaUsaLimite} onChange={(cargaUsaLimite) => onChange({ ...value, cargaUsaLimite })} disabled={readOnly} />
        </InlineChecks>
        <FieldGrid $columns={2}>
          <TextArea theme={theme} neon={neon} label="Penalidade por excesso de carga" value={value.penalidadeExcessoCarga ?? ''} onChange={(event) => onChange({ ...value, penalidadeExcessoCarga: event.target.value })} fullWidth />
          <TextArea theme={theme} neon={neon} label="Regras de furtividade" value={value.furtividadeObservacoes ?? ''} onChange={(event) => onChange({ ...value, furtividadeObservacoes: event.target.value })} fullWidth />
        </FieldGrid>
      </SectionCard>

      <ConfigTable
        title="Ações"
        description="Ações configuráveis, custos e efeitos sobre o turno. A decisão contextual continua com o mestre."
        rows={value.acoes}
        columns={actionColumns}
        createRow={createAction}
        onChange={(acoes) => onChange({ ...value, acoes })}
        theme={theme}
        neon={neon}
        readOnly={readOnly}
        errors={errors}
        errorPath="acoes"
      />
    </ModuleFieldset>
  );
};
