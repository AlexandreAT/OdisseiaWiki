import styled, { keyframes, css } from 'styled-components';

interface Props {
  theme?: 'dark' | 'light';
  neon?: 'on' | 'off';
  error?: boolean;
  typeStyle?: 'primary' | 'secondary';
  width?: string;
  height?: string;
  disabled?: boolean;
}

const glitchBorder = keyframes`
  0% { border-color: var(--clearneonRed); }
  30% { border-color: var(--clearneonBlue); }
  60% { border-color: var(--clearneonPink); }
  100% { border-color: var(--clearneonRed); }
`;

const getBlue = (typeStyle?: 'primary' | 'secondary') =>
  typeStyle === 'secondary' ? 'var(--clearneonPink)' : 'var(--clearneonBlue)';
const getPink = (typeStyle?: 'primary' | 'secondary') =>
  typeStyle === 'secondary' ? 'var(--clearneonBlue)' : 'var(--clearneonPink)';

export const ContentController = styled.div<Props>`
  position: relative;
  border: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  border-radius: 7px;
  align-items: flex-start;
  width: ${({ width }) => width || `100%`};
  ${({ height }) => height && `height: ${height};`}
`;

export const Label = styled.label<Props>`
  display: block;
  position: relative;
  width: 100%;
`;

export const CustomSelect = styled.select<Props>`
  width: 100%;
  height: 100%;
  background-color: ${({ theme, neon, disabled }) =>
        disabled
            ? 'var(--black)'
            : theme === 'dark' 
                ? 'var(--blackTransp)'
                : neon === 'on' 
                    ? 'var(--clearWhite)'
                    : 'var(--clearblack)'};
  border: 2px solid var(--black-blue);
  border-radius: 7px;
  outline: none;
  font-size: 0.9em;
  padding: 25px 10px 10px;
  font-weight: 600;
  color: ${({ disabled }) => (disabled ? 'var(--black)' : 'var(--deepgrey)')};
  transition: background-color 0.2s, border 0.2s;
  box-shadow: 0 0 1px 1px rgba(50, 50, 50, 0.8);
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg fill='white' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px top 50%;
  background-size: 16px 16px;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};

  &:focus {
    background-color: var(--black-blue);
    border-color: ${({ theme, neon, typeStyle }) =>
      theme === 'dark'
        ? neon === 'on'
          ? `#fff`
          : getBlue(typeStyle)
        : neon === 'on'
        ? `#fff`
        : getPink(typeStyle)};
    ${({ theme, neon, typeStyle }) =>
      theme === 'dark'
        ? neon === 'on' &&
          `box-shadow: 0 0 10px 1px ${getBlue(typeStyle)}, inset 0 0 10px 1px ${getBlue(
            typeStyle
          )}`
        : neon === 'on' &&
          `box-shadow: 0 0 10px 1px ${getPink(typeStyle)}, inset 0 0 10px 1px ${getPink(
            typeStyle
          )}`};
  }

  ${({ error, theme }) =>
    error &&
    css`
      border: 2px solid var(--clearneonRed);
      animation: ${glitchBorder} 0.7s linear;
      animation-fill-mode: forwards;
      ${theme === 'dark'
        ? 'box-shadow: 0 0 10px 2px var(--neonRed), 0 0 20px 1px var(--neonBlue);'
        : 'box-shadow: 0 0 10px 2px var(--neonRed), 0 0 20px 1px var(--clearneonPink);'}
    `}
`;

export const LabelSpan = styled.span<{ active?: boolean; typeStyle?: 'primary' | 'secondary' }>`
  font-family: 'DO Futuristic', sans-serif;
  font-weight: 100;
  letter-spacing: 3px;
  position: absolute;
  font-size: 0.8em;
  color: var(--whitesmoke) !important;
  margin: 20px;
  left: 0;
  top: 0;
  pointer-events: none;
  cursor: text;
  transition: all 250ms ease;

  ${({ active }) =>
    active &&
    `
    font-size: 0.7em;
    margin: 8px 10px;
    color: #fff !important;
  `}
`;

export const SpanError = styled.span`
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0));
  border-radius: 4px;
  text-shadow: 1px 1px 2px var(--black);
  font-size: 12px;
  font-weight: bold;
  z-index: 1;
  color: var(--neonRed) !important;
`;
