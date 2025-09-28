import styled from 'styled-components';

interface Props {
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
    width?: string;
    height?: string;
    borderRadius?: string;
    type?: 'primary' | 'secondary';
    innerOffset?: string;
    doubleCut?: boolean;
    zIndex?: number;
}

const getBlue = (type?: 'primary' | 'secondary') => type === 'secondary' ? 'var(--clearneonPink)' : 'var(--clearneonBlue)';
const getPink = (type?: 'primary' | 'secondary') => type === 'secondary' ? 'var(--clearneonBlue)' : 'var(--clearneonPink)';
const getNeonBlue = (type?: 'primary' | 'secondary') => type === 'secondary' ? 'var(--neonPink)' : 'var(--neonBlue)';
const getNeonPink = (type?: 'primary' | 'secondary') => type === 'secondary' ? 'var(--neonBlue)' : 'var(--neonPink)';

export const ClipController = styled.div<Props & { autoSize?: boolean }>`
    width: ${({ width, autoSize }) => (autoSize ? 'auto' : width || '820px')};
    height: ${({ height, autoSize }) => (autoSize ? 'auto' : height || '520px')};

    padding: ${({ autoSize }) => (autoSize ? '20px' : '0')};

    position: relative;
    background-color: transparent;
    border-radius: ${({ borderRadius }) => borderRadius || '8px'};
    clip-path: ${({ doubleCut }) =>
        doubleCut
            ? 'polygon(0 0, 83.5% 0, 100% 29%, 100% 100%, 18.5% 100%, 0% 68.5%, 0 100%)'
            : 'polygon(0 0, 100% 0, 100% 100%, 16% 100%, 0% 73.5%, 0 100%)'
    };
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: ${({ zIndex }) => (zIndex !== undefined ? zIndex : -2)};
`;

const getInnerSize = (calcSize?: string, offset = '20px', fallback = '800px') => {
  if (!calcSize) return fallback;
  return `calc(${calcSize} - ${offset})`;
};

export const BoxShadow = styled.div<Props & { autoSize?: boolean }>`
  width: ${({ width, innerOffset, autoSize }) =>
    autoSize ? 'calc(100% - 40px)' : getInnerSize(width, innerOffset || '20px', '800px')};
  height: ${({ height, innerOffset, autoSize }) =>
    autoSize ? 'calc(100% - 40px)' : getInnerSize(height, innerOffset || '20px', '500px')};

  background-color: transparent;
  border-radius: ${({ borderRadius }) => borderRadius || '8px'};
  box-shadow: ${({ theme, neon, type }) =>
    neon === 'on'
      ? theme === 'light'
        ? `0 0 10px ${getPink(type)}, inset 0 0 20px ${getPink(type)}`
        : `0 0 10px ${getNeonBlue(type)}, inset 0 0 20px ${getNeonBlue(type)}`
      : 'none'};
  position: absolute;
  z-index: 0;
`;

export const ClipBorder = styled.div<Props & { autoSize?: boolean }>`
  width: ${({ width, innerOffset, autoSize }) =>
    autoSize ? 'calc(100% - 40px)' : getInnerSize(width, innerOffset || '20px', '800px')};
  height: ${({ height, innerOffset, autoSize }) =>
    autoSize ? 'calc(100% - 40px)' : getInnerSize(height, innerOffset || '20px', '500px')};

  position: absolute;
  background: ${({ theme, neon, type }) =>
    neon === 'on'
      ? theme === 'light'
        ? `linear-gradient(45deg, ${getPink(type)}, ${getBlue(type)})`
        : `linear-gradient(45deg, ${getBlue(type)}, ${getPink(type)})`
      : theme === 'light'
        ? `linear-gradient(45deg, ${getPink(type)}, ${getNeonPink(type)})`
        : `linear-gradient(45deg, ${getBlue(type)}, ${getNeonBlue(type)})`};
  border-radius: ${({ borderRadius }) => borderRadius || '8px'};
  z-index: -1;
  clip-path: polygon(0 75%, 15% 100%, 14.5% 100%, 0 76%);
`;

export const ClipBorderTop = styled.div<Props & { autoSize?: boolean }>`
  width: ${({ width, innerOffset, autoSize }) =>
    autoSize ? '100%' : getInnerSize(width, innerOffset || '20px', '800px')};
  height: ${({ height, innerOffset, autoSize }) =>
    autoSize ? '100%' : getInnerSize(height, innerOffset || '20px', '500px')};

  position: absolute;
  background: ${({ theme, neon, type }) =>
    neon === 'on'
      ? theme === 'light'
        ? `linear-gradient(45deg, ${getPink(type)}, ${getBlue(type)})`
        : `linear-gradient(45deg, ${getBlue(type)}, ${getPink(type)})`
      : theme === 'light'
        ? `linear-gradient(45deg, ${getPink(type)}, ${getNeonPink(type)})`
        : `linear-gradient(45deg, ${getBlue(type)}, ${getNeonBlue(type)})`};
  border-radius: ${({ borderRadius }) => borderRadius || '8px'};
  z-index: 2;
  clip-path: polygon(87% 0, 100% 0, 100% 22.5%);
`;

export const ContentContainer = styled.div<Props & { autoSize?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  width: ${({ width, innerOffset, autoSize }) =>
    autoSize ? 'auto' : getInnerSize(width, innerOffset || '20px', '800px')};
  height: ${({ height, innerOffset, autoSize }) =>
    autoSize ? 'auto' : getInnerSize(height, innerOffset || '20px', '500px')};

  border-radius: ${({ borderRadius }) => borderRadius || '8px'};
  background-color: rgba(0, 0, 10, 0.3);
  clip-path: polygon(0 0, 100% 0, 100% 100%, 15% 100%, 0% 75%, 0 100%);
  z-index: 1;
  padding: 20px;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: ${({ borderRadius }) => borderRadius || '8px'};
    clip-path: polygon(0 0, 100% 0, 100% 100%, 15% 100%, 0% 75%, 0 100%);
    background: ${({ theme, neon, type }) =>
      neon === 'on'
        ? theme === 'light'
            ? `linear-gradient(45deg, ${getPink(type)}, ${getBlue(type)})`
            : `linear-gradient(45deg, ${getBlue(type)}, ${getPink(type)})`
        : theme === 'light' 
            ? `linear-gradient(45deg, ${getPink(type)}, ${getNeonPink(type)})`
            : `linear-gradient(45deg, ${getBlue(type)}, ${getNeonBlue(type)})`
    };

    -webkit-mask: 
      linear-gradient(#fff 0 0) content-box, 
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;

    padding: 2px;
    z-index: 0;
  }
`;