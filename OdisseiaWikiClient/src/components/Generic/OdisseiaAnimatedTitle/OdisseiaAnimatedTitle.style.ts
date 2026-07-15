import styled, { keyframes } from 'styled-components';

interface TitleStyleProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

const drawOutline = keyframes`
  0% {
    stroke-dasharray: 0 160;
    opacity: 1;
  }
  92% {
    stroke-dasharray: 160 0;
    opacity: 1;
  }
  100% {
    stroke-dasharray: 160 0;
    opacity: 0;
  }
`;

const revealFill = keyframes`
  0%, 86% { opacity: 0; }
  100% { opacity: 1; }
`;

const getTitleColor = ({ theme, neon }: TitleStyleProps) => {
  if (theme === 'light') return neon === 'on' ? 'var(--neonViolet)' : 'var(--deepneonViolet)';
  return neon === 'on' ? 'var(--clearneonBlue)' : 'var(--whitesmoke)';
};

export const AnimatedTitleSvg = styled.svg<TitleStyleProps>`
  width: clamp(240px, 22vw, 340px);
  height: clamp(38px, 3.5vw, 54px);
  display: block;
  overflow: visible;

  .title-text {
    font-family: 'DO Futuristic', sans-serif;
    font-size: 30px;
    font-weight: 100;
    letter-spacing: 3px;
    text-anchor: start;
  }

  .title-outline {
    fill: transparent;
    stroke: ${getTitleColor};
    stroke-width: 1px;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 0 160;
    opacity: 0;
    animation: ${drawOutline} 3s linear forwards;
  }

  .title-fill {
    fill: ${getTitleColor};
    opacity: 0;
    animation: ${revealFill} 3s ease-out forwards;
  }

  @media (max-width: 768px) {
    width: 220px;
    height: 35px;
  }

  @media (max-width: 480px) {
    width: 190px;
    height: 30px;
  }

  @media (prefers-reduced-motion: reduce) {
    .title-outline,
    .title-fill {
      animation: none;
    }

    .title-outline {
      opacity: 0;
    }

    .title-fill {
      opacity: 1;
    }
  }
`;
