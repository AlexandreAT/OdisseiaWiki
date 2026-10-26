import React from 'react';
import { describeSystemOptions } from '../../../../../../content/systemOptionHelp';
import { InputText } from '../../../../../../components/Generic/InputText/InputText';
import { Select } from '../../../../../../components/Generic/Select/Select';
import { CheckBox } from '../../../../../../components/Generic/CheckBox/CheckBox';
import { CheckSelect } from '../../../../../../components/Generic/CheckSelect/CheckSelect';
import { CyberButton } from '../../../../../../components/Generic/HighlightButton/HighlightButton';
import { AttributeRow, AttributeSubsection, AttributeSubsectionTitle, FormItemAtributos as ItemFieldsLayout, ProsthesisActions } from './FormCharacter.style';
import { WikiContentHelpProvider } from '../../../../../../components/Generic/FieldHelp/WikiContentHelpProvider';
import { FieldHelp } from '../../../../../../components/Generic/FieldHelp/FieldHelp';
import { getWikiContentHelp } from '../../../../../../content/wikiContentHelp';
import { ArmaAtributos, ArmaTipo, ArmaTipoDano, ImplanteAtributos, TrajeAtributos } from '../../../../../../models/Itens';
import { ACERTO_DADO_OPTIONS, ARMA_TIPO_DANO_OPTIONS, ARMA_TIPO_OPTIONS, getPrimeiroAtaqueComGastoEstamina, normalizeDadoAcerto, TRAJE_TIPO_OPTIONS } from '../../../../../../constants';
import { DadoAcerto } from '../../../../../../models/Dados';
import { catalogReferenceOptions, ItemFormOption, SistemaItemFormCatalog, normalizeSystemItemCode } from '../../../../../../utils/systemItemFormCatalog';
import { WeaponModifiers } from '../../../../../../components/WeaponModifiers/WeaponModifiers';
import { WeaponAccessories } from '../../../../../../components/WeaponAccessories/WeaponAccessories';
import { getWeaponModifierMode } from '../../../../../../utils/weaponModifiers';
import type { AcessorioAtributos, GameplayConditionEffectConfig } from '../../../../../../models/Itens';
import type { GameplayTestSpec } from '../../../../../../models/Gameplay';
import { editableConditionEffects } from '../../../../../../utils/conditionEffectOverrides';

const FormItemAtributos = ({ children, theme, neon }: {
  children: React.ReactNode; theme: 'dark' | 'light'; neon: 'on' | 'off';
}) => <WikiContentHelpProvider scope="equipment" theme={theme} neon={neon}>
  <ItemFieldsLayout>{children}</ItemFieldsLayout>
</WikiContentHelpProvider>;

interface BaseProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  value: any;
  onChange: (v: any) => void;
  managementLayout?: boolean;
  weaponFieldsOnly?: boolean;
  sistemaItemCatalogo?: SistemaItemFormCatalog;
}

const ManagementAttributeGroup = ({
  enabled,
  title,
  theme,
  neon,
  children,
}: {
  enabled: boolean;
  title: string;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  children: React.ReactNode;
}) => enabled ? (
  <AttributeSubsection theme={theme} neon={neon}>
    <AttributeSubsectionTitle theme={theme} neon={neon}>{title} <FieldHelp label={title} inline /></AttributeSubsectionTitle>
    {children}
  </AttributeSubsection>
) : <>{children}</>;

const AcertoDadoSelect = ({
  value,
  onChange,
  theme,
  neon,
}: {
  value: unknown;
  onChange: (value: DadoAcerto) => void;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}) => (
  <Select
    label="Acerto"
    theme={theme}
    neon={neon}
    value={normalizeDadoAcerto(value)}
    onChange={(event) => onChange(event.target.value as DadoAcerto)}
    options={ACERTO_DADO_OPTIONS}
    width="100%"
  />
);

const withNormalizedAcerto = (value: any, defaults: Record<string, unknown>) => ({
  ...defaults,
  ...(value ?? {}),
  acerto: normalizeDadoAcerto(value?.acerto) || undefined,
});

/**
 * Declarative rule only: the selected code is resolved against the published
 * System table by the backend when the character uses the item or power.
 */
export const TestSpecificationFields = ({
  value,
  onChange,
  theme,
  neon,
  weapon = false,
  testOptions = [],
  attributeOptions = [],
}: {
  value: GameplayTestSpec | undefined;
  onChange: (value: GameplayTestSpec | undefined) => void;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  weapon?: boolean;
  testOptions?: ItemFormOption[];
  attributeOptions?: ItemFormOption[];
}) => {
  const enabled = Boolean(value);
  const defaultTestCode = testOptions[0]?.value ?? (weapon ? 'ATAQUE_COMUM' : '');
  const availableTestOptions = value?.codigoTeste && !testOptions.some((option) => option.value === value.codigoTeste)
    ? [...testOptions, { value: value.codigoTeste, label: `${value.codigoTeste} (configuração existente)` }]
    : testOptions;
  const configuredOperations = (value?.operacoes ?? []).map((operation) => String(operation).toUpperCase());
  const configuredRanges = (value?.alcances ?? []).map((range) => String(range).toUpperCase());
  const configuredFireModes = (value?.modosDisparo ?? []).map((mode) => String(mode).toUpperCase());
  const update = (changes: Partial<GameplayTestSpec>) => onChange({
    codigoTeste: value?.codigoTeste ?? defaultTestCode,
    usaTotalParaFaixas: value?.usaTotalParaFaixas ?? true,
    ...value,
    ...changes,
  });
  const toggleOperation = (operation: 'ATACAR' | 'DEFENDER' | 'REVIDAR', checked: boolean) => {
    const next = checked
      ? [...new Set([...configuredOperations, operation])]
      : configuredOperations.filter((current) => current !== operation);
    update({ operacoes: next.length > 0 ? next : undefined });
  };
  const toggleChoice = (
    key: 'alcances' | 'modosDisparo',
    current: string[],
    choice: string,
    checked: boolean,
  ) => {
    const next = checked
      ? [...new Set([...current, choice])]
      : current.filter((entry) => entry !== choice);
    update({ [key]: next.length > 0 ? next : undefined });
  };

  return (
    <WikiContentHelpProvider scope="test" theme={theme} neon={neon}>
    <AttributeSubsection theme={theme} neon={neon}>
      <AttributeSubsectionTitle theme={theme} neon={neon}>Teste na engine <FieldHelp label="Teste na engine" inline /></AttributeSubsectionTitle>
      <CheckBox
        neon={neon}
        label={weapon ? 'Usar especificação de teste desta arma' : 'Esta ação exige teste'}
        checked={enabled}
        onChange={(checked) => onChange(checked ? {
          codigoTeste: defaultTestCode,
          usaTotalParaFaixas: true,
        } : undefined)}
      />
      {enabled && (
        <>
          <AttributeRow $columns={2}>
            {availableTestOptions.length > 0 ? (
              <Select
                label="Teste publicado"
                theme={theme}
                neon={neon}
                value={value?.codigoTeste ?? defaultTestCode}
                options={availableTestOptions}
                onChange={(event) => update({ codigoTeste: event.target.value })}
                width="100%"
              />
            ) : (
              <InputText label="Código do teste" theme={theme} neon={neon} value={value?.codigoTeste ?? ''} onChange={(event) => update({ codigoTeste: event.target.value })} />
            )}
            {attributeOptions.length > 0 ? <Select label="Atributo (opcional)" theme={theme} neon={neon}
              value={value?.codigoAtributo ?? ''} allowEmptyOption width="100%" options={attributeOptions}
              onChange={event => update({ codigoAtributo: event.target.value || undefined })} />
              : <InputText label="Atributo (opcional)" theme={theme} neon={neon} value={value?.codigoAtributo ?? ''} onChange={(event) => update({ codigoAtributo: event.target.value || undefined })} />}
          </AttributeRow>
          <AttributeRow $columns={2}>
            <Select label="Modo fixo" theme={theme} neon={neon} value={value?.modo ?? ''} allowEmptyOption options={[
              { value: '', label: 'Escolhido na rolagem' },
              { value: 'Normal', label: 'Normal' },
              { value: 'Vantagem', label: 'Vantagem' },
              { value: 'Desvantagem', label: 'Desvantagem' },
            ]} onChange={(event) => update({ modo: event.target.value as GameplayTestSpec['modo'] || undefined })} width="100%" />
            <Select label="Grupo do atributo" theme={theme} neon={neon} value={value?.grupoAtributo ?? ''} allowEmptyOption options={[
              { value: '', label: 'Detectar na ficha' },
              { value: 'Principal', label: 'Principal' },
              { value: 'Secundario', label: 'Secundário' },
            ]} onChange={(event) => update({ grupoAtributo: event.target.value || undefined })} width="100%" />
          </AttributeRow>
          <CheckBox neon={neon} label="Usar o total nas faixas de resultado" checked={value?.usaTotalParaFaixas !== false} onChange={(usaTotalParaFaixas) => update({ usaTotalParaFaixas })} />
          {weapon && (
            <>
              <p>Operações permitidas: sem seleção, a engine usa o padrão da arma; marque para limitar ou habilitar a defesa.</p>
              <AttributeRow $columns={3}>
                <CheckBox neon={neon} label="Atacar" checked={configuredOperations.includes('ATACAR')} onChange={(checked) => toggleOperation('ATACAR', checked)} />
                <CheckBox neon={neon} label="Defender" checked={configuredOperations.includes('DEFENDER')} onChange={(checked) => toggleOperation('DEFENDER', checked)} />
                <CheckBox neon={neon} label="Revidar" checked={configuredOperations.includes('REVIDAR')} onChange={(checked) => toggleOperation('REVIDAR', checked)} />
              </AttributeRow>
              <p>Faixas permitidas: sem seleção, a engine usa as faixas compatíveis com o tipo da arma.</p>
              <AttributeRow $columns={3}>
                <CheckBox neon={neon} label="Curta distância" checked={configuredRanges.includes('CURTA')} onChange={(checked) => toggleChoice('alcances', configuredRanges, 'CURTA', checked)} />
                <CheckBox neon={neon} label="Média distância" checked={configuredRanges.includes('MEDIA')} onChange={(checked) => toggleChoice('alcances', configuredRanges, 'MEDIA', checked)} />
                <CheckBox neon={neon} label="Longa distância" checked={configuredRanges.includes('LONGA')} onChange={(checked) => toggleChoice('alcances', configuredRanges, 'LONGA', checked)} />
              </AttributeRow>
              <p>Modos de disparo: sem seleção, a engine usa os modos compatíveis com a arma.</p>
              <AttributeRow $columns={2}>
                <CheckBox neon={neon} label="Tiro" checked={configuredFireModes.includes('TIRO')} onChange={(checked) => toggleChoice('modosDisparo', configuredFireModes, 'TIRO', checked)} />
                <CheckBox neon={neon} label="Rajada" checked={configuredFireModes.includes('RAJADA')} onChange={(checked) => toggleChoice('modosDisparo', configuredFireModes, 'RAJADA', checked)} />
              </AttributeRow>
            </>
          )}
        </>
      )}
    </AttributeSubsection>
    </WikiContentHelpProvider>
  );
};

export const ConditionEffectFields = ({
  value = [],
  onChange,
  theme,
  neon,
  options: catalogOptions,
  resultOptions: resultCatalogOptions,
  allowEquipTrigger = false,
  useOnly = false,
}: {
  value?: GameplayConditionEffectConfig[];
  onChange: (value: GameplayConditionEffectConfig[]) => void;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  options?: ItemFormOption[];
  resultOptions?: ItemFormOption[];
  allowEquipTrigger?: boolean;
  useOnly?: boolean;
}) => {
  const [expanded, setExpanded] = React.useState(value.length > 0);
  const options = catalogOptions ?? [];
  const catalogAvailable = catalogOptions !== undefined;
  const resultOptions = resultCatalogOptions ?? [];
  const resultCatalogAvailable = resultCatalogOptions !== undefined;
  const findCondition = (code: string) => options.find(option =>
    normalizeSystemItemCode(option.value) === normalizeSystemItemCode(code));
  const findResult = (code?: string) => code ? resultOptions.find(option =>
    normalizeSystemItemCode(option.value) === normalizeSystemItemCode(code)) : undefined;
  const [naturalInputs, setNaturalInputs] = React.useState<Record<number, string>>({});
  const update = (index: number, changes: Partial<GameplayConditionEffectConfig>) => onChange(
    value.map((condition, currentIndex) => currentIndex === index ? { ...condition, ...changes } : condition),
  );
  const available = options.filter((option) => !value.some((condition) =>
    normalizeSystemItemCode(condition.codigo) === normalizeSystemItemCode(option.value)));
  const addCondition = () => {
    if (!available.length) return;
    onChange([...value, { codigo: available[0].value,
      gatilho: useOnly ? 'AO_USAR' : allowEquipTrigger ? 'AO_EQUIPAR' : 'ACERTO',
      alvo: useOnly ? 'USUARIO' : 'ALVO', unidadeDuracao: 'Turno' }]);
    setExpanded(true);
  };
  return (
    <WikiContentHelpProvider scope="condition" theme={theme} neon={neon}>
    <AttributeSubsection theme={theme} neon={neon}>
      <CyberButton theme={theme} neon={neon} colorType="secondary" width="fit-content"
        text={expanded ? 'Ocultar condições' : value.length ? `Mostrar condições · ${value.length}` : 'Adicionar condição'}
        onClick={() => {
          if (!expanded && value.length === 0) addCondition();
          setExpanded(!expanded);
        }} />
      {expanded && <>
      <AttributeSubsectionTitle theme={theme} neon={neon}>Condições aplicadas <FieldHelp label="Condições aplicadas" inline /></AttributeSubsectionTitle>
      {!catalogAvailable && <p role="status">As condições do Sistema ainda não foram carregadas.</p>}
      {catalogAvailable && options.length === 0 && <p>Este Sistema não tem condições configuradas.</p>}
      {value.map((condition, index) => (
        <React.Fragment key={`${condition.codigo}-${index}`}>
        <AttributeRow $columns={4}>
          <Select
            label="Condição"
            theme={theme}
            neon={neon}
            value={findCondition(condition.codigo)?.value ?? condition.codigo}
            disabled={!catalogAvailable}
            options={condition.codigo && !findCondition(condition.codigo)
              ? [{ value: condition.codigo, label: catalogAvailable ? `${condition.codigo} (não existe nesta versão)` : condition.codigo }, ...options]
              : options}
            onChange={(event) => update(index, { codigo: event.target.value,
              valor: undefined, valoresEfeitos: {}, testeResistencia: undefined })}
            width="100%"
          />
          {(condition.valor !== undefined ||
            editableConditionEffects(findCondition(condition.codigo)?.rule).length === 0) &&
            <InputText label="Valor do primeiro efeito (opcional)" type="number" theme={theme} neon={neon}
              value={condition.valor ?? ''} onChange={(event) => update(index, {
                valor: event.target.value === '' ? undefined : Number(event.target.value),
              })} />}
          <InputText label="Duração (opcional)" type="number" theme={theme} neon={neon} value={condition.duracao ?? ''} onChange={(event) => update(index, { duracao: event.target.value === '' ? undefined : Number(event.target.value) })} />
          <CyberButton theme={theme} neon={neon} colorType="secondary" width="100%" text="Remover" onClick={() => onChange(value.filter((_, currentIndex) => currentIndex !== index))} />
        </AttributeRow>
        {catalogAvailable && condition.codigo && !findCondition(condition.codigo) &&
          <p role="alert">Esta condição não existe no Sistema atual. Escolha outra antes de usar este conteúdo.</p>}
        {editableConditionEffects(findCondition(condition.codigo)?.rule)
          .map((effect) => <InputText key={effect.index} type="number" theme={theme} neon={neon}
            label={`${effect.label} (padrão ${effect.value}${effect.percentage ? '%' : ''})`}
            help={getWikiContentHelp('condition', 'value')}
            min={effect.minimum ?? (effect.signed ? effect.percentage ? -100 : -1000000 : 0)}
            max={effect.maximum ?? (effect.percentage ? effect.signed ? 1000 : 100 : 1000000)}
            value={condition.valoresEfeitos?.[effect.index] ?? ''}
            onChange={(event) => {
              const next = { ...condition.valoresEfeitos };
              if (event.target.value === '') delete next[effect.index];
              else next[effect.index] = Number(event.target.value);
              update(index, { valoresEfeitos: next });
            }} />)}
        <AttributeRow $columns={3}>
          <Select label="Quando aplicar" theme={theme} neon={neon}
            value={condition.gatilho ?? 'ACERTO'}
            options={describeSystemOptions('conditionTrigger', [
              ...(!useOnly ? [{ value: 'ACERTO', label: 'Em qualquer acerto' },
                { value: 'RESULTADO_NATURAL', label: 'Ao tirar números no dado' },
                { value: 'RESULTADO_CLASSIFICADO', label: 'Resultado classificado pelo Sistema' }] : []),
              { value: 'AO_USAR', label: useOnly ? 'Ao consumir' : 'Ao usar a ação' },
              ...(allowEquipTrigger ? [{ value: 'AO_EQUIPAR', label: 'Ao equipar traje ou item defensivo' }] : []),
              ...(useOnly && condition.gatilho !== 'AO_USAR'
                ? [{ value: condition.gatilho ?? 'ACERTO',
                  label: `${condition.gatilho ?? 'ACERTO'} (não executa ao consumir)` }] : []),
            ])}
            onChange={(event) => update(index, { gatilho: event.target.value as GameplayConditionEffectConfig['gatilho'] })} />
          {condition.gatilho === 'RESULTADO_NATURAL' &&
            <InputText label="Números naturais (ex.: 18, 19, 20)" theme={theme} neon={neon}
              value={naturalInputs[index] ?? (condition.resultadosNaturais ?? []).join(', ')}
              onChange={(event) => {
                const raw = event.target.value;
                setNaturalInputs((current) => ({ ...current, [index]: raw }));
                update(index, { resultadosNaturais: raw.split(',')
                  .map((part) => Number(part.trim())).filter((number) => Number.isInteger(number) && number > 0 && number <= 20) });
              }} />}
          <Select label="Duração em" theme={theme} neon={neon}
            value={condition.unidadeDuracao ?? 'Turno'}
            options={describeSystemOptions('durationUnit', [{ value: 'Turno', label: 'Turnos' }, { value: 'Hora', label: 'Horas de jogo (eventos/descansos)' }])}
            onChange={(event) => update(index, { unidadeDuracao: event.target.value as GameplayConditionEffectConfig['unidadeDuracao'] })} />
        </AttributeRow>
        <AttributeRow $columns={2}>
          <Select label="Quem recebe a condição" theme={theme} neon={neon}
            value={condition.alvo ?? (useOnly ? 'USUARIO' : 'ALVO')}
            options={describeSystemOptions('conditionTarget', [{ value: 'ALVO', label: 'Alvo da ação' },
              { value: 'USUARIO', label: 'Quem usa o item ou poder' },
              { value: 'TODOS_INIMIGOS', label: 'Todos os inimigos' }])}
            onChange={(event) => update(index, { alvo: event.target.value as GameplayConditionEffectConfig['alvo'] })} />
        </AttributeRow>
        <CyberButton theme={theme} neon={neon} colorType="secondary" width="fit-content"
          text={condition.testeResistencia ? 'Remover teste de reação' : 'Exigir teste de reação'}
          onClick={() => update(index, { testeResistencia: condition.testeResistencia ? undefined : {
            dados: 1, faces: 6,
            atributo: findCondition(condition.codigo)?.attributeOptions?.[0]?.value ?? '',
            dificuldade: 4,
          } })} />
        {condition.testeResistencia && <>
          <p>Cada afetado testa fora do turno. Se alcançar a dificuldade, evita esta condição; a ordem normal continua depois.</p>
          <AttributeRow $columns={4}>
            <InputText label="Quantidade de dados" type="number" min={1} max={10} theme={theme} neon={neon}
              value={condition.testeResistencia.dados} onChange={(event) => update(index, {
                testeResistencia: { ...condition.testeResistencia!, dados: Number(event.target.value) },
              })} />
            <InputText label="Faces do dado" type="number" min={2} max={1000} theme={theme} neon={neon}
              value={condition.testeResistencia.faces} onChange={(event) => update(index, {
                testeResistencia: { ...condition.testeResistencia!, faces: Number(event.target.value) },
              })} />
            <Select label="Atributo do afetado" theme={theme} neon={neon}
              value={condition.testeResistencia.atributo}
              options={findCondition(condition.codigo)?.attributeOptions ?? []}
              onChange={(event) => update(index, {
                testeResistencia: { ...condition.testeResistencia!, atributo: event.target.value },
              })} />
            <InputText label="Passa com total ≥" type="number" theme={theme} neon={neon}
              value={condition.testeResistencia.dificuldade} onChange={(event) => update(index, {
                testeResistencia: { ...condition.testeResistencia!, dificuldade: Number(event.target.value) },
              })} />
          </AttributeRow>
        </>}
        {condition.gatilho === 'RESULTADO_NATURAL' && <AttributeRow $columns={2}>
          <InputText label="Do resultado natural (inclusive)" type="number" theme={theme} neon={neon}
            value={condition.resultadoNaturalMinimo ?? ''}
            onChange={(event) => update(index, { resultadoNaturalMinimo: event.target.value === ''
              ? undefined : Number(event.target.value) })} />
          <InputText label="Até o resultado natural (inclusive)" type="number" theme={theme} neon={neon}
            value={condition.resultadoNaturalMaximo ?? ''}
            onChange={(event) => update(index, { resultadoNaturalMaximo: event.target.value === ''
              ? undefined : Number(event.target.value) })} />
        </AttributeRow>}
        {condition.gatilho === 'RESULTADO_CLASSIFICADO' && <Select
          label="Qual resultado do Sistema?" theme={theme} neon={neon}
          value={findResult(condition.codigoResultado)?.value ?? condition.codigoResultado ?? ''}
          disabled={!resultCatalogAvailable}
          options={[{ value: '', label: 'Selecione um resultado' },
            ...(condition.codigoResultado && !findResult(condition.codigoResultado)
              ? [{ value: condition.codigoResultado, label: resultCatalogAvailable ? `${condition.codigoResultado} (não existe nesta versão)` : condition.codigoResultado }]
              : []), ...resultOptions]}
          onChange={(event) => update(index, { codigoResultado: event.target.value })} />}
        {resultCatalogAvailable && condition.gatilho === 'RESULTADO_CLASSIFICADO' && condition.codigoResultado &&
          !findResult(condition.codigoResultado) &&
          <p role="alert">Este resultado não existe no Sistema atual. Escolha outro antes de usar a condição.</p>}
        </React.Fragment>
      ))}
      {available.length > 0 && (
        <CyberButton
          theme={theme}
          neon={neon}
          colorType="primary"
          width="fit-content"
          text={value.length ? 'Adicionar outra condição' : 'Adicionar condição'}
          onClick={addCondition}
        />
      )}
      </>}
    </AttributeSubsection>
    </WikiContentHelpProvider>
  );
};

export const ArmaAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon, managementLayout = false, sistemaItemCatalogo, weaponFieldsOnly = false }) => {
  const initialValue = (value ?? {}) as ArmaAtributos;
  const local: ArmaAtributos = {
    ...initialValue,
    danoPorAlcance: initialValue.danoPorAlcance ?? {},
    cadencia: initialValue.cadencia ?? initialValue.ataquesPorTurno ?? 1,
    capacidadeUso: initialValue.capacidadeUso ?? 0,
    capacidadeMunicao: initialValue.capacidadeMunicao ?? initialValue.municao?.capacidade ?? 0,
    controlaMunicao: initialValue.controlaMunicao ?? false,
    municaoAtual: initialValue.municaoAtual ?? initialValue.municao?.atual ?? initialValue.capacidadeMunicao ?? initialValue.municao?.capacidade ?? 0,
    custoMunicaoTiro: initialValue.custoMunicaoTiro ?? 1,
    custoMunicaoRajada: initialValue.custoMunicaoRajada ?? 0,
    gastoEstaminaPorAtaque: initialValue.gastoEstaminaPorAtaque ?? 0,
    bonus: initialValue.bonus ?? [],
    especial: initialValue.especial ?? '',
    acerto: normalizeDadoAcerto(initialValue.acerto) || undefined,
    duracaoEfeito: initialValue.duracaoEfeito ?? '',
  };

  const handleChange = <Key extends keyof ArmaAtributos>(key: Key, val: ArmaAtributos[Key]) => {
    const updated: ArmaAtributos = { ...local, [key]: val };

    if (key === 'cadencia') {
      updated.ataquesPorTurno = val as number | undefined;
    }

    if (key === 'capacidadeMunicao') {
      const capacity = Number(val) || 0;
      updated.municaoAtual = Math.min(local.municaoAtual ?? capacity, capacity);
      updated.municao = {
        capacidade: capacity,
        atual: updated.municaoAtual,
      };
    }

    if (key === 'municaoAtual') {
      updated.municao = {
        capacidade: local.capacidadeMunicao ?? local.municao?.capacidade ?? 0,
        atual: Number(val) || 0,
      };
    }

    if (key === 'tipoArma') {
      (updated as ArmaAtributos & { codigoArquetipo?: string }).codigoArquetipo = String(val ?? '').toUpperCase();
    }

    onChange(updated);
  };

  return (
    <FormItemAtributos theme={theme} neon={neon}>
      <ManagementAttributeGroup enabled={managementLayout} title="Classificação" theme={theme} neon={neon}>
        <AttributeRow $columns={2}>
          <Select label={weaponFieldsOnly ? 'Tipo de ataque' : 'Tipo de arma'} theme={theme} neon={neon} value={local.tipoArma ?? ''} onChange={e => handleChange('tipoArma', e.target.value as ArmaTipo)} options={sistemaItemCatalogo?.archetypeOptions.length ? sistemaItemCatalogo.archetypeOptions : ARMA_TIPO_OPTIONS} width="100%" />
          <Select label="Tipo de dano" theme={theme} neon={neon} value={local.tipoDano ?? ''} onChange={e => handleChange('tipoDano', e.target.value as ArmaTipoDano)} options={catalogReferenceOptions(sistemaItemCatalogo, 'TipoDano', ARMA_TIPO_DANO_OPTIONS)} width="100%" />
        </AttributeRow>
      </ManagementAttributeGroup>

      <ManagementAttributeGroup enabled={managementLayout} title="Dano" theme={theme} neon={neon}>
        <AttributeRow $columns={4}>
          <InputText label={weaponFieldsOnly ? 'Dano corpo a corpo' : 'Dano Base'} type="number" theme={theme} neon={neon} value={local.danoBase ?? ''} onChange={e => handleChange('danoBase', e.target.value === '' ? undefined : Number(e.target.value))} />
          <InputText label="Dano Curto" type="number" theme={theme} neon={neon} value={local.danoPorAlcance?.curta ?? ''} onChange={e => handleChange('danoPorAlcance', { ...local.danoPorAlcance, curta: Number(e.target.value) })} />
          <InputText label="Dano Médio" type="number" theme={theme} neon={neon} value={local.danoPorAlcance?.media ?? ''} onChange={e => handleChange('danoPorAlcance', { ...local.danoPorAlcance, media: Number(e.target.value) })} />
          <InputText label="Dano Longo" type="number" theme={theme} neon={neon} value={local.danoPorAlcance?.longa ?? ''} onChange={e => handleChange('danoPorAlcance', { ...local.danoPorAlcance, longa: Number(e.target.value) })} />
        </AttributeRow>
        <AttributeRow $columns={2}>
          <InputText label="Dano em Área" type="number" theme={theme} neon={neon} value={local.danoPorAlcance?.emArea ?? ''} onChange={e => handleChange('danoPorAlcance', { ...local.danoPorAlcance, emArea: Number(e.target.value) })} />
          <InputText label="Dano Preciso" type="number" theme={theme} neon={neon} value={local.danoPorAlcance?.preciso ?? ''} onChange={e => handleChange('danoPorAlcance', { ...local.danoPorAlcance, preciso: Number(e.target.value) })} />
        </AttributeRow>
      </ManagementAttributeGroup>

      <ManagementAttributeGroup enabled={managementLayout} title="Uso e combate" theme={theme} neon={neon}>
        <AttributeRow $columns={3}>
          <InputText label="Cadência por turno" type="number" theme={theme} neon={neon} value={local.cadencia ?? ''} onChange={e => handleChange('cadencia', e.target.value === '' ? undefined : Number(e.target.value))} />
          <InputText label="Usos até a pausa" type="number" theme={theme} neon={neon} value={local.capacidadeUso ?? ''} onChange={e => handleChange('capacidadeUso', e.target.value === '' ? undefined : Number(e.target.value))} />
          <InputText label="Capacidade de munição" type="number" theme={theme} neon={neon} value={local.capacidadeMunicao ?? ''} onChange={e => handleChange('capacidadeMunicao', e.target.value === '' ? undefined : Number(e.target.value))} />
        </AttributeRow>
        <AttributeRow $columns={3}>
          <InputText label="Limite de ataques por turno (0 = livre)" type="number" theme={theme} neon={neon} value={local.limiteAtaquesPorTurno ?? ''} onChange={e => handleChange('limiteAtaquesPorTurno', e.target.value === '' ? undefined : Number(e.target.value))} />
          <InputText label="Limite de tiros por turno (0 = livre)" type="number" theme={theme} neon={neon} value={local.limiteTirosPorTurno ?? ''} onChange={e => handleChange('limiteTirosPorTurno', e.target.value === '' ? undefined : Number(e.target.value))} />
          <InputText label="Limite de rajadas por turno (0 = livre)" type="number" theme={theme} neon={neon} value={local.limiteRajadasPorTurno ?? ''} onChange={e => handleChange('limiteRajadasPorTurno', e.target.value === '' ? undefined : Number(e.target.value))} />
        </AttributeRow>
        <AttributeRow $columns={2}>
          <InputText label={`Estamina por ação${getPrimeiroAtaqueComGastoEstamina(local.tipoArma) === 2 ? ' (2ª+)' : ''}`} type="number" theme={theme} neon={neon} value={local.gastoEstaminaPorAtaque ?? ''} onChange={e => handleChange('gastoEstaminaPorAtaque', e.target.value === '' ? undefined : Number(e.target.value))} />
          {!weaponFieldsOnly && <Select label="Acerto" theme={theme} neon={neon} value={normalizeDadoAcerto(local.acerto)} onChange={e => handleChange('acerto', e.target.value as DadoAcerto)} options={catalogReferenceOptions(sistemaItemCatalogo, 'Outro', ACERTO_DADO_OPTIONS).filter((option) => /^d\d+$/i.test(option.value)).map((option) => ({ ...option, value: option.value.toUpperCase() }))} width="100%" />}
        </AttributeRow>
        <CheckBox
          neon={neon}
          label="Controlar munição pela engine"
          checked={Boolean(local.controlaMunicao)}
          onChange={(controlaMunicao) => handleChange('controlaMunicao', controlaMunicao)}
        />
        {local.controlaMunicao && (
          <AttributeRow $columns={3}>
            <InputText label="Munição atual" type="number" theme={theme} neon={neon} value={local.municaoAtual ?? ''} onChange={e => handleChange('municaoAtual', e.target.value === '' ? undefined : Number(e.target.value))} />
            <InputText label="Munição por tiro" type="number" theme={theme} neon={neon} value={local.custoMunicaoTiro ?? ''} onChange={e => handleChange('custoMunicaoTiro', e.target.value === '' ? undefined : Number(e.target.value))} />
            <InputText label="Munição por rajada" type="number" theme={theme} neon={neon} value={local.custoMunicaoRajada ?? ''} onChange={e => handleChange('custoMunicaoRajada', e.target.value === '' ? undefined : Number(e.target.value))} />
          </AttributeRow>
        )}
      </ManagementAttributeGroup>

      <Select label="Modificadores de combate" theme={theme} neon={neon} width="100%"
        allowEmptyOption={false}
        value={local.modoModificadores ?? ''}
        options={[{ value: '', label: 'Automático pelo tipo de arma' }, { value: 'distancia', label: 'À distância' }, { value: 'corpo_a_corpo', label: 'Corpo a corpo' }]}
        onChange={(event) => handleChange('modoModificadores', (event.target.value || null) as ArmaAtributos['modoModificadores'])} />
      {!getWeaponModifierMode(local) && <p>Selecione o tipo de arma ou o modo de combate para aplicar os modificadores de distância, ataque e revide.</p>}
      <WeaponModifiers value={local.modificadores} onChange={(modifiers) => handleChange('modificadores', modifiers)} mode={getWeaponModifierMode(local)} theme={theme} neon={neon} />
      {!weaponFieldsOnly && <>
      <CheckBox
        neon={neon}
        label="Esta arma aplica teste"
        checked={local.aplicaTeste !== false}
        onChange={(aplicaTeste) => handleChange('aplicaTeste', aplicaTeste)}
      />
      {local.aplicaTeste !== false && (
        <TestSpecificationFields value={local.teste} onChange={(teste) => handleChange('teste', teste)} theme={theme} neon={neon} weapon testOptions={sistemaItemCatalogo?.testOptions} />
      )}
      <ConditionEffectFields
        value={local.condicoes}
        onChange={(condicoes) => handleChange('condicoes', condicoes)}
        theme={theme}
        neon={neon}
        options={sistemaItemCatalogo?.conditionOptions} resultOptions={sistemaItemCatalogo?.resultOptions}
      />

      <ManagementAttributeGroup enabled={managementLayout} title="Efeitos e propriedades" theme={theme} neon={neon}>
        <AttributeRow>
          <InputText label="Duração do efeito" theme={theme} neon={neon} value={local.duracaoEfeito || ""} onChange={e => handleChange('duracaoEfeito', e.target.value)} />
        </AttributeRow>
        <AttributeRow>
          <InputText label="Especial" theme={theme} neon={neon} value={local.especial || ""} onChange={e => handleChange('especial', e.target.value)} />
        </AttributeRow>
        <AttributeRow>
          <InputText label="Efeito" theme={theme} neon={neon} value={local.efeito || ""} onChange={e => handleChange('efeito', e.target.value)} />
        </AttributeRow>
      </ManagementAttributeGroup>
      <WeaponAccessories value={local} onChange={onChange} theme={theme} neon={neon} />
      </>}
    </FormItemAtributos>
  );
};

export const TrajeAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon, sistemaItemCatalogo }) => {
  const [local, setLocal] = React.useState<TrajeAtributos>(
    value || { tipoTraje: undefined, armaduraBase: 0, protecaoBase: 0, escudoBase: 0, resistencias: [], penalidades: [], especial: "" }
  );

  const handleChange = (key: string, val: any) => {
    const updated = {
      ...local,
      [key]: val,
      ...(key === 'tipoTraje' ? { codigoArquetipo: String(val ?? '').toUpperCase() } : {}),
      ...(key === 'teste' ? { aplicaTeste: Boolean(val) } : {}),
    };
    setLocal(updated);
    onChange(updated);
  };

  return (
    <FormItemAtributos theme={theme} neon={neon}>
      <AttributeRow>
        <Select
          label="Subcategoria de proteção"
          value={local.tipoTraje ?? ''}
          onChange={(e) => handleChange('tipoTraje', e.target.value || undefined)}
          theme={theme}
          neon={neon}
          options={sistemaItemCatalogo?.archetypeOptions.length ? sistemaItemCatalogo.archetypeOptions : TRAJE_TIPO_OPTIONS}
          width="100%"
        />
      </AttributeRow>
      <AttributeRow $columns={3}>
        <InputText label="Proteção Base" type="number" theme={theme} neon={neon} value={local.protecaoBase} onChange={e => handleChange('protecaoBase', Number(e.target.value))} />
        <InputText label="Escudo Base" type="number" theme={theme} neon={neon} value={local.escudoBase} onChange={e => handleChange('escudoBase', Number(e.target.value))} />
        <InputText label="Armadura Base" type="number" theme={theme} neon={neon} value={local.armaduraBase} onChange={e => handleChange('armaduraBase', Number(e.target.value))} />
      </AttributeRow>
      <AttributeRow>
        <InputText label="Especial" theme={theme} neon={neon} value={local.especial} onChange={e => handleChange('especial', e.target.value)} />
      </AttributeRow>
      <AttributeRow>
        <InputText label="Efeito" theme={theme} neon={neon} value={local.efeito ?? ''} onChange={e => handleChange('efeito', e.target.value)} />
      </AttributeRow>
      <TestSpecificationFields value={local.teste} onChange={(teste) => handleChange('teste', teste)} theme={theme} neon={neon} testOptions={sistemaItemCatalogo?.testOptions} />
      <ConditionEffectFields
        value={local.condicoes}
        onChange={(condicoes) => handleChange('condicoes', condicoes)}
        theme={theme}
        neon={neon}
        options={sistemaItemCatalogo?.conditionOptions} resultOptions={sistemaItemCatalogo?.resultOptions}
        allowEquipTrigger
      />
    </FormItemAtributos>
  );
};

const IMPLANTE_STATUS_BONUS_FIELDS = [
  ['vida', 'Vida'], ['mana', 'Mana'], ['estamina', 'Estamina'],
] as const;

const IMPLANTE_ATTRIBUTE_BONUS_FIELDS = [
  ['forca', 'Força'], ['agilidade', 'Agilidade'], ['precisao', 'Precisão'], ['sabedoria', 'Sabedoria'],
] as const;

const emptyImplante = (value: ImplanteAtributos | undefined): ImplanteAtributos => ({
  modelo: '', slotsModificacao: 0, slotsLacrima: 0, necessitaAmputacao: false,
  bonus: {}, especiais: [], modificacoes: [], lacrimas: [], ...value,
});

export const ImplanteAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon, managementLayout = false, sistemaItemCatalogo }) => {
  const atributos = emptyImplante(value as ImplanteAtributos | undefined);
  const update = (partial: Partial<ImplanteAtributos>) => onChange({ ...atributos, ...partial });
  const updateList = (key: 'especiais', index: number, text: string) => {
    const items = [...(atributos[key] ?? [])];
    items[index] = text;
    update({ [key]: items });
  };
  const updateDetails = (key: 'modificacoes' | 'lacrimas', index: number, field: 'nome' | 'descricao', text: string) => {
    const items = [...(atributos[key] ?? [])];
    items[index] = { ...items[index], [field]: text };
    update({ [key]: items });
  };

  const placementFields = <AttributeRow $columns={2}>
    <Select theme={theme} neon={neon} label="Parte do corpo" value={atributos.parteCorpo ?? ''} onChange={(e) => update({ parteCorpo: e.target.value as ImplanteAtributos['parteCorpo'], codigoArquetipo: e.target.value.toUpperCase() } as Partial<ImplanteAtributos>)} options={sistemaItemCatalogo?.archetypeOptions.length ? sistemaItemCatalogo.archetypeOptions : [{ label: 'Mão', value: 'mao' }, { label: 'Braço', value: 'braco' }, { label: 'Pé', value: 'pe' }, { label: 'Perna', value: 'perna' }, { label: 'Corpo', value: 'corpo' }, { label: 'Ocular', value: 'ocular' }, { label: 'Outro', value: 'outro' }]} width="100%" />
    <Select theme={theme} neon={neon} label="Lado" value={atributos.lado ?? ''} onChange={(e) => update({ lado: e.target.value as ImplanteAtributos['lado'] })} options={catalogReferenceOptions(sistemaItemCatalogo, 'Lado', [{ label: 'Direito', value: 'direito' }, { label: 'Esquerdo', value: 'esquerdo' }, { label: 'Ambos', value: 'ambos' }, { label: 'Não se aplica', value: 'nao-se-aplica' }]).map((option) => ({ ...option, value: option.value === 'nao_se_aplica' ? 'nao-se-aplica' : option.value }))} width="100%" />
  </AttributeRow>;

  const materialFields = <AttributeRow $columns={2}>
    <Select theme={theme} neon={neon} label="Material" value={atributos.material ?? ''} onChange={(e) => update({ material: e.target.value as ImplanteAtributos['material'] })} options={catalogReferenceOptions(sistemaItemCatalogo, 'Material', [{ label: 'Simples', value: 'simples' }, { label: 'Carbono', value: 'carbono' }, { label: 'Blindada', value: 'blindada' }, { label: 'Arcana', value: 'arcana' }, { label: 'Titânio', value: 'titanio' }, { label: 'Sicmithril', value: 'sicmithril' }, { label: 'Outro', value: 'outro' }])} width="100%" />
    <InputText label="Modelo" theme={theme} neon={neon} value={atributos.modelo ?? ''} onChange={(e) => update({ modelo: e.target.value })} />
  </AttributeRow>;

  const statusBonusFields = <AttributeRow $columns={3}>
    {IMPLANTE_STATUS_BONUS_FIELDS.map(([key, label]) => <InputText key={key} label={`Bônus de ${label}`} help={getWikiContentHelp('equipment', 'vitalBonus')} type="number" theme={theme} neon={neon} value={String(atributos.bonus?.[key] ?? 0)} onChange={(e) => update({ bonus: { ...atributos.bonus, [key]: e.target.value === '' ? 0 : Number(e.target.value) } })} />)}
  </AttributeRow>;

  const effectField = <AttributeRow>
    <InputText label="Efeito" theme={theme} neon={neon} value={atributos.efeito ?? ''} onChange={(e) => update({ efeito: e.target.value })} />
  </AttributeRow>;

  const bonusAttributes = sistemaItemCatalogo?.attributeOptions.length ? sistemaItemCatalogo.attributeOptions
    .map(option => [option.value.toLowerCase(), option.label] as const)
    : [...IMPLANTE_ATTRIBUTE_BONUS_FIELDS, ['resistencia', 'Resistência'] as const];
  const attributeBonusFields = <AttributeRow $columns={3}>
    {bonusAttributes.map(([key, label]) => <InputText key={key} label={`Bônus de ${label}`} type="number"
      help={getWikiContentHelp('equipment', 'attributeBonus')}
      theme={theme} neon={neon} value={atributos.bonus?.[key] ?? 0}
      onChange={event => update({ bonus: { ...atributos.bonus, [key]: Number(event.target.value) } })} />)}
  </AttributeRow>;

  const configurationFields = <>
    <AttributeRow $columns={2}>
      <InputText label="Slots de modificação" type="number" theme={theme} neon={neon} value={String(atributos.slotsModificacao ?? 0)} onChange={(e) => update({ slotsModificacao: e.target.value === '' ? 0 : Number(e.target.value) })} />
      <InputText label="Slots de lácrima" type="number" theme={theme} neon={neon} value={String(atributos.slotsLacrima ?? 0)} onChange={(e) => update({ slotsLacrima: e.target.value === '' ? 0 : Number(e.target.value) })} />
    </AttributeRow>
    <AttributeRow>
      <CheckBox neon={neon} label="Necessita amputação" checked={atributos.necessitaAmputacao ?? false} onChange={(necessitaAmputacao) => update({ necessitaAmputacao })} />
    </AttributeRow>
  </>;

  const defenseFields = <AttributeRow $columns={3}>
    {(['protecaoBase', 'armaduraBase', 'escudoBase'] as const).map((key, index) => <InputText key={key}
      label={['Proteção', 'Armadura', 'Escudo'][index]} type="number" min={0} theme={theme} neon={neon}
      value={atributos[key] ?? 0} onChange={event => update({ [key]: Number(event.target.value) })} />)}
  </AttributeRow>;

  const enhancementFields = <>
    {(atributos.especiais ?? []).map((item, index) => <AttributeRow $columns={2} key={`especial-${index}`}><InputText label={`Efeito especial ${index + 1}`} theme={theme} neon={neon} value={item} onChange={(e) => updateList('especiais', index, e.target.value)} /><CyberButton type="button" theme={theme} neon={neon} text="Remover efeito" onClick={() => update({ especiais: atributos.especiais?.filter((_, i) => i !== index) })} /></AttributeRow>)}
    {(['modificacoes', 'lacrimas'] as const).map((key) => <React.Fragment key={key}>{(atributos[key] ?? []).map((item, index) => <AttributeRow $columns={3} key={`${key}-${index}`}><InputText label={`${key === 'modificacoes' ? 'Modificação' : 'Lácrima'} ${index + 1}: nome`} theme={theme} neon={neon} value={item.nome} onChange={(e) => updateDetails(key, index, 'nome', e.target.value)} /><InputText label={`${key === 'modificacoes' ? 'Modificação' : 'Lácrima'} ${index + 1}: descrição`} theme={theme} neon={neon} value={item.descricao} onChange={(e) => updateDetails(key, index, 'descricao', e.target.value)} /><CyberButton type="button" theme={theme} neon={neon} text="Remover" onClick={() => update({ [key]: atributos[key]?.filter((_, i) => i !== index) })} /></AttributeRow>)}</React.Fragment>)}
    <ProsthesisActions $compact={managementLayout}>
      <CyberButton type="button" theme={theme} neon={neon} text="Adicionar efeito especial" onClick={() => update({ especiais: [...(atributos.especiais ?? []), ''] })} />
      <CyberButton type="button" theme={theme} neon={neon} text="Adicionar modificação" onClick={() => update({ modificacoes: [...(atributos.modificacoes ?? []), { nome: '', descricao: '' }] })} />
      <CyberButton type="button" theme={theme} neon={neon} text="Adicionar lácrima" onClick={() => update({ lacrimas: [...(atributos.lacrimas ?? []), { nome: '', descricao: '' }] })} />
    </ProsthesisActions>
  </>;

  return <FormItemAtributos theme={theme} neon={neon}>
    {managementLayout ? <>
      <ManagementAttributeGroup enabled title="Instalação" theme={theme} neon={neon}>
        {placementFields}
      </ManagementAttributeGroup>
      <ManagementAttributeGroup enabled title="Bônus vitais" theme={theme} neon={neon}>
        {statusBonusFields}
      </ManagementAttributeGroup>
      {effectField}
      <ManagementAttributeGroup enabled title="Material e modelo" theme={theme} neon={neon}>
        {materialFields}
      </ManagementAttributeGroup>
      <ManagementAttributeGroup enabled title="Bônus de atributos" theme={theme} neon={neon}>
        {attributeBonusFields}
      </ManagementAttributeGroup>
      <ManagementAttributeGroup enabled title="Defesas" theme={theme} neon={neon}>{defenseFields}</ManagementAttributeGroup>
      <ManagementAttributeGroup enabled title="Configuração" theme={theme} neon={neon}>
        {configurationFields}
      </ManagementAttributeGroup>
      <ManagementAttributeGroup enabled title="Aprimoramentos" theme={theme} neon={neon}>
        {enhancementFields}
      </ManagementAttributeGroup>
    </> : <>
      {placementFields}
      {materialFields}
      {statusBonusFields}
      {attributeBonusFields}
      {defenseFields}
      {configurationFields}
      {effectField}
      {enhancementFields}
    </>}
    <TestSpecificationFields
      value={atributos.teste}
      onChange={(teste) => update({ teste, aplicaTeste: Boolean(teste),
        ...(teste ? { tipoArma: atributos.tipoArma ?? 'arma_branca_comum' } : {}) })}
      theme={theme}
      neon={neon}
      testOptions={sistemaItemCatalogo?.testOptions}
      attributeOptions={sistemaItemCatalogo?.attributeOptions}
    />
    {atributos.teste && <ArmaAtributosForm weaponFieldsOnly managementLayout theme={theme} neon={neon}
      value={{ ...atributos, bonus: [] }}
      sistemaItemCatalogo={sistemaItemCatalogo && { ...sistemaItemCatalogo, archetypeOptions: [] }}
      onChange={(attack: ArmaAtributos) => onChange({ ...atributos, ...attack,
        bonus: atributos.bonus, codigoArquetipo: (atributos as { codigoArquetipo?: string }).codigoArquetipo })} />}
    <ConditionEffectFields
      value={atributos.condicoes}
      allowEquipTrigger
      onChange={(condicoes) => update({ condicoes })}
      theme={theme}
      neon={neon}
      options={sistemaItemCatalogo?.conditionOptions} resultOptions={sistemaItemCatalogo?.resultOptions}
    />
  </FormItemAtributos>;
};

export const ConsumiveisAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon, sistemaItemCatalogo }) => (
    <FormItemAtributos theme={theme} neon={neon}>
    <AttributeRow $columns={3}>
      <InputText label="Restaura Vida" type="number" theme={theme} neon={neon} value={value?.restaura?.vida ?? ''} onChange={e => onChange({ ...value, restaura: { ...value?.restaura, vida: Number(e.target.value) } })} />
      <InputText label="Restaura Estamina" type="number" theme={theme} neon={neon} value={value?.restaura?.estamina ?? ''} onChange={e => onChange({ ...value, restaura: { ...value?.restaura, estamina: Number(e.target.value) } })} />
      <InputText label="Restaura Mana" type="number" theme={theme} neon={neon} value={value?.restaura?.mana ?? ''} onChange={e => onChange({ ...value, restaura: { ...value?.restaura, mana: Number(e.target.value) } })} />
    </AttributeRow>
    <AttributeRow>
      <InputText label="Duração" theme={theme} neon={neon} value={value?.duracao || ""} onChange={e => onChange({ ...value, duracao: e.target.value })} />
    </AttributeRow>
    <AttributeRow>
      <InputText label="Especial" theme={theme} neon={neon} value={value?.especial || ""} onChange={e => onChange({ ...value, especial: e.target.value })} />
    </AttributeRow>
    <AttributeRow>
      <InputText label="Efeito" theme={theme} neon={neon} value={value?.efeito || ""} onChange={e => onChange({ ...value, efeito: e.target.value })} />
    </AttributeRow>
    <TestSpecificationFields value={value?.teste} onChange={(teste) => onChange({ ...value, teste, aplicaTeste: Boolean(teste) })} theme={theme} neon={neon} testOptions={sistemaItemCatalogo?.testOptions} />
    <ConditionEffectFields value={value?.condicoes} onChange={(condicoes) => onChange({ ...value, condicoes })} theme={theme} neon={neon} options={sistemaItemCatalogo?.conditionOptions} resultOptions={sistemaItemCatalogo?.resultOptions} useOnly />
  </FormItemAtributos>
);

export const AcessorioAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon, sistemaItemCatalogo }) => (
    <FormItemAtributos theme={theme} neon={neon}>
    <Select label="Compatibilidade com armas" theme={theme} neon={neon} width="100%" value={value?.compatibilidade ?? 'todas'}
      allowEmptyOption={false}
      options={[{ value: 'todas', label: 'Todas as armas' }, { value: 'distancia', label: 'Armas à distância' }, { value: 'corpo_a_corpo', label: 'Armas corpo a corpo' }]}
      onChange={(event) => onChange({ ...value, compatibilidade: event.target.value })} />
    <WeaponModifiers value={(value as AcessorioAtributos)?.modificadores} mode={value?.compatibilidade ?? 'todas'}
      onChange={(modifiers) => onChange({ ...value, modificadores: modifiers })} theme={theme} neon={neon} />
    <AttributeRow $columns={2}>
      <InputText label="Slot" theme={theme} neon={neon} value={value?.slot || ""} onChange={e => onChange({ ...value, slot: e.target.value })} />
      <InputText label="Duração" theme={theme} neon={neon} value={value?.duracao || ""} onChange={e => onChange({ ...value, duracao: e.target.value })} />
    </AttributeRow>
    <AttributeRow>
      <InputText label="Efeito" theme={theme} neon={neon} value={value?.efeito || ""} onChange={e => onChange({ ...value, efeito: e.target.value })} />
    </AttributeRow>
    <TestSpecificationFields value={value?.teste} onChange={(teste) => onChange({ ...value, teste, aplicaTeste: Boolean(teste) })} theme={theme} neon={neon} testOptions={sistemaItemCatalogo?.testOptions} />
    <ConditionEffectFields value={value?.condicoes} onChange={(condicoes) => onChange({ ...value, condicoes })} theme={theme} neon={neon} options={sistemaItemCatalogo?.conditionOptions} resultOptions={sistemaItemCatalogo?.resultOptions} />
  </FormItemAtributos>
);

export const OutrosAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon, sistemaItemCatalogo }) => (
    <FormItemAtributos theme={theme} neon={neon}>
    <AttributeRow>
      {([
        ['dano', 'Dano'], ['protecao', 'Proteção'], ['armadura', 'Armadura'],
        ['escudo', 'Escudo'], ['recuperacaoVida', 'Recuperação de vida'],
        ['recuperacaoMana', 'Recuperação de mana'], ['recuperacaoEstamina', 'Recuperação de estamina'],
      ] as const).map(([key, label]) => <InputText key={key} label={label} type="number"
        theme={theme} neon={neon} value={value?.[key] ?? ''}
        onChange={event => onChange({ ...value,
          [key]: event.target.value === '' ? undefined : Math.max(0, Number(event.target.value)) })} />)}
    </AttributeRow>
    <AttributeRow>
      <InputText label="Duração" theme={theme} neon={neon} value={value?.duracao || ""} onChange={e => onChange({ ...value, duracao: e.target.value })} />
    </AttributeRow>
    <AttributeRow>
      <InputText label="Especial" theme={theme} neon={neon} value={value?.especial || ""} onChange={e => onChange({ ...value, especial: e.target.value })} />
    </AttributeRow>
    <AttributeRow>
      <InputText label="Efeito" theme={theme} neon={neon} value={value?.efeito || ""} onChange={e => onChange({ ...value, efeito: e.target.value })} />
    </AttributeRow>
    <TestSpecificationFields value={value?.teste} onChange={(teste) => onChange({ ...value, teste, aplicaTeste: Boolean(teste) })} theme={theme} neon={neon} testOptions={sistemaItemCatalogo?.testOptions} />
    <ConditionEffectFields value={value?.condicoes} onChange={(condicoes) => onChange({ ...value, condicoes })} theme={theme} neon={neon} options={sistemaItemCatalogo?.conditionOptions} resultOptions={sistemaItemCatalogo?.resultOptions} allowEquipTrigger />
  </FormItemAtributos>
);

export const atributosFormMap: Record<string, React.FC<BaseProps>> = {
  arma: ArmaAtributosForm,
  traje: TrajeAtributosForm,
  consumiveis: ConsumiveisAtributosForm,
  acessorio: AcessorioAtributosForm,
  implante: ImplanteAtributosForm,
  outro: OutrosAtributosForm,
};



export const AtaqueAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon, sistemaItemCatalogo }) => {
  const [local, setLocal] = React.useState(
    withNormalizedAcerto(value, { dano: null, especial: "", cooldown: "", bonus: "" })
  );

  const handleChange = (key: string, val: any) => {
    const updated = { ...local, [key]: val };
    setLocal(updated);
    onChange(updated);
  };

  return(
    <FormItemAtributos theme={theme} neon={neon}>
      <InputText
        label="Dano"
        type='number'
        theme={theme}
        neon={neon}
        value={local.dano}
        onChange={e => handleChange('dano', Number(e.target.value))}
      />
      <InputText
        label="Especial"
        theme={theme}
        neon={neon}
        value={local.especial}
        onChange={e => handleChange('especial', e.target.value)}
      />
      <InputText
        label="Cooldown"
        theme={theme}
        neon={neon}
        value={local.cooldown}
        onChange={e => handleChange('cooldown', e.target.value)}
      />
      <InputText
        label="Cooldown (turnos)"
        type="number"
        theme={theme}
        neon={neon}
        value={local.cooldownTurnos ?? ''}
        onChange={e => handleChange('cooldownTurnos', e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)))}
      />
      <InputText
        label="Bonûs"
        theme={theme}
        neon={neon}
        value={local.bonus}
        onChange={e => handleChange('bonus', e.target.value)}
      />
      <AcertoDadoSelect value={local.acerto} onChange={(acerto) => handleChange('acerto', acerto)} theme={theme} neon={neon} />
      <TestSpecificationFields value={local.teste} onChange={(teste) => handleChange('teste', teste)} theme={theme} neon={neon} />
      <ConditionEffectFields value={local.condicoes} onChange={(condicoes) => handleChange('condicoes', condicoes)} theme={theme} neon={neon} options={sistemaItemCatalogo?.conditionOptions} resultOptions={sistemaItemCatalogo?.resultOptions} />
    </FormItemAtributos>
  );
};

export const SuporteAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon, sistemaItemCatalogo }) => {
  const [local, setLocal] = React.useState(
    withNormalizedAcerto(value, { especial: "", cooldown: "", bonus: "" })
  );

  const handleChange = (key: string, val: any) => {
    const updated = { ...local, [key]: val };
    setLocal(updated);
    onChange(updated);
  };

  return(
    <FormItemAtributos theme={theme} neon={neon}>
      <InputText
        label="Especial"
        theme={theme}
        neon={neon}
        value={local.especial}
        onChange={e => handleChange('especial', e.target.value)}
      />
      <InputText
        label="Cooldown"
        theme={theme}
        neon={neon}
        value={local.cooldown}
        onChange={e => handleChange('cooldown', e.target.value)}
      />
      <InputText label="Cooldown (turnos)" type="number" theme={theme} neon={neon} value={local.cooldownTurnos ?? ''} onChange={e => handleChange('cooldownTurnos', e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)))} />
      <InputText
        label="Bonûs"
        theme={theme}
        neon={neon}
        value={local.bonus}
        onChange={e => handleChange('bonus', e.target.value)}
      />
      <AcertoDadoSelect value={local.acerto} onChange={(acerto) => handleChange('acerto', acerto)} theme={theme} neon={neon} />
      <TestSpecificationFields value={local.teste} onChange={(teste) => handleChange('teste', teste)} theme={theme} neon={neon} />
      <ConditionEffectFields value={local.condicoes} onChange={(condicoes) => handleChange('condicoes', condicoes)} theme={theme} neon={neon} options={sistemaItemCatalogo?.conditionOptions} resultOptions={sistemaItemCatalogo?.resultOptions} />
    </FormItemAtributos>
  );
};

export const BuffAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon, sistemaItemCatalogo }) => {
  const [local, setLocal] = React.useState(
    withNormalizedAcerto(value, { especial: "", cooldown: "", bonus: "" })
  );

  const handleChange = (key: string, val: any) => {
    const updated = { ...local, [key]: val };
    setLocal(updated);
    onChange(updated);
  };

  return(
    <FormItemAtributos theme={theme} neon={neon}>
      <InputText
        label="Especial"
        theme={theme}
        neon={neon}
        value={local.especial}
        onChange={e => handleChange('especial', e.target.value)}
      />
      <InputText
        label="Cooldown"
        theme={theme}
        neon={neon}
        value={local.cooldown}
        onChange={e => handleChange('cooldown', e.target.value)}
      />
      <InputText label="Cooldown (turnos)" type="number" theme={theme} neon={neon} value={local.cooldownTurnos ?? ''} onChange={e => handleChange('cooldownTurnos', e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)))} />
      <InputText
        label="Bonûs"
        theme={theme}
        neon={neon}
        value={local.bonus}
        onChange={e => handleChange('bonus', e.target.value)}
      />
      <AcertoDadoSelect value={local.acerto} onChange={(acerto) => handleChange('acerto', acerto)} theme={theme} neon={neon} />
      <TestSpecificationFields value={local.teste} onChange={(teste) => handleChange('teste', teste)} theme={theme} neon={neon} />
      <ConditionEffectFields value={local.condicoes} onChange={(condicoes) => handleChange('condicoes', condicoes)} theme={theme} neon={neon} options={sistemaItemCatalogo?.conditionOptions} resultOptions={sistemaItemCatalogo?.resultOptions} />
    </FormItemAtributos>
  );
};

export const DebuffAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon, sistemaItemCatalogo }) => {
  const [local, setLocal] = React.useState(
    withNormalizedAcerto(value, { especial: "", cooldown: "", bonus: "" })
  );

  const handleChange = (key: string, val: any) => {
    const updated = { ...local, [key]: val };
    setLocal(updated);
    onChange(updated);
  };

  return(
    <FormItemAtributos theme={theme} neon={neon}>
      <InputText
        label="Especial"
        theme={theme}
        neon={neon}
        value={local.especial}
        onChange={e => handleChange('especial', e.target.value)}
      />
      <InputText
        label="Cooldown"
        theme={theme}
        neon={neon}
        value={local.cooldown}
        onChange={e => handleChange('cooldown', e.target.value)}
      />
      <InputText label="Cooldown (turnos)" type="number" theme={theme} neon={neon} value={local.cooldownTurnos ?? ''} onChange={e => handleChange('cooldownTurnos', e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)))} />
      <InputText
        label="Bonûs"
        theme={theme}
        neon={neon}
        value={local.bonus}
        onChange={e => handleChange('bonus', e.target.value)}
      />
      <AcertoDadoSelect value={local.acerto} onChange={(acerto) => handleChange('acerto', acerto)} theme={theme} neon={neon} />
      <TestSpecificationFields value={local.teste} onChange={(teste) => handleChange('teste', teste)} theme={theme} neon={neon} />
      <ConditionEffectFields value={local.condicoes} onChange={(condicoes) => handleChange('condicoes', condicoes)} theme={theme} neon={neon} options={sistemaItemCatalogo?.conditionOptions} resultOptions={sistemaItemCatalogo?.resultOptions} />
    </FormItemAtributos>
  );
};

export const atributosSkillFormMap: Record<string, React.FC<BaseProps>> = {
  ataque: AtaqueAtributosForm,
  suporte: SuporteAtributosForm,
  buff: BuffAtributosForm,
  debuff: DebuffAtributosForm,
};


export const AtaqueMagiaAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon, sistemaItemCatalogo }) => {
  const [local, setLocal] = React.useState(
    withNormalizedAcerto(value, { dano: null, especial: "", bonus: "" })
  );

  const handleChange = (key: string, val: any) => {
    const updated = { ...local, [key]: val };
    setLocal(updated);
    onChange(updated);
  };

  return(
    <FormItemAtributos theme={theme} neon={neon}>
      <InputText
        label="Dano"
        type='number'
        theme={theme}
        neon={neon}
        value={local.dano}
        onChange={e => handleChange('dano', Number(e.target.value))}
      />
      <InputText
        label="Especial"
        theme={theme}
        neon={neon}
        value={local.especial}
        onChange={e => handleChange('especial', e.target.value)}
      />
      <InputText
        label="Bonûs"
        theme={theme}
        neon={neon}
        value={local.bonus}
        onChange={e => handleChange('bonus', e.target.value)}
      />
      <AcertoDadoSelect value={local.acerto} onChange={(acerto) => handleChange('acerto', acerto)} theme={theme} neon={neon} />
      <TestSpecificationFields value={local.teste} onChange={(teste) => handleChange('teste', teste)} theme={theme} neon={neon} />
      <ConditionEffectFields value={local.condicoes} onChange={(condicoes) => handleChange('condicoes', condicoes)} theme={theme} neon={neon} options={sistemaItemCatalogo?.conditionOptions} resultOptions={sistemaItemCatalogo?.resultOptions} />
      <CheckSelect theme={theme} neon={neon} label="Remover condições ao acertar (magia)"
        value={local.removeCondicoes ?? []} options={sistemaItemCatalogo?.magicRemovalOptions ?? []}
        onChange={(removeCondicoes) => handleChange('removeCondicoes', removeCondicoes)} />
    </FormItemAtributos>
  );
};

export const SuporteMagiaAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon, sistemaItemCatalogo }) => {
  const [local, setLocal] = React.useState(
    withNormalizedAcerto(value, { especial: "", bonus: "" })
  );

  const handleChange = (key: string, val: any) => {
    const updated = { ...local, [key]: val };
    setLocal(updated);
    onChange(updated);
  };

  return(
    <FormItemAtributos theme={theme} neon={neon}>
      <InputText
        label="Especial"
        theme={theme}
        neon={neon}
        value={local.especial}
        onChange={e => handleChange('especial', e.target.value)}
      />
      <InputText
        label="Bonûs"
        theme={theme}
        neon={neon}
        value={local.bonus}
        onChange={e => handleChange('bonus', e.target.value)}
      />
      <AcertoDadoSelect value={local.acerto} onChange={(acerto) => handleChange('acerto', acerto)} theme={theme} neon={neon} />
      <TestSpecificationFields value={local.teste} onChange={(teste) => handleChange('teste', teste)} theme={theme} neon={neon} />
      <ConditionEffectFields value={local.condicoes} onChange={(condicoes) => handleChange('condicoes', condicoes)} theme={theme} neon={neon} options={sistemaItemCatalogo?.conditionOptions} resultOptions={sistemaItemCatalogo?.resultOptions} />
      <CheckSelect theme={theme} neon={neon} label="Remover condições ao acertar (magia)"
        value={local.removeCondicoes ?? []} options={sistemaItemCatalogo?.magicRemovalOptions ?? []}
        onChange={(removeCondicoes) => handleChange('removeCondicoes', removeCondicoes)} />
    </FormItemAtributos>
  );
};

export const BuffMagiaAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon, sistemaItemCatalogo }) => {
  const [local, setLocal] = React.useState(
    withNormalizedAcerto(value, { especial: "", bonus: "" })
  );

  const handleChange = (key: string, val: any) => {
    const updated = { ...local, [key]: val };
    setLocal(updated);
    onChange(updated);
  };

  return(
    <FormItemAtributos theme={theme} neon={neon}>
      <InputText
        label="Especial"
        theme={theme}
        neon={neon}
        value={local.especial}
        onChange={e => handleChange('especial', e.target.value)}
      />
      <InputText
        label="Bonûs"
        theme={theme}
        neon={neon}
        value={local.bonus}
        onChange={e => handleChange('bonus', e.target.value)}
      />
      <AcertoDadoSelect value={local.acerto} onChange={(acerto) => handleChange('acerto', acerto)} theme={theme} neon={neon} />
      <TestSpecificationFields value={local.teste} onChange={(teste) => handleChange('teste', teste)} theme={theme} neon={neon} />
      <ConditionEffectFields value={local.condicoes} onChange={(condicoes) => handleChange('condicoes', condicoes)} theme={theme} neon={neon} options={sistemaItemCatalogo?.conditionOptions} resultOptions={sistemaItemCatalogo?.resultOptions} />
      <CheckSelect theme={theme} neon={neon} label="Remover condições ao acertar (magia)"
        value={local.removeCondicoes ?? []} options={sistemaItemCatalogo?.magicRemovalOptions ?? []}
        onChange={(removeCondicoes) => handleChange('removeCondicoes', removeCondicoes)} />
    </FormItemAtributos>
  );
};

export const DebuffMagiaAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon, sistemaItemCatalogo }) => {
  const [local, setLocal] = React.useState(
    withNormalizedAcerto(value, { especial: "", bonus: "" })
  );

  const handleChange = (key: string, val: any) => {
    const updated = { ...local, [key]: val };
    setLocal(updated);
    onChange(updated);
  };

  return(
    <FormItemAtributos theme={theme} neon={neon}>
      <InputText
        label="Especial"
        theme={theme}
        neon={neon}
        value={local.especial}
        onChange={e => handleChange('especial', e.target.value)}
      />
      <InputText
        label="Bonûs"
        theme={theme}
        neon={neon}
        value={local.bonus}
        onChange={e => handleChange('bonus', e.target.value)}
      />
      <AcertoDadoSelect value={local.acerto} onChange={(acerto) => handleChange('acerto', acerto)} theme={theme} neon={neon} />
      <TestSpecificationFields value={local.teste} onChange={(teste) => handleChange('teste', teste)} theme={theme} neon={neon} />
      <ConditionEffectFields value={local.condicoes} onChange={(condicoes) => handleChange('condicoes', condicoes)} theme={theme} neon={neon} options={sistemaItemCatalogo?.conditionOptions} resultOptions={sistemaItemCatalogo?.resultOptions} />
      <CheckSelect theme={theme} neon={neon} label="Remover condições ao acertar (magia)"
        value={local.removeCondicoes ?? []} options={sistemaItemCatalogo?.magicRemovalOptions ?? []}
        onChange={(removeCondicoes) => handleChange('removeCondicoes', removeCondicoes)} />
    </FormItemAtributos>
  );
};

export const atributosMagiaFormMap: Record<string, React.FC<BaseProps>> = {
  ataque: AtaqueMagiaAtributosForm,
  suporte: SuporteMagiaAtributosForm,
  buff: BuffMagiaAtributosForm,
  debuff: DebuffMagiaAtributosForm,
};
