import React from 'react';
import { InputText } from '../../../../../../components/Generic/InputText/InputText';
import { Select } from '../../../../../../components/Generic/Select/Select';
import { CheckBox } from '../../../../../../components/Generic/CheckBox/CheckBox';
import { CyberButton } from '../../../../../../components/Generic/HighlightButton/HighlightButton';
import { AttributeRow, AttributeSubsection, AttributeSubsectionTitle, FormItemAtributos, ProsthesisActions } from './FormCharacter.style';
import { ArmaAtributos, ArmaTipo, ArmaTipoDano, ImplanteAtributos, TrajeAtributos } from '../../../../../../models/Itens';
import { ACERTO_DADO_OPTIONS, ARMA_TIPO_DANO_OPTIONS, ARMA_TIPO_OPTIONS, getPrimeiroAtaqueComGastoEstamina, normalizeDadoAcerto, TRAJE_TIPO_OPTIONS } from '../../../../../../constants';
import { DadoAcerto } from '../../../../../../models/Dados';

interface BaseProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  value: any;
  onChange: (v: any) => void;
  managementLayout?: boolean;
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
    <AttributeSubsectionTitle theme={theme} neon={neon}>{title}</AttributeSubsectionTitle>
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

export const ArmaAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon, managementLayout = false }) => {
  const initialValue = (value ?? {}) as ArmaAtributos;
  const [local, setLocal] = React.useState<ArmaAtributos>({
    ...initialValue,
    danoPorAlcance: initialValue.danoPorAlcance ?? {},
    cadencia: initialValue.cadencia ?? initialValue.ataquesPorTurno ?? 1,
    capacidadeUso: initialValue.capacidadeUso ?? 0,
    capacidadeMunicao: initialValue.capacidadeMunicao ?? initialValue.municao?.capacidade ?? 0,
    gastoEstaminaPorAtaque: initialValue.gastoEstaminaPorAtaque ?? 0,
    bonus: initialValue.bonus ?? [],
    especial: initialValue.especial ?? '',
    acerto: normalizeDadoAcerto(initialValue.acerto) || undefined,
    duracaoEfeito: initialValue.duracaoEfeito ?? '',
  });

  const handleChange = <Key extends keyof ArmaAtributos>(key: Key, val: ArmaAtributos[Key]) => {
    const updated: ArmaAtributos = { ...local, [key]: val };

    if (key === 'cadencia') {
      updated.ataquesPorTurno = val as number | undefined;
    }

    if (key === 'capacidadeMunicao') {
      updated.municao = {
        capacidade: Number(val) || 0,
        atual: local.municao?.atual ?? 0,
      };
    }

    setLocal(updated);
    onChange(updated);
  };

  return (
    <FormItemAtributos>
      <ManagementAttributeGroup enabled={managementLayout} title="Classificação" theme={theme} neon={neon}>
        <AttributeRow $columns={2}>
          <Select label="Tipo de arma" theme={theme} neon={neon} value={local.tipoArma ?? ''} onChange={e => handleChange('tipoArma', e.target.value as ArmaTipo)} options={ARMA_TIPO_OPTIONS} width="100%" />
          <Select label="Tipo de dano" theme={theme} neon={neon} value={local.tipoDano ?? ''} onChange={e => handleChange('tipoDano', e.target.value as ArmaTipoDano)} options={ARMA_TIPO_DANO_OPTIONS} width="100%" />
        </AttributeRow>
      </ManagementAttributeGroup>

      <ManagementAttributeGroup enabled={managementLayout} title="Dano" theme={theme} neon={neon}>
        <AttributeRow $columns={4}>
          <InputText label="Dano Base" type="number" theme={theme} neon={neon} value={local.danoBase ?? ''} onChange={e => handleChange('danoBase', e.target.value === '' ? undefined : Number(e.target.value))} />
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
        <AttributeRow $columns={2}>
          <InputText label={`Estamina por ação${getPrimeiroAtaqueComGastoEstamina(local.tipoArma) === 2 ? ' (2ª+)' : ''}`} type="number" theme={theme} neon={neon} value={local.gastoEstaminaPorAtaque ?? ''} onChange={e => handleChange('gastoEstaminaPorAtaque', e.target.value === '' ? undefined : Number(e.target.value))} />
          <Select label="Acerto" theme={theme} neon={neon} value={normalizeDadoAcerto(local.acerto)} onChange={e => handleChange('acerto', e.target.value as DadoAcerto)} options={ACERTO_DADO_OPTIONS} width="100%" />
        </AttributeRow>
      </ManagementAttributeGroup>

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
    </FormItemAtributos>
  );
};

export const TrajeAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon }) => {
  const [local, setLocal] = React.useState<TrajeAtributos>(
    value || { tipoTraje: undefined, armaduraBase: 0, protecaoBase: 0, escudoBase: 0, resistencias: [], penalidades: [], especial: "" }
  );

  const handleChange = (key: string, val: any) => {
    const updated = { ...local, [key]: val };
    setLocal(updated);
    onChange(updated);
  };

  return (
    <FormItemAtributos>
      <AttributeRow>
        <Select
          label="Subcategoria de proteção"
          value={local.tipoTraje ?? ''}
          onChange={(e) => handleChange('tipoTraje', e.target.value || undefined)}
          theme={theme}
          neon={neon}
          options={TRAJE_TIPO_OPTIONS}
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

export const ImplanteAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon, managementLayout = false }) => {
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
    <Select theme={theme} neon={neon} label="Parte do corpo" value={atributos.parteCorpo ?? ''} onChange={(e) => update({ parteCorpo: e.target.value as ImplanteAtributos['parteCorpo'] })} options={[{ label: 'Mão', value: 'mao' }, { label: 'Braço', value: 'braco' }, { label: 'Pé', value: 'pe' }, { label: 'Perna', value: 'perna' }, { label: 'Corpo', value: 'corpo' }, { label: 'Ocular', value: 'ocular' }, { label: 'Outro', value: 'outro' }]} width="100%" />
    <Select theme={theme} neon={neon} label="Lado" value={atributos.lado ?? ''} onChange={(e) => update({ lado: e.target.value as ImplanteAtributos['lado'] })} options={[{ label: 'Direito', value: 'direito' }, { label: 'Esquerdo', value: 'esquerdo' }, { label: 'Ambos', value: 'ambos' }, { label: 'Não se aplica', value: 'nao-se-aplica' }]} width="100%" />
  </AttributeRow>;

  const materialFields = <AttributeRow $columns={2}>
    <Select theme={theme} neon={neon} label="Material" value={atributos.material ?? ''} onChange={(e) => update({ material: e.target.value as ImplanteAtributos['material'] })} options={[{ label: 'Simples', value: 'simples' }, { label: 'Carbono', value: 'carbono' }, { label: 'Blindada', value: 'blindada' }, { label: 'Arcana', value: 'arcana' }, { label: 'Titânio', value: 'titanio' }, { label: 'Sicmithril', value: 'sicmithril' }, { label: 'Outro', value: 'outro' }]} width="100%" />
    <InputText label="Modelo" theme={theme} neon={neon} value={atributos.modelo ?? ''} onChange={(e) => update({ modelo: e.target.value })} />
  </AttributeRow>;

  const statusBonusFields = <AttributeRow $columns={3}>
    {IMPLANTE_STATUS_BONUS_FIELDS.map(([key, label]) => <InputText key={key} label={`Bônus de ${label}`} type="number" theme={theme} neon={neon} value={String(atributos.bonus?.[key] ?? 0)} onChange={(e) => update({ bonus: { ...atributos.bonus, [key]: e.target.value === '' ? 0 : Number(e.target.value) } })} />)}
  </AttributeRow>;

  const effectField = <AttributeRow>
    <InputText label="Efeito" theme={theme} neon={neon} value={atributos.efeito ?? ''} onChange={(e) => update({ efeito: e.target.value })} />
  </AttributeRow>;

  const attributeBonusFields = <>
    <AttributeRow $columns={4}>
      {IMPLANTE_ATTRIBUTE_BONUS_FIELDS.map(([key, label]) => <InputText key={key} label={`Bônus de ${label}`} type="number" theme={theme} neon={neon} value={String(atributos.bonus?.[key] ?? 0)} onChange={(e) => update({ bonus: { ...atributos.bonus, [key]: e.target.value === '' ? 0 : Number(e.target.value) } })} />)}
    </AttributeRow>
    <AttributeRow>
      <InputText label="Bônus de Resistência" type="number" theme={theme} neon={neon} value={String(atributos.bonus?.resistencia ?? 0)} onChange={(e) => update({ bonus: { ...atributos.bonus, resistencia: e.target.value === '' ? 0 : Number(e.target.value) } })} />
    </AttributeRow>
  </>;

  const configurationFields = <>
    <AttributeRow $columns={2}>
      <InputText label="Slots de modificação" type="number" theme={theme} neon={neon} value={String(atributos.slotsModificacao ?? 0)} onChange={(e) => update({ slotsModificacao: e.target.value === '' ? 0 : Number(e.target.value) })} />
      <InputText label="Slots de lácrima" type="number" theme={theme} neon={neon} value={String(atributos.slotsLacrima ?? 0)} onChange={(e) => update({ slotsLacrima: e.target.value === '' ? 0 : Number(e.target.value) })} />
    </AttributeRow>
    <AttributeRow>
      <CheckBox neon={neon} label="Necessita amputação" checked={atributos.necessitaAmputacao ?? false} onChange={(necessitaAmputacao) => update({ necessitaAmputacao })} />
    </AttributeRow>
  </>;

  const enhancementFields = <>
    {(atributos.especiais ?? []).map((item, index) => <AttributeRow $columns={2} key={`especial-${index}`}><InputText label={`Efeito especial ${index + 1}`} theme={theme} neon={neon} value={item} onChange={(e) => updateList('especiais', index, e.target.value)} /><CyberButton type="button" theme={theme} neon={neon} text="Remover efeito" onClick={() => update({ especiais: atributos.especiais?.filter((_, i) => i !== index) })} /></AttributeRow>)}
    {(['modificacoes', 'lacrimas'] as const).map((key) => <React.Fragment key={key}>{(atributos[key] ?? []).map((item, index) => <AttributeRow $columns={3} key={`${key}-${index}`}><InputText label={`${key === 'modificacoes' ? 'Modificação' : 'Lácrima'} ${index + 1}: nome`} theme={theme} neon={neon} value={item.nome} onChange={(e) => updateDetails(key, index, 'nome', e.target.value)} /><InputText label={`${key === 'modificacoes' ? 'Modificação' : 'Lácrima'} ${index + 1}: descrição`} theme={theme} neon={neon} value={item.descricao} onChange={(e) => updateDetails(key, index, 'descricao', e.target.value)} /><CyberButton type="button" theme={theme} neon={neon} text="Remover" onClick={() => update({ [key]: atributos[key]?.filter((_, i) => i !== index) })} /></AttributeRow>)}</React.Fragment>)}
    <ProsthesisActions $compact={managementLayout}>
      <CyberButton type="button" theme={theme} neon={neon} text="Adicionar efeito especial" onClick={() => update({ especiais: [...(atributos.especiais ?? []), ''] })} />
      <CyberButton type="button" theme={theme} neon={neon} text="Adicionar modificação" onClick={() => update({ modificacoes: [...(atributos.modificacoes ?? []), { nome: '', descricao: '' }] })} />
      <CyberButton type="button" theme={theme} neon={neon} text="Adicionar lácrima" onClick={() => update({ lacrimas: [...(atributos.lacrimas ?? []), { nome: '', descricao: '' }] })} />
    </ProsthesisActions>
  </>;

  return <FormItemAtributos>
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
      {configurationFields}
      {effectField}
      {enhancementFields}
    </>}
  </FormItemAtributos>;
};

export const ConsumiveisAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon }) => (
  <FormItemAtributos>
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
  </FormItemAtributos>
);

export const AcessorioAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon }) => (
  <FormItemAtributos>
    <AttributeRow $columns={2}>
      <InputText label="Slot" theme={theme} neon={neon} value={value?.slot || ""} onChange={e => onChange({ ...value, slot: e.target.value })} />
      <InputText label="Duração" theme={theme} neon={neon} value={value?.duracao || ""} onChange={e => onChange({ ...value, duracao: e.target.value })} />
    </AttributeRow>
    <AttributeRow>
      <InputText label="Efeito" theme={theme} neon={neon} value={value?.efeito || ""} onChange={e => onChange({ ...value, efeito: e.target.value })} />
    </AttributeRow>
  </FormItemAtributos>
);

export const OutrosAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon }) => (
  <FormItemAtributos>
    <AttributeRow>
      <InputText label="Duração" theme={theme} neon={neon} value={value?.duracao || ""} onChange={e => onChange({ ...value, duracao: e.target.value })} />
    </AttributeRow>
    <AttributeRow>
      <InputText label="Especial" theme={theme} neon={neon} value={value?.especial || ""} onChange={e => onChange({ ...value, especial: e.target.value })} />
    </AttributeRow>
    <AttributeRow>
      <InputText label="Efeito" theme={theme} neon={neon} value={value?.efeito || ""} onChange={e => onChange({ ...value, efeito: e.target.value })} />
    </AttributeRow>
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



export const AtaqueAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon }) => {
  const [local, setLocal] = React.useState(
    withNormalizedAcerto(value, { dano: null, especial: "", cooldown: "", bonus: "" })
  );

  const handleChange = (key: string, val: any) => {
    const updated = { ...local, [key]: val };
    setLocal(updated);
    onChange(updated);
  };

  return(
    <FormItemAtributos>
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
        label="Bonûs"
        theme={theme}
        neon={neon}
        value={local.bonus}
        onChange={e => handleChange('bonus', e.target.value)}
      />
      <AcertoDadoSelect value={local.acerto} onChange={(acerto) => handleChange('acerto', acerto)} theme={theme} neon={neon} />
    </FormItemAtributos>
  );
};

export const SuporteAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon }) => {
  const [local, setLocal] = React.useState(
    withNormalizedAcerto(value, { especial: "", cooldown: "", bonus: "" })
  );

  const handleChange = (key: string, val: any) => {
    const updated = { ...local, [key]: val };
    setLocal(updated);
    onChange(updated);
  };

  return(
    <FormItemAtributos>
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
        label="Bonûs"
        theme={theme}
        neon={neon}
        value={local.bonus}
        onChange={e => handleChange('bonus', e.target.value)}
      />
      <AcertoDadoSelect value={local.acerto} onChange={(acerto) => handleChange('acerto', acerto)} theme={theme} neon={neon} />
    </FormItemAtributos>
  );
};

export const BuffAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon }) => {
  const [local, setLocal] = React.useState(
    withNormalizedAcerto(value, { especial: "", cooldown: "", bonus: "" })
  );

  const handleChange = (key: string, val: any) => {
    const updated = { ...local, [key]: val };
    setLocal(updated);
    onChange(updated);
  };

  return(
    <FormItemAtributos>
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
        label="Bonûs"
        theme={theme}
        neon={neon}
        value={local.bonus}
        onChange={e => handleChange('bonus', e.target.value)}
      />
      <AcertoDadoSelect value={local.acerto} onChange={(acerto) => handleChange('acerto', acerto)} theme={theme} neon={neon} />
    </FormItemAtributos>
  );
};

export const DebuffAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon }) => {
  const [local, setLocal] = React.useState(
    withNormalizedAcerto(value, { especial: "", cooldown: "", bonus: "" })
  );

  const handleChange = (key: string, val: any) => {
    const updated = { ...local, [key]: val };
    setLocal(updated);
    onChange(updated);
  };

  return(
    <FormItemAtributos>
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
        label="Bonûs"
        theme={theme}
        neon={neon}
        value={local.bonus}
        onChange={e => handleChange('bonus', e.target.value)}
      />
      <AcertoDadoSelect value={local.acerto} onChange={(acerto) => handleChange('acerto', acerto)} theme={theme} neon={neon} />
    </FormItemAtributos>
  );
};

export const atributosSkillFormMap: Record<string, React.FC<BaseProps>> = {
  ataque: AtaqueAtributosForm,
  suporte: SuporteAtributosForm,
  buff: BuffAtributosForm,
  debuff: DebuffAtributosForm,
};


export const AtaqueMagiaAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon }) => {
  const [local, setLocal] = React.useState(
    withNormalizedAcerto(value, { dano: null, especial: "", bonus: "" })
  );

  const handleChange = (key: string, val: any) => {
    const updated = { ...local, [key]: val };
    setLocal(updated);
    onChange(updated);
  };

  return(
    <FormItemAtributos>
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
    </FormItemAtributos>
  );
};

export const SuporteMagiaAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon }) => {
  const [local, setLocal] = React.useState(
    withNormalizedAcerto(value, { especial: "", bonus: "" })
  );

  const handleChange = (key: string, val: any) => {
    const updated = { ...local, [key]: val };
    setLocal(updated);
    onChange(updated);
  };

  return(
    <FormItemAtributos>
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
    </FormItemAtributos>
  );
};

export const BuffMagiaAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon }) => {
  const [local, setLocal] = React.useState(
    withNormalizedAcerto(value, { especial: "", bonus: "" })
  );

  const handleChange = (key: string, val: any) => {
    const updated = { ...local, [key]: val };
    setLocal(updated);
    onChange(updated);
  };

  return(
    <FormItemAtributos>
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
    </FormItemAtributos>
  );
};

export const DebuffMagiaAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon }) => {
  const [local, setLocal] = React.useState(
    withNormalizedAcerto(value, { especial: "", bonus: "" })
  );

  const handleChange = (key: string, val: any) => {
    const updated = { ...local, [key]: val };
    setLocal(updated);
    onChange(updated);
  };

  return(
    <FormItemAtributos>
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
    </FormItemAtributos>
  );
};

export const atributosMagiaFormMap: Record<string, React.FC<BaseProps>> = {
  ataque: AtaqueMagiaAtributosForm,
  suporte: SuporteMagiaAtributosForm,
  buff: BuffMagiaAtributosForm,
  debuff: DebuffMagiaAtributosForm,
};
