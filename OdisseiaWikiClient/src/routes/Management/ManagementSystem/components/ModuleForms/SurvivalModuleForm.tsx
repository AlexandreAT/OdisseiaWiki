import { CheckBox } from '../../../../../components/Generic/CheckBox/CheckBox';
import { InputText } from '../../../../../components/Generic/InputText/InputText';
import { TextArea } from '../../../../../components/Generic/TextArea/TextArea';
import {
  SistemaCondicao,
  SistemaDescansoConfig,
} from '../../../../../models/SistemaRpg';
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

const conditionColumns: ConfigTableColumn<SistemaCondicao>[] = [
  { key: 'codigo', label: 'Código', type: 'text', maxLength: 50 },
  { key: 'nome', label: 'Nome', type: 'text', maxLength: 120 },
  { key: 'tipo', label: 'Tipo', type: 'text', maxLength: 80 },
  { key: 'duracaoPadrao', label: 'Duração', type: 'number', min: 0, nullable: true },
  {
    key: 'unidadeDuracao',
    label: 'Unidade',
    type: 'select',
    options: [
      { value: 'Turno', label: 'Turno' },
      { value: 'Minuto', label: 'Minuto' },
      { value: 'Hora', label: 'Hora' },
      { value: 'Descanso', label: 'Descanso' },
      { value: 'Sessao', label: 'Sessão' },
      { value: 'Permanente', label: 'Permanente' },
    ],
  },
  { key: 'empilhavel', label: 'Empilhável', type: 'checkbox' },
  { key: 'remocaoAutomatica', label: 'Remoção automática', type: 'checkbox' },
  { key: 'permiteSobrescrever', label: 'Sobrescrever ao aplicar', type: 'checkbox' },
  { key: 'valorPadrao', label: 'Valor padrão', type: 'number', nullable: true },
  { key: 'descricao', label: 'Descrição / efeito', type: 'textarea', maxLength: 1400 },
  { key: 'ordem', label: 'Ordem', type: 'number', min: 0 },
];

const restColumns: ConfigTableColumn<SistemaDescansoConfig>[] = [
  { key: 'tipo', label: 'Tipo', type: 'text', maxLength: 50 },
  { key: 'nome', label: 'Nome', type: 'text', maxLength: 120 },
  { key: 'duracaoMinimaMinutos', label: 'Duração mínima', type: 'number', min: 0, nullable: true },
  { key: 'duracaoMaximaMinutos', label: 'Duração máxima', type: 'number', min: 0, nullable: true },
  { key: 'recuperacaoVida', label: 'Vida', type: 'number' },
  { key: 'recuperacaoMana', label: 'Mana', type: 'number' },
  { key: 'recuperacaoEstamina', label: 'Estamina', type: 'number' },
  {
    key: 'tipoRecuperacao',
    label: 'Tipo da recuperação',
    type: 'select',
    options: [
      { value: 'ValorFixo', label: 'Valor fixo' },
      { value: 'Percentual', label: 'Percentual' },
      { value: 'Formula', label: 'Fórmula' },
    ],
  },
  { key: 'exigeGuarda', label: 'Exige guarda', type: 'checkbox' },
  { key: 'intervaloTesteGuardaMinutos', label: 'Intervalo da guarda', type: 'number', min: 0, nullable: true },
  { key: 'permiteAtividades', label: 'Permite atividades', type: 'checkbox' },
  { key: 'ordem', label: 'Ordem', type: 'number', min: 0 },
];

const createCondition = (): SistemaCondicao => ({
  codigo: '',
  nome: '',
  descricao: '',
  tipo: '',
  duracaoPadrao: 0,
  unidadeDuracao: 'Turno',
  empilhavel: false,
  remocaoAutomatica: false,
  permiteSobrescrever: true,
  valorPadrao: 0,
  ordem: 1,
});

const createRest = (): SistemaDescansoConfig => ({
  tipo: '',
  nome: '',
  duracaoMinimaMinutos: 0,
  duracaoMaximaMinutos: 0,
  recuperacaoVida: 0,
  recuperacaoMana: 0,
  recuperacaoEstamina: 0,
  tipoRecuperacao: 'ValorFixo',
  exigeGuarda: false,
  intervaloTesteGuardaMinutos: 0,
  permiteAtividades: false,
  ordem: 1,
});

export const SurvivalModuleForm = ({
  value,
  onChange,
  errors,
  readOnly,
  theme,
  neon,
}: ModuleFormProps<'sobrevivencia'>) => {
  const morte = value.morte ?? {
    limiteBeiraDaMorte: 0,
    quantidadeTestesCombate: 3,
    quantidadeTestesForaCombate: 3,
    sucessosNecessarios: 2,
    dadoSobrevivencia: 'D20',
    resultadoMinimoSucesso: 11,
    limiteVidaDesmembramento: 0,
    multiplicadorDanoDesmembramento: 0,
    limiteVidaInstaKill: 0,
    multiplicadorDanoInstaKill: 0,
    permiteEstabilizacaoManual: true,
    observacoes: '',
  };

  return (
    <ModuleFieldset disabled={readOnly}>
      <ModuleIntro theme={theme} neon={neon}>
        <div>
          <h3>Sobrevivência</h3>
          <p>
            Condições, descanso, refeições, loot e estados de morte. Duração e intensidade podem
            continuar sendo sobrescritas pelo mestre em cada aplicação.
          </p>
        </div>
      </ModuleIntro>

      <ConfigTable
        title="Condições"
        description="Definições globais. A condição aplicada ao personagem manterá duração, origem e valor próprios."
        rows={value.condicoes}
        columns={conditionColumns}
        createRow={createCondition}
        onChange={(condicoes) => onChange({ ...value, condicoes })}
        theme={theme}
        neon={neon}
        readOnly={readOnly}
        errors={errors}
        errorPath="condicoes"
      />

      <ConfigTable
        title="Descansos"
        description="Recuperações podem representar valores fixos, percentuais ou regras documentadas."
        rows={value.descansos}
        columns={restColumns}
        createRow={createRest}
        onChange={(descansos) => onChange({ ...value, descansos })}
        theme={theme}
        neon={neon}
        readOnly={readOnly}
        errors={errors}
        errorPath="descansos"
      />

      <SectionCard theme={theme} neon={neon}>
        <h4>Fluxo de morte e estabilização</h4>
        <p>Os limites podem ser negativos e devem refletir explicitamente a regra decidida para esta versão.</p>
        <InlineChecks>
          <CheckBox
            neon={neon}
            label="Configurar fluxo de morte"
            checked={Boolean(value.morte)}
            onChange={(enabled) => onChange({ ...value, morte: enabled ? morte : null })}
            disabled={readOnly}
          />
        </InlineChecks>
        {value.morte && (
          <>
        <ModuleWarning>
          Estes valores auxiliam a validação futura, mas não substituem decisões narrativas, desmembramento contextual ou autoridade do mestre.
        </ModuleWarning>
        <FieldGrid $columns={4}>
          <InputText theme={theme} neon={neon} label="Limite à beira da morte" type="number" value={morte.limiteBeiraDaMorte} onChange={(event) => onChange({ ...value, morte: { ...morte, limiteBeiraDaMorte: Number(event.target.value) } })} />
          <InputText theme={theme} neon={neon} label="Testes em combate" type="number" value={morte.quantidadeTestesCombate} onChange={(event) => onChange({ ...value, morte: { ...morte, quantidadeTestesCombate: Number(event.target.value) } })} error={Boolean(errors['morte.quantidadeTestesCombate'])} errorMessage={errors['morte.quantidadeTestesCombate']} />
          <InputText theme={theme} neon={neon} label="Testes fora de combate" type="number" value={morte.quantidadeTestesForaCombate} onChange={(event) => onChange({ ...value, morte: { ...morte, quantidadeTestesForaCombate: Number(event.target.value) } })} error={Boolean(errors['morte.quantidadeTestesForaCombate'])} errorMessage={errors['morte.quantidadeTestesForaCombate']} />
          <InputText theme={theme} neon={neon} label="Sucessos necessários" type="number" value={morte.sucessosNecessarios} onChange={(event) => onChange({ ...value, morte: { ...morte, sucessosNecessarios: Number(event.target.value) } })} error={Boolean(errors['morte.sucessosNecessarios'])} errorMessage={errors['morte.sucessosNecessarios']} />
          <InputText theme={theme} neon={neon} label="Dado de sobrevivência" value={morte.dadoSobrevivencia} onChange={(event) => onChange({ ...value, morte: { ...morte, dadoSobrevivencia: event.target.value.toUpperCase() } })} error={Boolean(errors['morte.dadoSobrevivencia'])} errorMessage={errors['morte.dadoSobrevivencia']} />
          <InputText theme={theme} neon={neon} label="Resultado mínimo" type="number" value={morte.resultadoMinimoSucesso} onChange={(event) => onChange({ ...value, morte: { ...morte, resultadoMinimoSucesso: Number(event.target.value) } })} error={Boolean(errors['morte.resultadoMinimoSucesso'])} errorMessage={errors['morte.resultadoMinimoSucesso']} />
          <InputText theme={theme} neon={neon} label="Vida para desmembramento" type="number" value={morte.limiteVidaDesmembramento} onChange={(event) => onChange({ ...value, morte: { ...morte, limiteVidaDesmembramento: Number(event.target.value) } })} />
          <InputText theme={theme} neon={neon} label="Multiplicador de desmembramento" type="number" value={morte.multiplicadorDanoDesmembramento} onChange={(event) => onChange({ ...value, morte: { ...morte, multiplicadorDanoDesmembramento: Number(event.target.value) } })} />
          <InputText theme={theme} neon={neon} label="Vida para insta kill" type="number" value={morte.limiteVidaInstaKill} onChange={(event) => onChange({ ...value, morte: { ...morte, limiteVidaInstaKill: Number(event.target.value) } })} />
          <InputText theme={theme} neon={neon} label="Multiplicador de insta kill" type="number" value={morte.multiplicadorDanoInstaKill} onChange={(event) => onChange({ ...value, morte: { ...morte, multiplicadorDanoInstaKill: Number(event.target.value) } })} />
        </FieldGrid>
        <InlineChecks>
          <CheckBox neon={neon} label="Permitir estabilização manual" checked={morte.permiteEstabilizacaoManual} onChange={(permiteEstabilizacaoManual) => onChange({ ...value, morte: { ...morte, permiteEstabilizacaoManual } })} disabled={readOnly} />
        </InlineChecks>
        <TextArea theme={theme} neon={neon} label="Observações sobre morte" value={morte.observacoes ?? ''} onChange={(event) => onChange({ ...value, morte: { ...morte, observacoes: event.target.value } })} fullWidth />
          </>
        )}
      </SectionCard>

      <SectionCard theme={theme} neon={neon}>
        <h4>Loot e refeições</h4>
        <FieldGrid $columns={2}>
          <TextArea theme={theme} neon={neon} label="Regras de loot e drops" value={value.regraLoot ?? ''} onChange={(event) => onChange({ ...value, regraLoot: event.target.value })} fullWidth />
          <TextArea theme={theme} neon={neon} label="Refeições e bebidas" value={value.regraRefeicoes ?? ''} onChange={(event) => onChange({ ...value, regraRefeicoes: event.target.value })} fullWidth />
        </FieldGrid>
      </SectionCard>
    </ModuleFieldset>
  );
};
