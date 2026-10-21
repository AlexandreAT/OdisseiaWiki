import { useEffect, useRef, useState } from 'react';
import { obterReferenciasCondicaoSistemaRpg } from '../../../../../services/sistemasRpgService';
import SettingsIcon from '@mui/icons-material/Settings';
import { CyberButton } from '../../../../../components/Generic/HighlightButton/HighlightButton';
import { CheckBox } from '../../../../../components/Generic/CheckBox/CheckBox';
import { InputText } from '../../../../../components/Generic/InputText/InputText';
import { Select } from '../../../../../components/Generic/Select/Select';
import { SistemaCondicao } from '../../../../../models/SistemaRpg';
import { ConfigTable, ConfigTableColumn } from '../ConfigTable/ConfigTable';
import { IconAction } from '../ConfigTable/ConfigTable.style';
import { SistemaValidationErrors } from '../../systemValidation';
import { SystemReferenceCatalog } from './ModuleForm.types';
import { FieldGrid, InlineChecks, SectionCard } from './ModuleForms.style';

const removalOptions = [
  { value: 'MANUAL', label: 'O mestre remove' },
  { value: 'GATILHO_CESSOU', label: 'O gatilho deixou de valer' },
  { value: 'DURACAO', label: 'A duração terminou' },
  { value: 'DESCANSO_SIMPLES', label: 'Descanso simples ou maior' },
  { value: 'DESCANSO_NORMAL', label: 'Descanso normal ou longo' },
  { value: 'DESCANSO_LONGO', label: 'Descanso longo' },
  { value: 'CURA', label: 'Ao receber cura' },
  { value: 'MAGIA', label: 'Por magia de remoção' },
];

const removalCodes = (value?: string | null): string[] => (value || 'MANUAL').split(';')
  .map((entry) => entry.trim().toUpperCase()).filter(Boolean);

const operationOptions = [
  { value: 'SUBTRAIR', label: 'Diminuir recurso' },
  { value: 'SOMAR', label: 'Recuperar recurso' },
  { value: 'DEFINIR', label: 'Definir valor do recurso' },
  { value: 'REDUZIR_LIMITE_PERCENTUAL', label: 'Reduzir máximo (%) enquanto ativa' },
  { value: 'BLOQUEAR_RECUPERACAO', label: 'Bloquear recuperação enquanto ativa' },
];

interface AdditionalConditionEffect {
  operacao: string;
  recurso: string;
  valor: number;
  momento: string;
}

const extraOperationOptions = [
  ...operationOptions,
  { value: 'MODIFICAR_ROLAGEM', label: 'Somar ou subtrair de teste com atributo' },
  { value: 'MODIFICAR_ATRIBUTO', label: 'Alterar atributo nos testes (− penalidade, + bônus)' },
  { value: 'MODIFICAR_DANO', label: 'Alterar dano causado (− ou +)' },
  { value: 'MODIFICAR_DEFESA', label: 'Alterar armadura fixa (− ou +)' },
  { value: 'MODIFICAR_LIMITE_PERCENTUAL', label: 'Alterar máximo do recurso em % (− ou +)' },
  { value: 'DESVANTAGEM', label: 'Impor desvantagem no teste' },
  { value: 'VANTAGEM', label: 'Conceder vantagem no teste' },
  { value: 'PERDER_TURNOS', label: 'Fazer perder turnos ao aplicar' },
];

const parseExtraEffects = (json?: string | null): AdditionalConditionEffect[] => {
  try {
    const root = JSON.parse(json || '{}') as { efeitos?: AdditionalConditionEffect[] };
    return Array.isArray(root.efeitos) ? root.efeitos : [];
  } catch { return []; }
};

const serializeExtraEffects = (json: string | null | undefined, effects: AdditionalConditionEffect[]) => {
  let root: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(json || '{}') as Record<string, unknown>;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) root = parsed;
  } catch { /* invalid legacy JSON is replaced only when the editor changes effects */ }
  return JSON.stringify({ ...root, efeitos: effects });
};

const timeOptions = [
  { value: 'AO_APLICAR', label: 'Uma vez, quando ativar' },
  { value: 'INICIO_TURNO', label: 'No início de cada turno' },
  { value: 'FIM_TURNO', label: 'No fim de cada turno' },
  { value: 'ENQUANTO_ATIVA', label: 'Enquanto estiver ativa' },
];

const unitOptions = [
  { value: 'Turno', label: 'Turnos' },
  { value: 'Minuto', label: 'Minutos' },
  { value: 'Hora', label: 'Horas' },
  { value: 'Descanso', label: 'Descansos' },
  { value: 'Sessao', label: 'Sessões' },
  { value: 'Permanente', label: 'Permanente' },
];

const createCondition = (): SistemaCondicao => ({
  codigo: '', nome: '', descricao: '', tipo: '', duracaoPadrao: null,
  unidadeDuracao: 'Turno', empilhavel: false, remocaoAutomatica: false,
  permiteSobrescrever: true, valorPadrao: null, codigoRecurso: '',
  operacaoEfeito: '', valorEfeito: null, momentoEfeito: '',
  codigoRecursoGatilho: '', operadorGatilho: '', valorGatilho: null,
  cooldownTurnos: null, regraRemocao: 'MANUAL', ordem: 1,
});

interface Props {
  rows: SistemaCondicao[];
  onChange: (rows: SistemaCondicao[]) => void;
  onConfirmedRemoval?: (rows: SistemaCondicao[], codigo: string) => void;
  errors: SistemaValidationErrors;
  readOnly: boolean;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  references?: SystemReferenceCatalog;
  idSistemaVersao?: number;
}

export const ConditionRulesEditor = ({ rows, onChange, onConfirmedRemoval, errors, readOnly, theme, neon, references, idSistemaVersao }: Props) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [removalWarning, setRemovalWarning] = useState('');
  const [pendingRemoval, setPendingRemoval] = useState<{ codigo: string } | null>(null);
  const configurationRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (selectedIndex >= rows.length) setSelectedIndex(-1);
  }, [rows.length, selectedIndex]);
  const selected = rows[selectedIndex];
  const extraEffects = parseExtraEffects(selected?.configuracaoPadraoJson);
  const updateExtraEffects = (next: AdditionalConditionEffect[]) => {
    update('configuracaoPadraoJson', serializeExtraEffects(selected?.configuracaoPadraoJson, next));
  };
  const showConfiguration = (index: number) => {
    setSelectedIndex(index);
    requestAnimationFrame(() => {
      configurationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      configurationRef.current?.focus({ preventScroll: true });
    });
  };
  const update = <K extends keyof SistemaCondicao>(key: K, next: SistemaCondicao[K]) => {
    onChange(rows.map((row, index) => index === selectedIndex ? { ...row, [key]: next } : row));
  };
  const handleRowsChange = (next: SistemaCondicao[]) => {
    const removed = rows.find((row) => row.codigo && !next.some((candidate) =>
      candidate.codigo.toUpperCase() === row.codigo.toUpperCase() ||
      row.idSistemaCondicao && candidate.idSistemaCondicao === row.idSistemaCondicao));
    if (!removed || !idSistemaVersao || !removed.idSistemaCondicao) {
      setRemovalWarning('');
      setPendingRemoval(null);
      onChange(next);
      return;
    }
    setRemovalWarning(`Verificando onde ${removed.nome || removed.codigo} é usada...`);
    void obterReferenciasCondicaoSistemaRpg(idSistemaVersao, removed.codigo).then((referencesFound) => {
      if (referencesFound.length > 0) {
        setRemovalWarning(`Antes de remover ${removed.nome || removed.codigo}, confira as referências: ${referencesFound.slice(0, 8).join(', ')}${referencesFound.length > 8 ? ` e mais ${referencesFound.length - 8}` : ''}. Remover a regra tornará essas origens antigas sem efeito neste Sistema.`);
        setPendingRemoval({ codigo: removed.codigo });
        return;
      }
      setRemovalWarning('');
      setPendingRemoval(null);
      onChange(next);
    }).catch(() => setRemovalWarning('Não foi possível verificar as referências. A condição foi mantida; tente novamente.'));
  };
  const columns: ConfigTableColumn<SistemaCondicao>[] = [
    { key: 'codigo', label: 'Código', type: 'text', maxLength: 50 },
    { key: 'nome', label: 'Nome', type: 'text', maxLength: 120 },
    { key: 'tipo', label: 'Tipo', type: 'text', maxLength: 80 },
    { key: 'descricao', label: 'Descrição para jogadores (não executa)', type: 'textarea', maxLength: 1400 },
    { key: 'regraRemocao', label: 'Regra', render: (_, row) => (
      <IconAction as="div" role="button" tabIndex={0}
        onClick={() => showConfiguration(rows.indexOf(row))}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            showConfiguration(rows.indexOf(row));
          }
        }}
        aria-controls="condition-rule-configuration" aria-expanded={selectedIndex === rows.indexOf(row)}
        aria-label={`Configurar ${row.nome || 'condição'}`} title="Ver gatilho, efeito e recuperação">
        <SettingsIcon fontSize="small" /><span>Configurar</span>
      </IconAction>
    ) },
  ];
  const triggerOptions = [
    ...(references?.resources ?? []),
    { value: 'EXCESSO_CARGA', label: 'Excesso de carga (peso menos capacidade)' },
    { value: 'CARGA', label: 'Peso carregado' },
  ];
  const resourceOptions = references?.resources ?? [];
  const withCurrent = (options: { value: string; label: string }[], current: string | null | undefined) =>
    current && !options.some((option) => option.value === current)
      ? [{ value: current, label: `Valor anterior: ${current}` }, ...options] : options;

  return <>
    <ConfigTable title="Condições" rows={rows} columns={columns} createRow={createCondition}
      onChange={handleRowsChange} theme={theme} neon={neon} readOnly={readOnly}
      errors={errors} errorPath="condicoes"
      description="Selecione Configurar para definir quando cada condição começa, o que faz e como termina. Texto descritivo nunca é executado." />
    {removalWarning && <p role="alert">{removalWarning}</p>}
    {pendingRemoval && <InlineChecks>
      <CyberButton theme={theme} neon={neon} colorType="secondary" width="fit-content"
        text="Manter condição" onClick={() => { setPendingRemoval(null); setRemovalWarning(''); }} />
      <CyberButton theme={theme} neon={neon} colorType="secondary" width="fit-content"
        text="Remover mesmo assim" onClick={() => {
          onConfirmedRemoval?.(rows.filter((row) => row.codigo !== pendingRemoval.codigo),
            pendingRemoval.codigo);
          setPendingRemoval(null);
          setRemovalWarning('');
        }} />
    </InlineChecks>}
    {selected && <SectionCard id="condition-rule-configuration" ref={configurationRef} tabIndex={-1}
      theme={theme} neon={neon}>
      <h4>Regra de {selected.nome || selected.codigo || 'nova condição'}</h4>
      <p>Sem gatilho automático, a condição precisa ser aplicada por uma origem, como um item, magia ou skill. Defina aqui o efeito estruturado; textos descritivos não alteram recursos.</p>
      {errors[`condicoes.${selectedIndex}.regra`] && <p role="alert">{errors[`condicoes.${selectedIndex}.regra`]}</p>}
      <h4>Quando começa</h4>
      <FieldGrid $columns={3}>
        <Select theme={theme} neon={neon} label="Recurso observado" value={selected.codigoRecursoGatilho ?? ''}
          options={withCurrent(triggerOptions, selected.codigoRecursoGatilho)} disabled={readOnly}
          onChange={(event) => update('codigoRecursoGatilho', event.target.value)} />
        <Select theme={theme} neon={neon} label="Comparação" value={selected.operadorGatilho ?? ''}
          options={[
            { value: '<=', label: 'Menor ou igual a' }, { value: '<', label: 'Menor que' },
            { value: '==', label: 'Igual a' }, { value: '>', label: 'Maior que' },
            { value: '>=', label: 'Maior ou igual a' },
          ]} disabled={readOnly} onChange={(event) => update('operadorGatilho', event.target.value)} />
        <InputText theme={theme} neon={neon} label="Valor do gatilho" type="number"
          value={selected.valorGatilho ?? ''} disabled={readOnly}
          error={Boolean(errors[`condicoes.${selectedIndex}.valorGatilho`])}
          errorMessage={errors[`condicoes.${selectedIndex}.valorGatilho`]}
          onChange={(event) => update('valorGatilho', event.target.value === '' ? null : Number(event.target.value))} />
      </FieldGrid>
      <h4>O que acontece</h4>
      <FieldGrid $columns={4}>
        <Select theme={theme} neon={neon} label="Efeito" value={selected.operacaoEfeito ?? ''}
          options={withCurrent(operationOptions, selected.operacaoEfeito)} disabled={readOnly}
          onChange={(event) => update('operacaoEfeito', event.target.value)} />
        <Select theme={theme} neon={neon} label="Recurso afetado" value={selected.codigoRecurso ?? ''}
          options={withCurrent(resourceOptions, selected.codigoRecurso)} disabled={readOnly}
          onChange={(event) => update('codigoRecurso', event.target.value)} />
        <InputText theme={theme} neon={neon} label="Valor do efeito" type="number"
          value={selected.valorEfeito ?? ''} disabled={readOnly}
          error={Boolean(errors[`condicoes.${selectedIndex}.valorEfeito`])}
          errorMessage={errors[`condicoes.${selectedIndex}.valorEfeito`]}
          onChange={(event) => update('valorEfeito', event.target.value === '' ? null : Number(event.target.value))} />
        <Select theme={theme} neon={neon} label="Quando aplicar" value={selected.momentoEfeito ?? ''}
          options={withCurrent(timeOptions, selected.momentoEfeito)} disabled={readOnly}
          onChange={(event) => update('momentoEfeito', event.target.value)} />
      </FieldGrid>
      <h4>Mais efeitos desta condição</h4>
      <p>Uma condição pode alterar vários recursos e testes ao mesmo tempo. Use valores negativos para penalidades e positivos para bônus de atributo ou rolagem. Recuperação de recurso usa valor positivo. Todos os efeitos terminam juntos.</p>
      {extraEffects.map((effect, index) => {
        const updateEffect = (changes: Partial<AdditionalConditionEffect>) => updateExtraEffects(
          extraEffects.map((entry, current) => current === index ? { ...entry, ...changes } : entry));
        const continuousEffect = effect.operacao === 'MODIFICAR_ROLAGEM' ||
          effect.operacao === 'MODIFICAR_ATRIBUTO' ||
          effect.operacao === 'MODIFICAR_DANO' || effect.operacao === 'MODIFICAR_DEFESA' ||
          effect.operacao === 'MODIFICAR_LIMITE_PERCENTUAL' ||
          effect.operacao === 'DESVANTAGEM' || effect.operacao === 'VANTAGEM';
        const resourceOptionsForEffect = effect.operacao === 'MODIFICAR_DANO'
          ? [{ value: 'TODOS', label: 'Todo dano causado' }]
          : effect.operacao === 'MODIFICAR_DEFESA'
            ? [{ value: 'ARMADURA', label: 'Armadura fixa' }]
            : effect.operacao === 'MODIFICAR_ATRIBUTO'
              ? references?.attributes ?? []
              : effect.operacao === 'MODIFICAR_ROLAGEM'
          ? [...(references?.attributes ?? []), { value: 'TODOS', label: 'Todos os testes' }]
          : effect.operacao === 'DESVANTAGEM' || effect.operacao === 'VANTAGEM'
            ? [{ value: 'TESTE', label: 'Teste' }]
            : effect.operacao === 'PERDER_TURNOS'
              ? [{ value: 'TURNO', label: 'Turno' }] : resourceOptions;
        return <FieldGrid $columns={5} key={`${index}-${effect.operacao}`}>
          <Select theme={theme} neon={neon} label={`Efeito ${index + 2}`}
            value={effect.operacao} options={extraOperationOptions} disabled={readOnly}
            onChange={(event) => updateEffect({ operacao: event.target.value,
              recurso: event.target.value === 'DESVANTAGEM' || event.target.value === 'VANTAGEM'
                ? 'TESTE' : event.target.value === 'MODIFICAR_DANO' ? 'TODOS'
                  : event.target.value === 'MODIFICAR_DEFESA' ? 'ARMADURA'
                  : event.target.value === 'PERDER_TURNOS' ? 'TURNO'
                  : event.target.value === 'MODIFICAR_ROLAGEM' || event.target.value === 'MODIFICAR_ATRIBUTO'
                  ? references?.attributes[0]?.value ?? 'TODOS'
                  : resourceOptions[0]?.value ?? 'VIDA',
              momento: event.target.value === 'PERDER_TURNOS' ? 'AO_APLICAR' : ['MODIFICAR_ROLAGEM', 'MODIFICAR_ATRIBUTO', 'MODIFICAR_DANO',
                'MODIFICAR_DEFESA', 'MODIFICAR_LIMITE_PERCENTUAL', 'DESVANTAGEM', 'VANTAGEM'].includes(event.target.value)
                ? 'ENQUANTO_ATIVA' : effect.momento })} />
          <Select theme={theme} neon={neon} label="Afeta" value={effect.recurso}
            options={withCurrent(resourceOptionsForEffect, effect.recurso)} disabled={readOnly ||
              effect.operacao === 'PERDER_TURNOS' ||
              effect.operacao === 'DESVANTAGEM' || effect.operacao === 'VANTAGEM'}
            onChange={(event) => updateEffect({ recurso: event.target.value })} />
          <InputText theme={theme} neon={neon} label={effect.operacao === 'PERDER_TURNOS' ? 'Turnos perdidos' : 'Valor'}
            type="number" value={effect.valor} min={effect.operacao === 'PERDER_TURNOS' ? 1 : undefined}
            max={effect.operacao === 'PERDER_TURNOS' ? 100 : undefined}
            disabled={readOnly || effect.operacao === 'DESVANTAGEM' || effect.operacao === 'VANTAGEM'}
            onChange={(event) => updateEffect({ valor: Number(event.target.value) })} />
          <Select theme={theme} neon={neon} label="Quando" value={effect.momento}
            options={timeOptions} disabled={readOnly || continuousEffect || effect.operacao === 'PERDER_TURNOS'}
            onChange={(event) => updateEffect({ momento: event.target.value })} />
          {!readOnly && <CyberButton theme={theme} neon={neon} colorType="secondary" width="100%"
            text="Remover efeito" onClick={() => updateExtraEffects(extraEffects.filter((_, current) => current !== index))} />}
        </FieldGrid>;
      })}
      {!readOnly && extraEffects.length < 8 && <CyberButton theme={theme} neon={neon}
        colorType="secondary" width="fit-content" text="Adicionar efeito"
        onClick={() => updateExtraEffects([...extraEffects,
          { operacao: 'SUBTRAIR', recurso: 'VIDA', valor: 1, momento: 'FIM_TURNO' }])} />}
      <h4>Quando termina</h4>
      <p>Marque as formas de recuperação. Magia exige uma magia da ficha que selecione esta condição e acerte seu teste. Ao retirar um traje, a opção de cessar o gatilho encerra a condição criada ao equipá-lo. A duração da origem termina sozinha; horas avançam somente pelo tempo de jogo dos eventos e descansos.</p>
      <InlineChecks>
        {removalOptions.filter((option) => option.value !== 'MANUAL').map((option) =>
          <CheckBox key={option.value} neon={neon} label={option.label}
            checked={removalCodes(selected.regraRemocao).includes(option.value)} disabled={readOnly}
            onChange={(checked) => {
              const codes = removalCodes(selected.regraRemocao).filter((code) => code !== 'MANUAL' && code !== option.value);
              if (checked) codes.push(option.value);
              update('regraRemocao', codes.length ? codes.join(';') : 'MANUAL');
            }} />)}
      </InlineChecks>
      <FieldGrid $columns={3}>
        <InputText theme={theme} neon={neon} label="Duração" type="number"
          value={selected.duracaoPadrao ?? ''} disabled={readOnly}
          error={Boolean(errors[`condicoes.${selectedIndex}.duracaoPadrao`])}
          errorMessage={errors[`condicoes.${selectedIndex}.duracaoPadrao`]}
          onChange={(event) => update('duracaoPadrao', event.target.value === '' ? null : Number(event.target.value))} />
        <Select theme={theme} neon={neon} label="Unidade" value={selected.unidadeDuracao}
          options={unitOptions} disabled={readOnly}
          onChange={(event) => update('unidadeDuracao', event.target.value as SistemaCondicao['unidadeDuracao'])} />
        <InputText theme={theme} neon={neon} label="Intervalo para reativar (turnos)" type="number"
          value={selected.cooldownTurnos ?? ''} disabled={readOnly}
          onChange={(event) => update('cooldownTurnos', event.target.value === '' ? null : Number(event.target.value))} />
      </FieldGrid>
      <InlineChecks>
        <CheckBox neon={neon} label="Acumula" checked={selected.empilhavel} disabled={readOnly}
          onChange={(checked) => update('empilhavel', checked)} />
        <CheckBox neon={neon} label="Reaplicação substitui a atual" checked={selected.permiteSobrescrever}
          disabled={readOnly} onChange={(checked) => update('permiteSobrescrever', checked)} />
      </InlineChecks>
      <FieldGrid $columns={2}>
        <InputText theme={theme} neon={neon} label="Intensidade padrão (opcional)" type="number"
          value={selected.valorPadrao ?? ''} disabled={readOnly}
          onChange={(event) => update('valorPadrao', event.target.value === '' ? null : Number(event.target.value))} />
      </FieldGrid>
      <p>A intensidade padrão substitui o valor do efeito ao aplicar a condição; deixe vazia para usar sempre o valor acima.</p>
    </SectionCard>}
  </>;
};
