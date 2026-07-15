import React from 'react';
import { InputText } from '../../../../../../components/Generic/InputText/InputText';
import { Select } from '../../../../../../components/Generic/Select/Select';
import { CheckBox } from '../../../../../../components/Generic/CheckBox/CheckBox';
import { CyberButton } from '../../../../../../components/Generic/HighlightButton/HighlightButton';
import { FormItemAtributos, ProsthesisActions } from './FormCharacter.style';
import { ImplanteAtributos } from '../../../../../../models/Itens';

interface BaseProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  value: any;
  onChange: (v: any) => void;
}

export const ArmaAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon }) => {
  const [local, setLocal] = React.useState(
    value || { danoPorAlcance: {}, municao: {}, ataquesPorTurno: 1, bonus: [], especial: "", acerto: "1D20" }
  );

  const handleChange = (key: string, val: any) => {
    const updated = { ...local, [key]: val };
    setLocal(updated);
    onChange(updated);
  };

  return (
    <FormItemAtributos>
      <InputText
        label="Dano Curto"
        type="number"
        theme={theme}
        neon={neon}
        value={local.danoPorAlcance?.curta}
        onChange={e => handleChange('danoPorAlcance', { ...local.danoPorAlcance, curta: Number(e.target.value) })}
      />

      <InputText
        label="Dano Médio"
        type="number"
        theme={theme}
        neon={neon}
        value={local.danoPorAlcance?.media}
        onChange={e => handleChange('danoPorAlcance', { ...local.danoPorAlcance, media: Number(e.target.value) })}
      />

      <InputText
        label="Dano Longo"
        type="number"
        theme={theme}
        neon={neon}
        value={local.danoPorAlcance?.longa}
        onChange={e => handleChange('danoPorAlcance', { ...local.danoPorAlcance, longa: Number(e.target.value) })}
      />

      <InputText
        label="Capacidade Munição"
        type="number"
        theme={theme}
        neon={neon}
        value={local.municao?.capacidade}
        onChange={e => handleChange('municao', { ...local.municao, capacidade: Number(e.target.value) })}
      />

      <InputText
        label="Especial"
        theme={theme}
        neon={neon}
        value={local.especial || ""}
        onChange={e => handleChange('especial', e.target.value)}
      />

      <InputText
        label="Acerto"
        theme={theme}
        neon={neon}
        value={local.acerto || ""}
        onChange={e => handleChange('acerto', e.target.value)}
      />
    </FormItemAtributos>
  );
};

export const TrajeAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon }) => {
  const [local, setLocal] = React.useState(
    value || { armaduraBase: 0, protecaoBase: 0, escudoBase: 0, resistencias: [], penalidades: [], especial: "" }
  );

  const handleChange = (key: string, val: any) => {
    const updated = { ...local, [key]: val };
    setLocal(updated);
    onChange(updated);
  };

  return (
    <FormItemAtributos>
      <InputText
        label="Proteção Base"
        type="number"
        theme={theme}
        neon={neon}
        value={local.protecaoBase}
        onChange={e => handleChange('protecaoBase', Number(e.target.value))}
      />

      <InputText
        label="Escudo Base"
        type="number"
        theme={theme}
        neon={neon}
        value={local.escudoBase}
        onChange={e => handleChange('escudoBase', Number(e.target.value))}
      />

      <InputText
        label="Armadura Base"
        type="number"
        theme={theme}
        neon={neon}
        value={local.armaduraBase}
        onChange={e => handleChange('armaduraBase', Number(e.target.value))}
      />

      <InputText
        label="Especial"
        theme={theme}
        neon={neon}
        value={local.especial}
        onChange={e => handleChange('especial', e.target.value)}
      />
    </FormItemAtributos>
  );
};

const BONUS_FIELDS = [
  ['vida', 'Vida'], ['mana', 'Mana'], ['estamina', 'Estamina'], ['resistencia', 'Resistência'],
  ['forca', 'Força'], ['agilidade', 'Agilidade'], ['precisao', 'Precisão'], ['sabedoria', 'Sabedoria'],
] as const;

const emptyImplante = (value: ImplanteAtributos | undefined): ImplanteAtributos => ({
  modelo: '', slotsModificacao: 0, slotsLacrima: 0, necessitaAmputacao: false,
  bonus: {}, especiais: [], modificacoes: [], lacrimas: [], ...value,
});

export const ImplanteAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon }) => {
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

  return <FormItemAtributos>
    <Select theme={theme} neon={neon} label="Parte do corpo" value={atributos.parteCorpo ?? ''} onChange={(e) => update({ parteCorpo: e.target.value as ImplanteAtributos['parteCorpo'] })} options={[{ label: 'Mão', value: 'mao' }, { label: 'Braço', value: 'braco' }, { label: 'Pé', value: 'pe' }, { label: 'Perna', value: 'perna' }, { label: 'Corpo', value: 'corpo' }, { label: 'Ocular', value: 'ocular' }, { label: 'Outro', value: 'outro' }]} width="100%" />
    <Select theme={theme} neon={neon} label="Lado" value={atributos.lado ?? ''} onChange={(e) => update({ lado: e.target.value as ImplanteAtributos['lado'] })} options={[{ label: 'Direito', value: 'direito' }, { label: 'Esquerdo', value: 'esquerdo' }, { label: 'Ambos', value: 'ambos' }, { label: 'Não se aplica', value: 'nao-se-aplica' }]} width="100%" />
    <Select theme={theme} neon={neon} label="Material" value={atributos.material ?? ''} onChange={(e) => update({ material: e.target.value as ImplanteAtributos['material'] })} options={[{ label: 'Simples', value: 'simples' }, { label: 'Carbono', value: 'carbono' }, { label: 'Blindada', value: 'blindada' }, { label: 'Arcana', value: 'arcana' }, { label: 'Titânio', value: 'titanio' }, { label: 'Sicmithril', value: 'sicmithril' }, { label: 'Outro', value: 'outro' }]} width="100%" />
    <InputText label="Modelo" theme={theme} neon={neon} value={atributos.modelo ?? ''} onChange={(e) => update({ modelo: e.target.value })} />
    <InputText label="Slots de modificação" type="number" theme={theme} neon={neon} value={String(atributos.slotsModificacao ?? 0)} onChange={(e) => update({ slotsModificacao: e.target.value === '' ? 0 : Number(e.target.value) })} />
    <InputText label="Slots de lágrima" type="number" theme={theme} neon={neon} value={String(atributos.slotsLacrima ?? 0)} onChange={(e) => update({ slotsLacrima: e.target.value === '' ? 0 : Number(e.target.value) })} />
    <CheckBox neon={neon} label="Necessita amputação" checked={atributos.necessitaAmputacao ?? false} onChange={(necessitaAmputacao) => update({ necessitaAmputacao })} />
    {BONUS_FIELDS.map(([key, label]) => <InputText key={key} label={`Bônus de ${label}`} type="number" theme={theme} neon={neon} value={String(atributos.bonus?.[key] ?? 0)} onChange={(e) => update({ bonus: { ...atributos.bonus, [key]: e.target.value === '' ? 0 : Number(e.target.value) } })} />)}
    {(atributos.especiais ?? []).map((item, index) => <React.Fragment key={`especial-${index}`}><InputText label={`Efeito especial ${index + 1}`} theme={theme} neon={neon} value={item} onChange={(e) => updateList('especiais', index, e.target.value)} /><CyberButton type="button" theme={theme} neon={neon} text="Remover efeito" onClick={() => update({ especiais: atributos.especiais?.filter((_, i) => i !== index) })} /></React.Fragment>)}
    {(['modificacoes', 'lacrimas'] as const).map((key) => <React.Fragment key={key}>{(atributos[key] ?? []).map((item, index) => <React.Fragment key={`${key}-${index}`}><InputText label={`${key === 'modificacoes' ? 'Modificação' : 'Lágrima'} ${index + 1}: nome`} theme={theme} neon={neon} value={item.nome} onChange={(e) => updateDetails(key, index, 'nome', e.target.value)} /><InputText label={`${key === 'modificacoes' ? 'Modificação' : 'Lágrima'} ${index + 1}: descrição`} theme={theme} neon={neon} value={item.descricao} onChange={(e) => updateDetails(key, index, 'descricao', e.target.value)} /><CyberButton type="button" theme={theme} neon={neon} text="Remover" onClick={() => update({ [key]: atributos[key]?.filter((_, i) => i !== index) })} /></React.Fragment>)}</React.Fragment>)}
    <ProsthesisActions>
      <CyberButton type="button" theme={theme} neon={neon} text="Adicionar efeito especial" onClick={() => update({ especiais: [...(atributos.especiais ?? []), ''] })} />
      <CyberButton type="button" theme={theme} neon={neon} text="Adicionar modificação" onClick={() => update({ modificacoes: [...(atributos.modificacoes ?? []), { nome: '', descricao: '' }] })} />
      <CyberButton type="button" theme={theme} neon={neon} text="Adicionar lágrima" onClick={() => update({ lacrimas: [...(atributos.lacrimas ?? []), { nome: '', descricao: '' }] })} />
    </ProsthesisActions>
  </FormItemAtributos>;
};

export const ConsumiveisAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon }) => (
  <InputText
    label="Duração"
    theme={theme}
    neon={neon}
    value={value?.duracao || ""}
    onChange={e => onChange({ ...value, duracao: e.target.value })}
  />
);

export const AcessorioAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon }) => (
  <InputText
    label="Slot"
    theme={theme}
    neon={neon}
    value={value?.slot || ""}
    onChange={e => onChange({ ...value, slot: e.target.value })}
  />
);

export const OutrosAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon }) => (
  <InputText
    label="Especial"
    theme={theme}
    neon={neon}
    value={value?.especial || ""}
    onChange={e => onChange({ ...value, especial: e.target.value })}
  />
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
    value || { dano: null, especial: "", cooldown: "", bonus: "", acerto: "" }
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
      <InputText
        label="Acerto"
        theme={theme}
        neon={neon}
        value={local.acerto}
        onChange={e => handleChange('acerto', e.target.value)}
      />
    </FormItemAtributos>
  );
};

export const SuporteAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon }) => {
  const [local, setLocal] = React.useState(
    value || { especial: "", cooldown: "", bonus: "", acerto: "" }
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
      <InputText
        label="Acerto"
        theme={theme}
        neon={neon}
        value={local.acerto}
        onChange={e => handleChange('acerto', e.target.value)}
      />
    </FormItemAtributos>
  );
};

export const BuffAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon }) => {
  const [local, setLocal] = React.useState(
    value || { especial: "", cooldown: "", bonus: "", acerto: "" }
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
      <InputText
        label="Acerto"
        theme={theme}
        neon={neon}
        value={local.acerto}
        onChange={e => handleChange('acerto', e.target.value)}
      />
    </FormItemAtributos>
  );
};

export const DebuffAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon }) => {
  const [local, setLocal] = React.useState(
    value || { especial: "", cooldown: "", bonus: "", acerto: "" }
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
      <InputText
        label="Acerto"
        theme={theme}
        neon={neon}
        value={local.acerto}
        onChange={e => handleChange('acerto', e.target.value)}
      />
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
    value || { dano: null, especial: "", bonus: "", acerto: "" }
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
      <InputText
        label="Acerto"
        theme={theme}
        neon={neon}
        value={local.acerto}
        onChange={e => handleChange('acerto', e.target.value)}
      />
    </FormItemAtributos>
  );
};

export const SuporteMagiaAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon }) => {
  const [local, setLocal] = React.useState(
    value || { especial: "", bonus: "", acerto: "" }
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
      <InputText
        label="Acerto"
        theme={theme}
        neon={neon}
        value={local.acerto}
        onChange={e => handleChange('acerto', e.target.value)}
      />
    </FormItemAtributos>
  );
};

export const BuffMagiaAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon }) => {
  const [local, setLocal] = React.useState(
    value || { especial: "", bonus: "", acerto: "" }
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
      <InputText
        label="Acerto"
        theme={theme}
        neon={neon}
        value={local.acerto}
        onChange={e => handleChange('acerto', e.target.value)}
      />
    </FormItemAtributos>
  );
};

export const DebuffMagiaAtributosForm: React.FC<BaseProps> = ({ value, onChange, theme, neon }) => {
  const [local, setLocal] = React.useState(
    value || { especial: "", bonus: "", acerto: "" }
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
      <InputText
        label="Acerto"
        theme={theme}
        neon={neon}
        value={local.acerto}
        onChange={e => handleChange('acerto', e.target.value)}
      />
    </FormItemAtributos>
  );
};

export const atributosMagiaFormMap: Record<string, React.FC<BaseProps>> = {
  ataque: AtaqueMagiaAtributosForm,
  suporte: SuporteMagiaAtributosForm,
  buff: BuffMagiaAtributosForm,
  debuff: DebuffMagiaAtributosForm,
};
