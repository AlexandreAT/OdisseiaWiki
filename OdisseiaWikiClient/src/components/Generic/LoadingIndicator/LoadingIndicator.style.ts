import styled, { keyframes } from 'styled-components';

const rotateLoader = keyframes`
  to { transform: rotate(360deg); }
`;

const pulseGlow = keyframes`
  0%, 100% { filter: drop-shadow(0 0 3px currentColor); opacity: 0.72; }
  50% { filter: drop-shadow(0 0 10px currentColor); opacity: 1; }
`;

const bounceDot = keyframes`
  0%, 60%, 100% {
    opacity: 0;
    transform: translateY(0) scale(0.72);
  }

  30% {
    opacity: 1;
    transform: translateY(-0.38em) scale(1);
  }
`;

export const LoadingWrapper = styled.span<{ $compact: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ $compact }) => ($compact ? '0' : '18px')};
  min-width: 0;
  color: var(--clearneonBlue) !important;

  @media (max-width: 768px) {
    gap: ${({ $compact }) => ($compact ? '0' : '10px')};
  }
`;

export const LoadingIcon = styled.span`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  color: inherit;
  animation: ${pulseGlow} 1.6s ease-in-out infinite;

  svg {
    width: clamp(48px, 4.5vw, 68px);
    height: clamp(48px, 4.5vw, 68px);
    fill: currentColor;
    animation: ${rotateLoader} 0.9s linear infinite;
    transform-box: fill-box;
    transform-origin: center;
  }

  @media (max-width: 768px) {
    svg {
      width: 32px;
      height: 32px;
    }
  }
`;

export const LoadingText = styled.span<{ $compact: boolean }>`
  min-width: 0;
  color: inherit !important;
  font-family: 'DO Futuristic', sans-serif;
  font-size: ${({ $compact }) => ($compact ? '0.82rem' : 'clamp(19px, 1.8vw, 26px)')};
  font-weight: 100;
  letter-spacing: ${({ $compact }) => ($compact ? '0.7px' : '1.2px')};
  overflow-wrap: anywhere;
  text-shadow: 0 0 8px currentColor;

  @media (max-width: 768px) {
    font-size: ${({ $compact }) => ($compact ? '0.82rem' : '0.95rem')};
  }
`;

export const AnimatedDots = styled.span`
  display: inline-flex;
  align-items: flex-end;
  gap: 0.16em;
  width: 1.45em;
  height: 0.8em;
  margin-left: 0.28em;
  color: inherit !important;
  vertical-align: baseline;

  > span {
    width: 0.24em;
    height: 0.24em;
    flex: 0 0 auto;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 0.38em currentColor;
    opacity: 0;
    animation: ${bounceDot} 1.2s ease-in-out infinite;
  }

  > span:nth-child(2) {
    animation-delay: 0.14s;
  }

  > span:nth-child(3) {
    animation-delay: 0.28s;
  }

  @media (prefers-reduced-motion: reduce) {
    > span {
      opacity: 0.8;
      transform: none;
      animation: none;
    }
  }
`;
