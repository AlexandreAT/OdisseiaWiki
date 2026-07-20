import styled, { css, keyframes } from 'styled-components';

interface TitleStyleProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  $wide?: boolean;
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

const drawWideOutline = keyframes`
  0% {
    stroke-dasharray: 1200;
    stroke-dashoffset: 1200;
    opacity: 1;
  }
  94% {
    stroke-dasharray: 1200;
    stroke-dashoffset: 0;
    opacity: 1;
  }
  100% {
    stroke-dasharray: 1200;
    stroke-dashoffset: 0;
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
  width: ${({ $wide }) => ($wide ? 'min(88vw, 1100px)' : 'clamp(240px, 22vw, 340px)')};
  height: ${({ $wide }) => ($wide ? 'clamp(52px, 8vw, 92px)' : 'clamp(38px, 3.5vw, 54px)')};
  display: block;
  overflow: visible;

  .title-text {
    font-family: 'DO Futuristic', sans-serif;
    font-size: 30px;
    font-weight: 100;
    letter-spacing: 3px;
    text-anchor: ${({ $wide }) => $wide ? 'middle' : 'start'};
  }

  .title-outline {
    fill: transparent;
    stroke: ${getTitleColor};
    stroke-width: ${({ $wide }) => $wide ? '1.25px' : '1px'};
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: ${({ $wide }) => $wide ? '1200' : '0 160'};
    stroke-dashoffset: ${({ $wide }) => $wide ? '1200' : '0'};
    opacity: 0;
    animation: ${({ $wide }) => $wide
      ? css`${drawWideOutline} 4.1s linear forwards`
      : css`${drawOutline} 4.1s linear forwards`};
  }

  .title-fill {
    fill: ${getTitleColor};
    opacity: 0;
    animation: ${revealFill} 320ms ease-out 3.85s forwards;
  }

  @media (max-width: 768px) {
    width: ${({ $wide }) => ($wide ? '86vw' : '220px')};
    height: ${({ $wide }) => ($wide ? '58px' : '35px')};
  }

  @media (max-width: 480px) {
    width: ${({ $wide }) => ($wide ? '90vw' : '190px')};
    height: ${({ $wide }) => ($wide ? '46px' : '30px')};
  }
`;
