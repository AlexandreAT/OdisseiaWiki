import styled from 'styled-components';

interface Props {
  theme?: 'light' | 'dark';
  neon?: 'on' | 'off';
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  width?: string;
  height?: string;
  colorType?: 'primary' | 'secondary';
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
    neon: 'var(--neonBlue)',
    clearNeon: 'var(--clearneonBlue)',
    text: 'var(--whitesmoke)',
    textNeon: 'var(--clearneonBlue)',
    hover: 'var(--clearneonBlue)',
  },
  secondary: {
    neon: 'var(--neonPink)',
    clearNeon: 'var(--clearneonPink)',
    text: 'var(--whitesmoke)',
    textNeon: 'var(--clearneonPink)',
    hover: 'var(--clearneonPink)',
  },
};

export const ButtonClipController = styled.div<Props>`
  position: relative;
  width: ${({ width }) => width ? `calc(${width} + 15px)` : '115px'};
  height: ${({ height }) => height ? `calc(${height} + 15px)` : '65px'};
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  border-radius: 8px;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 25% 100%, 0% 63%, 0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  cursor: default;
`;

export const ButtonBoxShadow = styled.div<Props>`
  position: absolute;
  width: ${({ width }) => width || '100px'};
  height: ${({ height }) => height || '50px'};
  border-radius: 8px;
  cursor: default;
  z-index: 0;
  box-shadow: ${({ theme = 'light', neon = 'off', colorType = 'primary' }) =>
    neon === 'on'
      ? theme === 'light'
        ? `0 0 10px ${colorConfigs[colorType].clearNeon}, inset 0 0 20px ${colorConfigs[colorType].clearNeon}`
        : `0 0 10px ${colorConfigs[colorType].neon}, inset 0 0 20px ${colorConfigs[colorType].neon}`
      : 'none'};
`;

export const ButtonClipBorder = styled.div<Props>`
  position: absolute;
  width: ${({ width }) => width || '100px'};
  height: ${({ height }) => height || '50px'};
  border-radius: 8px;
  cursor: default;
  z-index: 1;
  background: ${({ theme = 'light', neon = 'off', colorType = 'primary' }) =>
    neon === 'on'
      ? theme === 'light'
        ? `linear-gradient(45deg, ${colorConfigs[colorType].clearNeon}, ${colorConfigs[colorType].neon})`
        : `linear-gradient(45deg, ${colorConfigs[colorType].neon}, ${colorConfigs[colorType].clearNeon})`
      : theme === 'light'
        ? `linear-gradient(45deg, ${colorConfigs[colorType].clearNeon}, ${colorConfigs[colorType].neon})`
        : `linear-gradient(45deg, ${colorConfigs[colorType].clearNeon}, ${colorConfigs[colorType].neon})`};
        
  clip-path: polygon(0 70%, 18% 100%, 0% 100%, 0 0%);
`;

export const ButtonContentContainer = styled.button<Props>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ width }) => width || '100px'};
  height: ${({ height }) => height || '50px'};
  border-radius: 8px;
  border: none;
  background-color: ${({ backgroundColor }) => backgroundColor || '#0004'};
  clip-path: polygon(0 0, 100% 0, 100% 100%, 15% 100%, 0% 75%, 0 100%);
  z-index: 2;
  padding: 0 12px;
  font-family: 'Cyberpunk Is Not Dead', sans-serif;
  font-size: 12px;
  text-transform: uppercase;
  color: ${({ textColor, colorType = 'primary', neon }) =>
    textColor || (neon === 'on' ? colorConfigs[colorType].textNeon : colorConfigs[colorType].text)};
  transition: all 0.5s ease;
  overflow: hidden;
  cursor: pointer;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 8px;
    clip-path: polygon(0 0, 100% 0, 100% 100%, 15% 100%, 0% 75%, 0 100%);
    background: ${({ theme = 'light', neon = 'off', colorType = 'primary' }) =>
      neon === 'on'
        ? theme === 'light'
          ? `linear-gradient(45deg, ${colorConfigs[colorType].clearNeon}, ${colorConfigs[colorType].neon})`
          : `linear-gradient(45deg, ${colorConfigs[colorType].neon}, ${colorConfigs[colorType].clearNeon})`
        : theme === 'light'
          ? `linear-gradient(45deg, ${colorConfigs[colorType].clearNeon}, ${colorConfigs[colorType].neon})`
          : `linear-gradient(45deg, ${colorConfigs[colorType].clearNeon}, ${colorConfigs[colorType].neon})`};
    -webkit-mask: 
      linear-gradient(#fff 0 0) content-box, 
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    padding: 2px;
    z-index: 0;
    transition: all 0.5s ease;
  }

  &:hover {
    color: var(--black);
    background: ${({ colorType = 'primary' }) => colorConfigs[colorType].hover};
  }
`;