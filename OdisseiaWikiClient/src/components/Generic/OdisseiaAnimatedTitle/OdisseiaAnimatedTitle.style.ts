import styled, { keyframes } from 'styled-components';

interface TitleStyleProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

const revealFromLeft = keyframes`
  0% { clip-path: inset(0 100% 0 0); }
  99.9% { clip-path: inset(0 0 0 0); }
  100% { clip-path: none; }
`;

const getTitleColor = ({ theme, neon }: TitleStyleProps) => {
  if (theme === 'light') return neon === 'on' ? 'var(--neonViolet)' : 'var(--deepneonViolet)';
  return neon === 'on' ? 'var(--clearneonBlue)' : 'var(--whitesmoke)';
};

export const AnimatedTitleSvg = styled.svg<TitleStyleProps>`
  width: 240px;
  height: 38px;
  display: block;
  overflow: visible;

  .title-reveal {
    clip-path: inset(0 100% 0 0);
    animation: ${revealFromLeft} 2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  .title-text {
    font-family: 'DO Futuristic', sans-serif;
    font-size: 30px;
    font-weight: 100;
    letter-spacing: 3px;
    text-anchor: start;
  }

  .title-fill {
    fill: ${getTitleColor};
    opacity: 1;
  }

  @media (max-width: 768px) {
    width: 200px;
    height: 32px;
  }

  @media (max-width: 480px) {
    width: 160px;
    height: 26px;
  }

  @media (prefers-reduced-motion: reduce) {
    .title-reveal {
      animation: none;
      clip-path: none;
      opacity: 1;
    }
  }
`;
