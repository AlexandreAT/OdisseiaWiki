import styled, { keyframes } from 'styled-components';

const rotateLoader = keyframes`
  to { transform: rotate(360deg); }
`;

const pulseGlow = keyframes`
  0%, 100% { filter: drop-shadow(0 0 3px var(--wiki-loading-glow-color)); opacity: 0.72; }
  50% { filter: drop-shadow(0 0 10px var(--wiki-loading-glow-color)); opacity: 1; }
`;

const cycleDots = keyframes`
  0%, 20% { content: ''; }
  25%, 45% { content: '.'; }
  50%, 70% { content: '..'; }
  75%, 95% { content: '...'; }
  100% { content: ''; }
`;

export const WikiSearchLoadingWrapper = styled.div<{ $compact: boolean }>`
  --wiki-loading-glow-color: var(--clearneonBlue);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ $compact }) => ($compact ? '7px' : '18px')};
  width: 100%;
  min-width: 0;
  padding: ${({ $compact }) => ($compact ? '10px 8px' : 'clamp(36px, 5vw, 64px) 24px')};
  box-sizing: border-box;
  color: var(--wiki-loading-glow-color);

  @media (max-width: 768px) {
    gap: ${({ $compact }) => ($compact ? '7px' : '10px')};
    padding: ${({ $compact }) => ($compact ? '10px 8px' : '24px 12px')};
  }
`;

export const LoadingIcon = styled.span<{ $compact: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  color: var(--wiki-loading-glow-color) !important;
  animation: ${pulseGlow} 1.6s ease-in-out infinite;

  svg {
    width: ${({ $compact }) => ($compact ? '20px' : 'clamp(48px, 4.5vw, 68px)')};
    height: ${({ $compact }) => ($compact ? '20px' : 'clamp(48px, 4.5vw, 68px)')};
    fill: currentColor;
    animation: ${rotateLoader} 0.9s linear infinite;
    transform-box: fill-box;
    transform-origin: center;
    will-change: transform;
  }

  @media (max-width: 768px) {
    svg {
      width: ${({ $compact }) => ($compact ? '20px' : '32px')};
      height: ${({ $compact }) => ($compact ? '20px' : '32px')};
    }
  }
`;

export const LoadingText = styled.span<{ $compact: boolean }>`
  min-width: 0;
  color: var(--wiki-loading-glow-color) !important;
  font-family: 'DO Futuristic', sans-serif;
  font-size: ${({ $compact }) => ($compact ? '13px' : 'clamp(19px, 1.8vw, 26px)')};
  font-weight: 100;
  letter-spacing: ${({ $compact }) => ($compact ? '0.7px' : '1.2px')};
  overflow-wrap: anywhere;
  text-shadow: 0 0 8px var(--wiki-loading-glow-color);

  @media (max-width: 768px) {
    font-size: ${({ $compact }) => ($compact ? '13px' : '14px')};
    letter-spacing: 0.7px;
  }
`;

export const AnimatedDots = styled.span`
  display: inline-block;
  width: 1.6em;
  color: var(--wiki-loading-glow-color) !important;
  text-align: left;
  text-shadow: 0 0 8px var(--wiki-loading-glow-color);

  &::after {
    content: '';
    animation: ${cycleDots} 1.6s steps(1, end) infinite;
  }

`;
