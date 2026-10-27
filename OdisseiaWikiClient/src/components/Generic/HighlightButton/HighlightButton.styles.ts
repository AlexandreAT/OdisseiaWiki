import styled, { css } from 'styled-components';

interface Props {
  theme?: 'light' | 'dark';
  neon?: 'on' | 'off';
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  width?: string;
  height?: string;
  colorType?: 'primary' | 'secondary';
  $disabled?: boolean;
  $facePath?: string;
}

interface ColorConfig {
  neon: string;
  clearNeon: string;
  text: string;
  textNeon: string;
  hover: string;
}

const colorConfigs: Record<'primary' | 'secondary', ColorConfig> = {
  primary: {
    neon: 'var(--control-primary-neon, var(--neonBlue))',
    clearNeon: 'var(--control-primary-clear, var(--clearneonBlue))',
    text: 'var(--whitesmoke)',
    textNeon: 'var(--control-primary-clear, var(--clearneonBlue))',
    hover: 'var(--control-primary-clear, var(--clearneonBlue))',
  },
  secondary: {
    neon: 'var(--neonPink)',
    clearNeon: 'var(--clearneonPink)',
    text: 'var(--whitesmoke)',
    textNeon: 'var(--clearneonPink)',
    hover: 'var(--clearneonPink)',
  },
};

// All layers share one grid cell. Intrinsic sizing keywords cannot be used in calc().
const framedSize = (size: string | undefined, fallback: string) => !size ? fallback
  : ['auto', 'fit-content', 'min-content', 'max-content'].includes(size) ? size : `calc(${size} + 15px)`;

export const ButtonClipController = styled.div<Props>`
  --cyber-button-edge-start: ${({ theme, neon, colorType = 'primary', borderColor }) => borderColor ||
    (neon === 'on' && theme === 'dark' ? colorConfigs[colorType].neon : colorConfigs[colorType].clearNeon)};
  --cyber-button-edge-end: ${({ theme, neon, colorType = 'primary', borderColor }) => borderColor ||
    (neon === 'on' && theme === 'dark' ? colorConfigs[colorType].clearNeon : colorConfigs[colorType].neon)};
  position: relative;
  width: ${({ width }) => framedSize(width, 'fit-content')};
  min-width: ${({ width }) => width ? '0' : '115px'};
  max-width: 100%;
  height: auto;
  min-height: ${({ height }) => framedSize(height, '65px')};
  box-sizing: border-box;
  background: transparent;
  border: none;
  padding: 7.5px;
  margin: 0;
  border-radius: 8px;
  display: inline-grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  overflow: visible;
  cursor: default;
  opacity: ${({ $disabled }) => $disabled ? 0.58 : 1};
  pointer-events: ${({ $disabled }) => $disabled ? 'none' : 'auto'};
  transition: opacity 180ms ease;
`;

const frameLayer = css`
  // SVGs must not contribute their intrinsic 300px width to fit-content buttons.
  position: absolute;
  grid-area: 1 / 1 / 2 / 2;
  inset: 0;
  width: 100%;
  height: 100%;
  min-width: 0;
  pointer-events: none;
  overflow: visible;
  fill: none;
  stroke-width: 2px;
  stroke-linejoin: round;
`;

export const ButtonBoxShadow = styled.svg<Props>`
  ${frameLayer}
  z-index: 0;
  visibility: ${({ neon }) => neon === 'on' ? 'visible' : 'hidden'};
  stroke: var(--cyber-button-edge-start);
  filter: drop-shadow(0 0 4px var(--cyber-button-edge-start))
    drop-shadow(0 0 8px var(--cyber-button-edge-start));
`;

export const ButtonClipBorder = styled.svg<Props>`
  ${frameLayer}
  z-index: 3;
`;

export const ButtonContentContainer = styled.button<Props>`
  position: relative;
  grid-area: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: auto;
  min-width: 0;
  min-height: ${({ height }) => !height || ['auto', 'fit-content'].includes(height) ? '50px' : height};
  box-sizing: border-box;
  border-radius: 8px;
  border: none;
  background-color: ${({ backgroundColor }) => backgroundColor || '#0004'};
  clip-path: ${({ $facePath }) => $facePath ? `path('${$facePath}')` : 'none'};
  z-index: 2;
  padding: 10px 12px;
  font-family: 'Cyberpunk Is Not Dead', sans-serif;
  font-size: 12px;
  line-height: 1.35;
  white-space: normal;
  overflow-wrap: anywhere;
  text-transform: uppercase;
  color: ${({ textColor, colorType = 'primary', neon }) =>
    textColor || (neon === 'on' ? colorConfigs[colorType].textNeon : colorConfigs[colorType].text)};
  transition: all 0.5s ease;
  overflow: hidden;
  cursor: pointer;

  svg {
    color: currentColor;
    vertical-align: middle;
  }

  &:not(:disabled):hover {
    color: var(--black);
    background: ${({ colorType = 'primary' }) => colorConfigs[colorType].hover};
  }

  &:disabled {
    cursor: wait;
  }
`;

// The controller's padding reserves the same glow space at every viewport size.
export const cyberButtonsFillWidth = css`
  > ${ButtonClipController} { width: 100%; min-width: 0; }
  > ${ButtonClipController} > ${ButtonBoxShadow},
  > ${ButtonClipController} > ${ButtonClipBorder},
  > ${ButtonClipController} > ${ButtonContentContainer} {
    width: 100%;
  }
`;

/** Paired actions stay on one row on desktop; wrapped mobile rows fill their width. */
export const cyberButtonActionRow = css`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  min-width: 0;
  gap: 12px;
  > ${ButtonClipController} { flex: 0 1 auto; min-width: 0; }

  @media (max-width: 768px) {
    flex-wrap: wrap;
    > ${ButtonClipController} { flex: 1 1 auto; width: 100%; }
  }
`;
