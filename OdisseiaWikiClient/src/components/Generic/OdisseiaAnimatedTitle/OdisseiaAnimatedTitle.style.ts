import styled, { css, keyframes } from 'styled-components';

interface TitleStyleProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  $wide?: boolean;
  $compact?: boolean;
}

const drawOutline = keyframes`
  0% {
    stroke-dasharray: 0 160;
    opacity: 1;
  }
  94% {
    stroke-dasharray: 160 0;
    opacity: 1;
  }
  100% {
    stroke-dasharray: 160 0;
    opacity: 0;
  }
`;

const revealFill = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const getTitleColor = ({ theme, neon }: TitleStyleProps) => {
  if (theme === 'light') return neon === 'on' ? 'var(--neonViolet)' : 'var(--deepneonViolet)';
  return neon === 'on' ? 'var(--clearneonBlue)' : 'var(--whitesmoke)';
};

export const AnimatedTitleSvg = styled.svg<TitleStyleProps>`
  width: ${({ $wide, $compact }) => $compact ? 'min(100%, 320px)' : $wide ? 'min(88vw, 1100px)' : 'clamp(240px, 22vw, 340px)'};
  height: ${({ $wide, $compact }) => $compact ? '30px' : $wide ? 'clamp(52px, 8vw, 92px)' : 'clamp(38px, 3.5vw, 54px)'};
  display: block;
  overflow: visible;

  .title-text {
    font-family: 'DO Futuristic', sans-serif;
    font-size: 30px;
    font-weight: 100;
    letter-spacing: ${({ $compact }) => $compact ? '1px' : '3px'};
    text-anchor: ${({ $wide, $compact }) => $wide && !$compact ? 'middle' : 'start'};
  }

  .title-outline {
    fill: transparent;
    stroke: ${getTitleColor};
    stroke-width: ${({ $wide }) => $wide ? '1.25px' : '1px'};
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 0 160;
    stroke-dashoffset: 0;
    opacity: 0;
    animation: ${({ $wide, $compact }) => $compact
      ? css`${drawOutline} 1.5s ease-out forwards`
      : $wide ? css`${drawOutline} 5.6s linear forwards` : css`${drawOutline} 4.1s linear forwards`};
  }

  .title-fill {
    fill: ${getTitleColor};
    opacity: 0;
    animation: ${({ $wide, $compact }) => $compact
      ? css`${revealFill} 180ms ease-out 1.35s forwards`
      : $wide ? css`${revealFill} 90ms linear 5.22s forwards` : css`${revealFill} 320ms ease-out 3.85s forwards`};
  }

  @media (max-width: 768px) {
    width: ${({ $wide, $compact }) => $compact ? 'min(100%, 320px)' : $wide ? '86vw' : '220px'};
    height: ${({ $wide, $compact }) => $compact ? '30px' : $wide ? '58px' : '35px'};
  }

  @media (max-width: 480px) {
    width: ${({ $wide, $compact }) => $compact ? 'min(100%, 300px)' : $wide ? '90vw' : '190px'};
    height: ${({ $wide, $compact }) => $compact ? '28px' : $wide ? '46px' : '30px'};
  }

  :root[data-motion='reduced'] & {
    .title-outline { animation: none; }
    .title-fill { animation: none; opacity: 1; }
  }
`;
