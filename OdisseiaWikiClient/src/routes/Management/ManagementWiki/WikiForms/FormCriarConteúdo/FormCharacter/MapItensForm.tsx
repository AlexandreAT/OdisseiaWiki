import React from 'react';
import { InputText } from '../../../../../../components/Generic/InputText/InputText';
import { FormItemAtributos } from './FormCharacter.style';

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