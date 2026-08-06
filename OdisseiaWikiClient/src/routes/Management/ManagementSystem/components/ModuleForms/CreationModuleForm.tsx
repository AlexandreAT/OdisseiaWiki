import { useMemo } from 'react';
import { InputText } from '../../../../../components/Generic/InputText/InputText';
import {
  SistemaAtributoConfig,
  SistemaRacaConfig,
  SistemaRecursoConfig,
} from '../../../../../models/SistemaRpg';
import { ConfigTable, ConfigTableColumn } from '../ConfigTable/ConfigTable';
import { ModuleFormProps } from './ModuleForm.types';
import { FieldGrid, ModuleFieldset, ModuleIntro, SectionCard } from './ModuleForms.style';

const attributeGroups = [
  { label: 'Principal', value: 'Principal' },
  { label: 'Secundário', value: 'Secundario' },
  { label: 'Defesa', value: 'Defesa' },
  { label: 'Outro', value: 'Outro' },
];

const attributeColumns: ConfigTableColumn<SistemaAtributoConfig>[] = [
  { key: 'codigo', label: 'Código', type: 'text', maxLength: 50 },
  { key: 'nome', label: 'Nome', type: 'text', maxLength: 100 },
  { key: 'grupo', label: 'Grupo', type: 'select', options: attributeGroups },
  { key: 'valorMinimo', label: 'Mínimo', type: 'number' },
  { key: 'valorComum', label: 'Comum', type: 'number' },
  { key: 'valorMaximoNatural', label: 'Máx. natural', type: 'number' },
  { key: 'valorMaximoAbsoluto', label: 'Máx. absoluto', type: 'number', nullable: true },
  { key: 'formulaTeste', label: 'Fórmula de teste', type: 'text', maxLength: 250 },
  { key: 'limiteUso', label: 'Limite de uso', type: 'number', min: 0, nullable: true },
  { key: 'tipoLimiteUso', label: 'Tipo do limite', type: 'text', maxLength: 80 },
  { key: 'ativo', label: 'Ativo', type: 'checkbox' },
  { key: 'descricao', label: 'Descrição', type: 'textarea', maxLength: 600 },
  { key: 'ordem', label: 'Ordem', type: 'number', min: 0 },
];

const resourceColumns: ConfigTableColumn<SistemaRecursoConfig>[] = [
  { key: 'codigo', label: 'Código', type: 'text', maxLength: 50 },
  { key: 'nome', label: 'Nome', type: 'text', maxLength: 100 },
  { key: 'valorMinimo', label: 'Mínimo', type: 'number' },
  { key: 'valorPadrao', label: 'Padrão', type: 'number' },
  { key: 'valorMaximo', label: 'Máximo', type: 'number', nullable: true },
  { key: 'permiteValorNegativo', label: 'Permite negativo', type: 'checkbox' },
  { key: 'recuperacaoPadrao', label: 'Recuperação', type: 'number' },
  { key: 'recuperacaoDescansoSimples', label: 'Descanso simples', type: 'number' },
  { key: 'recuperacaoDescansoNormal', label: 'Descanso normal', type: 'number' },
  { key: 'recuperacaoDescansoLongo', label: 'Descanso longo', type: 'number' },
  { key: 'condicaoAoZerar', label: 'Ao zerar', type: 'text', maxLength: 180 },
  { key: 'formulaValorInicial', label: 'Fórmula inicial', type: 'text', maxLength: 250 },
  { key: 'formulaValorMaximo', label: 'Fórmula máxima', type: 'text', maxLength: 250 },
  { key: 'formula', label: 'Fórmula', type: 'text', maxLength: 250 },
  { key: 'ativo', label: 'Ativo', type: 'checkbox' },
  { key: 'ordem', label: 'Ordem', type: 'number', min: 0 },
];

const createAttribute = (): SistemaAtributoConfig => ({
  codigo: '',
  nome: '',
  grupo: 'Principal',
  valorMinimo: 0,
  valorMaximoNatural: 5,
  valorMaximoAbsoluto: 6,
  valorComum: 0,
  formulaTeste: '',
  limiteUso: 0,
  tipoLimiteUso: '',
  descricao: '',
  ordem: 1,
  ativo: true,
});

const createResource = (): SistemaRecursoConfig => ({
  codigo: '',
  nome: '',
  valorMinimo: 0,
  valorPadrao: 0,
  valorMaximo: 0,
  permiteValorNegativo: false,
  recuperacaoPadrao: 0,
  recuperacaoDescansoSimples: 0,
  recuperacaoDescansoNormal: 0,
  recuperacaoDescansoLongo: 0,
  condicaoAoZerar: '',
  formulaValorInicial: '',
  formulaValorMaximo: '',
  formula: '',
  ordem: 1,
  ativo: true,
});

const createRace = (): SistemaRacaConfig => ({
  idRaca: null,
  codigoRaca: '',
  nomeRaca: '',
  jogavel: true,
  vidaBase: 0,
  estaminaBase: 0,
  manaBase: 0,
  capacidadeCargaBase: 0,
  codigoAtributoInicial: '',
  passivas: '',
  variantes: '',
  nivelDesbloqueio: 1,
  observacoes: '',
  ordem: 1,
  passivasVinculadas: [],
});

export const CreationModuleForm = ({
  value,
  onChange,
  errors,
  readOnly,
  theme,
  neon,
  raceOptions = [],
  systemCode,
}: ModuleFormProps<'criacao'>) => {
  const mirrorsWikiRaces = systemCode?.toUpperCase() === 'ODISSEIA';
  const raceColumns = useMemo<ConfigTableColumn<SistemaRacaConfig>[]>(() => [
    {
      key: 'idRaca',
      label: 'Raça da Wiki',
      type: 'select',
      options: raceOptions.map((race) => ({ label: race.nome, value: race.id })),
      width: '180px',
    },
    { key: 'jogavel', label: 'Jogável', type: 'checkbox' },
    { key: 'vidaBase', label: 'Vida', type: 'number', min: 0 },
    { key: 'estaminaBase', label: 'Estamina', type: 'number', min: 0 },
    { key: 'manaBase', label: 'Mana', type: 'number', min: 0 },
    { key: 'capacidadeCargaBase', label: 'Carga', type: 'number', min: 0 },
    {
      key: 'codigoAtributoInicial',
      label: 'Atributo inicial',
      type: 'select',
      options: value.atributos.map((attribute) => ({
        label: attribute.nome || attribute.codigo,
        value: attribute.codigo,
      })),
    },
    { key: 'nivelDesbloqueio', label: 'Nível', type: 'number', min: 1 },
    { key: 'passivas', label: 'Passivas / vínculos', type: 'textarea', maxLength: 1000 },
    { key: 'variantes', label: 'Variantes', type: 'textarea', maxLength: 1000 },
    { key: 'observacoes', label: 'Observações', type: 'textarea', maxLength: 1000 },
    { key: 'ordem', label: 'Ordem', type: 'number', min: 0 },
  ], [raceOptions, value.atributos]);

  const setNumber = (field: keyof typeof value) => (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, [field]: Number(event.target.value) });
  };

  return (
    <ModuleFieldset disabled={readOnly}>
      <ModuleIntro theme={theme} neon={neon}>
        <div>
          <h3>Criação de personagem</h3>
          <p>
            Defina os valores iniciais, atributos, recursos e a leitura mecânica das raças da Wiki
            para esta versão. A lore da raça continua na entidade original.
          </p>
        </div>
      </ModuleIntro>

      <SectionCard theme={theme} neon={neon}>
        <h4>Valores iniciais</h4>
        <p>Limites e pontos disponíveis no momento em que a ficha é criada.</p>
        <FieldGrid $columns={4}>
          <InputText theme={theme} neon={neon} label="Nível inicial" type="number" value={value.nivelInicial} onChange={setNumber('nivelInicial')} error={Boolean(errors.nivelInicial)} errorMessage={errors.nivelInicial} required />
          <InputText theme={theme} neon={neon} label="Pontos gerais" type="number" value={value.pontosIniciais} onChange={setNumber('pontosIniciais')} error={Boolean(errors.pontosIniciais)} errorMessage={errors.pontosIniciais} />
          <InputText theme={theme} neon={neon} label="Pontos de atributo" type="number" value={value.pontosAtributoIniciais} onChange={setNumber('pontosAtributoIniciais')} error={Boolean(errors.pontosAtributoIniciais)} errorMessage={errors.pontosAtributoIniciais} />
          <InputText theme={theme} neon={neon} label="Pontos de skill" type="number" value={value.pontosSkillIniciais} onChange={setNumber('pontosSkillIniciais')} error={Boolean(errors.pontosSkillIniciais)} errorMessage={errors.pontosSkillIniciais} />
          <InputText theme={theme} neon={neon} label="Skills iniciais" type="number" value={value.maximoSkillsIniciais} onChange={setNumber('maximoSkillsIniciais')} error={Boolean(errors.maximoSkillsIniciais)} errorMessage={errors.maximoSkillsIniciais} />
          <InputText theme={theme} neon={neon} label="Magias iniciais" type="number" value={value.maximoMagiasIniciais} onChange={setNumber('maximoMagiasIniciais')} error={Boolean(errors.maximoMagiasIniciais)} errorMessage={errors.maximoMagiasIniciais} />
          <InputText theme={theme} neon={neon} label="Ultimates iniciais" type="number" value={value.maximoUltimatesIniciais} onChange={setNumber('maximoUltimatesIniciais')} error={Boolean(errors.maximoUltimatesIniciais)} errorMessage={errors.maximoUltimatesIniciais} />
        </FieldGrid>
      </SectionCard>

      <ConfigTable
        title="Atributos"
        description="Catálogo reutilizável de atributos principais, secundários, defesas ou extensões do sistema."
        rows={value.atributos}
        columns={attributeColumns}
        createRow={createAttribute}
        onChange={(atributos) => onChange({ ...value, atributos })}
        theme={theme}
        neon={neon}
        readOnly={readOnly}
        errors={errors}
        errorPath="atributos"
      />

      <ConfigTable
        title="Recursos"
        description="Vida, estamina, mana, carga e outros recursos configuráveis da ficha."
        rows={value.recursos}
        columns={resourceColumns}
        createRow={createResource}
        onChange={(recursos) => onChange({ ...value, recursos })}
        theme={theme}
        neon={neon}
        readOnly={readOnly}
        errors={errors}
        errorPath="recursos"
      />

      <ConfigTable
        title="Raças na versão"
        description={mirrorsWikiRaces
          ? 'No Sistema ODISSEIA, todas as raças são incluídas automaticamente e estes valores espelham o cadastro da Wiki. Edite-os no formulário da própria raça.'
          : 'Associe somente raças já cadastradas; os valores desta tabela são mecânicos e versionados.'}
        rows={value.racas}
        columns={raceColumns}
        createRow={createRace}
        onChange={(racas) => onChange({
          ...value,
          racas: racas.map((race) => {
            const selectedRace = raceOptions.find((option) => option.id === Number(race.idRaca));
            return selectedRace
              ? { ...race, nomeRaca: selectedRace.nome }
              : race;
          }),
        })}
        theme={theme}
        neon={neon}
        readOnly={readOnly || mirrorsWikiRaces}
        errors={errors}
        errorPath="racas"
      />
    </ModuleFieldset>
  );
};
