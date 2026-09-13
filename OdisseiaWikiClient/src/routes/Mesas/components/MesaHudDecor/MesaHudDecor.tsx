import { MesaHudCorner, MesaHudLine } from '../../Mesas.style';

type HudColor = 'var(--clearneonBlue)' | 'var(--clearneonPink)' | 'var(--clearneonViolet)' | 'var(--clearneonGreen)';

interface MesaHudDecorProps {
  neon: boolean;
  color?: HudColor;
}

/**
 * Moldura compartilhada das superfícies HUD de Mesas.
 * Sem neon, mantém os dois recortes da identidade visual; com neon, completa os
 * quatro cantos e desenha as linhas até eles, como as páginas de Cidade.
 */
export const MesaHudDecor = ({ neon, color = 'var(--clearneonBlue)' }: MesaHudDecorProps) => (
  <>
    <MesaHudCorner $position="top-right" $neon={neon} $color={color} aria-hidden="true" />
    <MesaHudCorner $position="bottom-left" $neon={neon} $color={color} aria-hidden="true" />
    {neon && <>
      <MesaHudCorner $position="top-left" $neon $color={color} aria-hidden="true" />
      <MesaHudCorner $position="bottom-right" $neon $color={color} aria-hidden="true" />
    </>}
    <MesaHudLine $position="top" $active={neon} $color={color} aria-hidden="true" />
    <MesaHudLine $position="right" $active={neon} $color={color} aria-hidden="true" />
    <MesaHudLine $position="bottom" $active={neon} $color={color} aria-hidden="true" />
    <MesaHudLine $position="left" $active={neon} $color={color} aria-hidden="true" />
  </>
);
