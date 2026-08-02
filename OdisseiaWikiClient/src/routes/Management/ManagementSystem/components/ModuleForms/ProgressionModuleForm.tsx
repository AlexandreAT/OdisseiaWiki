import { useMemo, useState } from 'react';
import { CheckBox } from '../../../../../components/Generic/CheckBox/CheckBox';
import { InputText } from '../../../../../components/Generic/InputText/InputText';
import {
  SistemaFonteExperiencia,
  SistemaMarcoProgressao,
  SistemaNivelProgressao,
} from '../../../../../models/SistemaRpg';
import { ConfigTable, ConfigTableColumn } from '../ConfigTable/ConfigTable';
import { ModuleFormProps } from './ModuleForm.types';
import {
  CurvePreview,
  FieldGrid,
  InlineChecks,
  ModuleFieldset,
  ModuleIntro,
  RangeTools,
  SectionCard,
} from './ModuleForms.style';

const levelColumns: ConfigTableColumn<SistemaNivelProgressao>[] = [
  { key: 'nivel', label: 'Nível', type: 'number', min: 1, width: '80px' },
  { key: 'xpParaProximoNivel', label: 'XP necessário', type: 'number', min: 0 },
  { key: 'pontosNivel', label: 'Pontos gerais', type: 'number', min: 0 },
  { key: 'pontosAtributo', label: 'Pontos de atributo', type: 'number', min: 0 },
  { key: 'pontosSkill', label: 'Pontos de skill', type: 'number', min: 0 },
  { key: 'pontosUltimate', label: 'Pontos de ultimate', type: 'number', min: 0 },
  { key: 'permiteNovaMagia', label: 'Nova magia', type: 'checkbox' },
  { key: 'permiteNovaSkill', label: 'Nova skill', type: 'checkbox' },
  { key: 'observacao', label: 'Observação', type: 'textarea', maxLength: 600 },
  { key: 'ordem', label: 'Ordem', type: 'number', min: 0 },
];

const milestoneColumns: ConfigTableColumn<SistemaMarcoProgressao>[] = [
  { key: 'nivel', label: 'Nível', type: 'number', min: 1 },
  { key: 'codigo', label: 'Código', type: 'text', maxLength: 50 },
  { key: 'nome', label: 'Nome', type: 'text', maxLength: 120 },
  { key: 'tipoRecompensa', label: 'Tipo de recompensa', type: 'text', maxLength: 80 },
  { key: 'descricao', label: 'Descrição', type: 'textarea', maxLength: 1000 },
  { key: 'ordem', label: 'Ordem', type: 'number', min: 0 },
];

const xpSourceColumns: ConfigTableColumn<SistemaFonteExperiencia>[] = [
  { key: 'codigo', label: 'Código', type: 'text', maxLength: 50 },
  { key: 'nome', label: 'Nome', type: 'text', maxLength: 120 },
  { key: 'tipoTeste', label: 'Tipo de teste', type: 'text', maxLength: 100 },
  { key: 'formula', label: 'Fórmula', type: 'text', maxLength: 250 },
  { key: 'valorMinimo', label: 'XP mínimo', type: 'number', nullable: true },
  { key: 'valorMaximo', label: 'XP máximo', type: 'number', nullable: true },
  { key: 'usaVantagem', label: 'Usa vantagem', type: 'checkbox' },
  { key: 'descricao', label: 'Descrição', type: 'textarea', maxLength: 1000 },
  { key: 'ordem', label: 'Ordem', type: 'number', min: 0 },
];

const createLevel = (level = 1): SistemaNivelProgressao => ({
  nivel: level,
  xpParaProximoNivel: 0,
  pontosNivel: 0,
  pontosAtributo: 0,
  pontosSkill: 0,
  pontosUltimate: 0,
  permiteNovaMagia: false,
  permiteNovaSkill: false,
  observacao: '',
  ordem: level,
});

const createMilestone = (): SistemaMarcoProgressao => ({
  nivel: 1,
  codigo: '',
  nome: '',
  descricao: '',
  tipoRecompensa: '',
  ordem: 1,
});

const createXpSource = (): SistemaFonteExperiencia => ({
  codigo: '',
  nome: '',
  tipoTeste: '',
  formula: '',
  valorMinimo: 0,
  valorMaximo: 0,
  usaVantagem: false,
  descricao: '',
  ordem: 1,
});

export const ProgressionModuleForm = ({
  value,
  onChange,
  errors,
  readOnly,
  theme,
  neon,
}: ModuleFormProps<'progressao'>) => {
  const [range, setRange] = useState({ from: 1, to: 1, xp: 0, points: 0 });
  const maximumXp = useMemo(() => Math.max(
    1,
    ...value.niveis.map((level) => level.xpParaProximoNivel),
  ), [value.niveis]);
  const totalPoints = useMemo(() => value.niveis.reduce(
    (total, level) => total + level.pontosNivel + level.pontosAtributo + level.pontosSkill + level.pontosUltimate,
    0,
  ), [value.niveis]);

  const generateMissingLevels = () => {
    const byLevel = new Map(value.niveis.map((level) => [level.nivel, level]));
    const niveis = Array.from({ length: Math.max(0, value.nivelMaximo) }, (_, index) => {
      const level = index + 1;
      return byLevel.get(level) ?? createLevel(level);
    });
    onChange({ ...value, niveis });
  };

  const fillRange = () => {
    const from = Math.max(1, Math.min(range.from, range.to));
    const to = Math.min(value.nivelMaximo, Math.max(range.from, range.to));
    const byLevel = new Map(value.niveis.map((level) => [level.nivel, level]));
    for (let level = from; level <= to; level += 1) {
      byLevel.set(level, {
        ...(byLevel.get(level) ?? createLevel(level)),
        xpParaProximoNivel: range.xp,
        pontosNivel: range.points,
      });
    }
    const niveis = [...byLevel.values()]
      .sort((left, right) => left.nivel - right.nivel)
      .map((level, index) => ({ ...level, ordem: index + 1 }));
    onChange({ ...value, niveis });
  };

  return (
    <ModuleFieldset disabled={readOnly}>
      <ModuleIntro theme={theme} neon={neon}>
        <div>
          <h3>Progressão</h3>
          <p>
            Configure a curva nível a nível, recompensas e fontes de experiência. Lacunas, níveis
            repetidos e valores negativos são sinalizados antes do salvamento e da publicação.
          </p>
        </div>
      </ModuleIntro>

      <SectionCard theme={theme} neon={neon}>
        <h4>Parâmetros da curva</h4>
        <p>Total de pontos concedidos na curva atual: {totalPoints}.</p>
        <FieldGrid $columns={3}>
          <InputText
            theme={theme}
            neon={neon}
            label="Nível máximo"
            type="number"
            value={value.nivelMaximo}
            onChange={(event) => onChange({ ...value, nivelMaximo: Number(event.target.value) })}
            error={Boolean(errors.nivelMaximo)}
            errorMessage={errors.nivelMaximo}
            required
          />
          <InlineChecks>
            <CheckBox
              neon={neon}
              label="Permitir XP excedente"
              checked={value.permiteXpExcedente}
              onChange={(permiteXpExcedente) => onChange({ ...value, permiteXpExcedente })}
              disabled={readOnly}
            />
          </InlineChecks>
        </FieldGrid>
        {value.niveis.length > 0 && (
          <CurvePreview theme={theme} neon={neon} title="Prévia da curva de XP">
            {[...value.niveis]
              .sort((left, right) => left.nivel - right.nivel)
              .map((level) => (
                <span
                  key={level.nivel}
                  title={`Nível ${level.nivel}: ${level.xpParaProximoNivel} XP`}
                  style={{ height: `${Math.max(2, (level.xpParaProximoNivel / maximumXp) * 100)}%` }}
                />
              ))}
          </CurvePreview>
        )}
      </SectionCard>

      <ConfigTable
        title="Níveis e XP"
        description="Gere a curva completa ou aplique XP e pontos gerais a um intervalo. Depois, ajuste os níveis individualmente."
        rows={value.niveis}
        columns={levelColumns}
        createRow={() => createLevel(value.niveis.length + 1)}
        onChange={(niveis) => onChange({ ...value, niveis })}
        theme={theme}
        neon={neon}
        readOnly={readOnly}
        errors={errors}
        errorPath="niveis"
        toolbar={!readOnly ? (
          <>
            <RangeTools>
              <input type="number" min="1" aria-label="Início da faixa" title="Nível inicial" value={range.from} onChange={(event) => setRange((current) => ({ ...current, from: Number(event.target.value) }))} />
              <input type="number" min="1" aria-label="Fim da faixa" title="Nível final" value={range.to} onChange={(event) => setRange((current) => ({ ...current, to: Number(event.target.value) }))} />
              <input type="number" min="0" aria-label="XP da faixa" title="XP necessário" value={range.xp} onChange={(event) => setRange((current) => ({ ...current, xp: Number(event.target.value) }))} />
              <input type="number" min="0" aria-label="Pontos da faixa" title="Pontos gerais" value={range.points} onChange={(event) => setRange((current) => ({ ...current, points: Number(event.target.value) }))} />
              <button type="button" onClick={fillRange}>Preencher faixa</button>
            </RangeTools>
            <button type="button" onClick={generateMissingLevels}>Gerar até o máximo</button>
          </>
        ) : undefined}
      />

      <ConfigTable
        title="Marcos e recompensas"
        description="Desbloqueios como ultimate, passiva racial, proficiência ou maestria."
        rows={value.marcos}
        columns={milestoneColumns}
        createRow={createMilestone}
        onChange={(marcos) => onChange({ ...value, marcos })}
        theme={theme}
        neon={neon}
        readOnly={readOnly}
        errors={errors}
        errorPath="marcos"
      />

      <ConfigTable
        title="Fontes de experiência"
        description="Missões, combates, MVP e outras fontes com valores ou fórmulas próprias."
        rows={value.fontesExperiencia}
        columns={xpSourceColumns}
        createRow={createXpSource}
        onChange={(fontesExperiencia) => onChange({ ...value, fontesExperiencia })}
        theme={theme}
        neon={neon}
        readOnly={readOnly}
        errors={errors}
        errorPath="fontesExperiencia"
      />
    </ModuleFieldset>
  );
};
