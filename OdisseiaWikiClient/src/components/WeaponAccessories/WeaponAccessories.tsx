import type { ArmaAtributos } from '../../models/Itens';
import { describeAccessory, describeModifiers, getEffectiveWeaponAttributes, isAccessoryCompatible } from '../../utils/weaponModifiers';
import { Search } from '../Generic/Search/Search';
import { CyberButton } from '../Generic/HighlightButton/HighlightButton';
import { ModifierEntry, ModifierList, ModifierSection } from '../WeaponModifiers/WeaponModifiers.style';
import { useWeaponAccessories } from './useWeaponAccessories';

interface WeaponAccessoriesProps {
  value: ArmaAtributos;
  onChange: (value: ArmaAtributos) => void;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const WeaponAccessories = ({ value, onChange, theme, neon }: WeaponAccessoriesProps) => {
  const state = useWeaponAccessories(value, onChange);
  const effective = getEffectiveWeaponAttributes(value);
  const totals = describeModifiers(effective.modificadores);
  return (
    <ModifierSection $theme={theme} $neon={neon}>
      <h4>Acessórios</h4>
      <Search label="Pesquisar acessório pelo nome" theme={theme} neon={neon} value={state.query}
        onChange={(event) => state.setQuery(event.target.value)} onFocus={state.load} suggestions={state.suggestions}
        onSelectSuggestion={state.attach} loading={state.loading} width="100%" portal />
      {state.error && <><p role="alert">{state.error}</p><CyberButton type="button" theme={theme} neon={neon} text="Tentar novamente" onClick={state.retry} /></>}
      {state.empty && <p>Nenhum outro acessório disponível no catálogo.</p>}
      {state.attached.map((accessory, index) => (
        <ModifierEntry key={`${accessory.idItemBase}-${index}`}>
          <div>
            <strong>{accessory.nome}</strong>
            <ModifierList>{describeAccessory(accessory.atributos).map((description, position) => <li key={position}>{description}</li>)}</ModifierList>
            {!isAccessoryCompatible(value, accessory.atributos) && <p>Incompatível com este tipo de arma: seus modificadores não se aplicam.</p>}
          </div>
          <CyberButton type="button" theme={theme} neon={neon} text={`Remover ${accessory.nome}`} onClick={() => state.remove(index)} />
        </ModifierEntry>
      ))}
      <h4>Resultado com acessórios</h4>
      <ModifierList aria-live="polite">
        {totals.map((description) => <li key={description}>{description}</li>)}
        {!totals.length && <li>Sem modificadores aplicáveis.</li>}
        {effective.modificadores?.dano && <li>Dano base resultante: {effective.danoBase ?? 'não definido'}. O bônus também se aplica aos danos por alcance preenchidos.</li>}
        {effective.modificadores?.estamina && <li>Estamina por ação resultante: {effective.gastoEstaminaPorAtaque ?? 'não definida'}.</li>}
      </ModifierList>
    </ModifierSection>
  );
};
