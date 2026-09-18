import { useRef, useState, type ReactNode } from 'react';
import { ConfirmDialog } from '../Generic/ConfirmDialog/ConfirmDialog';
import { CheckBox } from '../Generic/CheckBox/CheckBox';
import { InputText } from '../Generic/InputText/InputText';
import { CyberButton } from '../Generic/HighlightButton/HighlightButton';
import { VariantArrow, VariantFooter, VariantHeading, VariantSheet } from './CharacterVariants.style';

type Appearance = { theme: 'dark' | 'light'; neon: 'on' | 'off' };

export function CharacterVariantType({ generico, count, onChange, neon }: {
  generico: boolean; count: number; onChange: (value: boolean) => void; neon: 'on' | 'off';
}) {
  const [confirmConversion, setConfirmConversion] = useState(false);
  return <>
    <CheckBox neon={neon} label="Personagem genérico (com variantes)" checked={generico} onChange={value => {
      if (!value && count > 1) setConfirmConversion(true);
      else onChange(value);
    }} />
    <ConfirmDialog open={confirmConversion} title="Tornar personagem único?"
      message="Ao salvar, apenas a ficha atual será mantida."
      onConfirm={() => { onChange(false); setConfirmConversion(false); }}
      onCancel={() => setConfirmConversion(false)} />
  </>;
}

export function CharacterVariantName({ value, onChange, error, errorMessage, theme, neon }: Appearance & {
  value: string; onChange: (value: string) => void; error?: boolean; errorMessage?: string;
}) {
  return <InputText label="Nome da variante" value={value} onChange={event => onChange(event.target.value.slice(0, 100))}
    theme={theme} neon={neon} required width="100%" name="nomeVariante" autoComplete="off"
    error={error} errorMessage={errorMessage} />;
}

export function CharacterVariantPager({ enabled, index, count, onSelect, onAdd, characterName, variantName,
  children, theme, neon }: Appearance & {
  enabled: boolean; index: number; count: number; onSelect: (index: number) => void; onAdd?: () => void;
  characterName: string; variantName?: string; children: ReactNode;
}) {
  const sheetRef = useRef<HTMLElement>(null);
  if (!enabled) return <>{children}</>;
  return <VariantSheet ref={sheetRef} aria-label="Variantes do personagem">
    <VariantHeading>
      <strong>{characterName}</strong>
      {variantName && <span>{variantName}</span>}
      <small role="status">Variante {index + 1} de {count}</small>
    </VariantHeading>
    <VariantArrow type="button" $side="left" $neon={neon === 'on'} aria-label="Variante anterior"
      disabled={index === 0} onClick={() => onSelect(index - 1)}>‹</VariantArrow>
    <VariantArrow type="button" $side="right" $neon={neon === 'on'} aria-label="Próxima variante"
      disabled={index >= count - 1} onClick={() => onSelect(index + 1)}>›</VariantArrow>
    {children}
    {onAdd && <VariantFooter><small>A nova variante começa com uma cópia da ficha atual.</small>
      <CyberButton type="button" theme={theme} neon={neon} width="280px" height="50px"
        text="Adicionar outra variante" onClick={() => {
          onAdd();
          sheetRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }} /></VariantFooter>}
  </VariantSheet>;
}
