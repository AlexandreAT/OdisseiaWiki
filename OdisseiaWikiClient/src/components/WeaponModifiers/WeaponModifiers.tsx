import { InputText } from '../Generic/InputText/InputText';
import { CyberButton } from '../Generic/HighlightButton/HighlightButton';
import { WEAPON_MODIFIER_FIELDS } from '../../utils/weaponModifiers';
import type { WeaponModifiersProps } from './WeaponModifiers.types';
import { ModifierEntry, ModifierGrid, ModifierSection } from './WeaponModifiers.style';

export const WeaponModifiers = ({ value: source, onChange, mode, theme, neon }: WeaponModifiersProps) => {
  const value = source ?? {};
  return (
  <ModifierSection $theme={theme} $neon={neon}>
    <h4>Modificadores</h4>
    <p>Use valores positivos para bônus e negativos para penalidades. No gasto de estamina, um valor negativo reduz o custo.</p>
    <ModifierGrid>
      {WEAPON_MODIFIER_FIELDS.filter((field) => !mode || mode === 'todas' || field.mode === 'todas' || field.mode === mode).map(({ key, label }) => (
        <InputText key={key} label={`${label} (−/+)`} type="number" theme={theme} neon={neon} width="100%"
          value={value[key] ?? ''} onChange={(event) => onChange({ ...value, [key]: event.target.value === '' ? undefined : Number(event.target.value) })} />
      ))}
    </ModifierGrid>
    {(value.efeitos ?? []).map((effect, index) => (
      <ModifierEntry key={index}>
        <InputText label={`Efeito especial ${index + 1}`} theme={theme} neon={neon} width="100%" value={effect}
          onChange={(event) => onChange({ ...value, efeitos: value.efeitos?.map((entry, position) => position === index ? event.target.value : entry) })} />
        <CyberButton type="button" theme={theme} neon={neon} text="Remover efeito" onClick={() => onChange({ ...value, efeitos: value.efeitos?.filter((_, position) => position !== index) })} />
      </ModifierEntry>
    ))}
    <CyberButton type="button" theme={theme} neon={neon} text="Adicionar efeito especial" onClick={() => onChange({ ...value, efeitos: [...(value.efeitos ?? []), ''] })} />
  </ModifierSection>
  );
};
