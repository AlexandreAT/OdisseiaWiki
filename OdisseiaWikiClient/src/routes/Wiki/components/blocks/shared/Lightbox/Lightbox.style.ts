import styled from 'styled-components';

export const LightboxOverlay = styled.div<{ $backgroundImage?: string }>`
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 16px;
  isolation: isolate;
  overflow: hidden;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 12px;
  }

  &::before,
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &::before {
    background-image: url(${props => props.$backgroundImage ? `'${props.$backgroundImage}'` : 'none'});
    background-size: cover;
    background-position: center;
    filter: blur(18px);
    transform: scale(1.08);
    z-index: -2;
  }

  &::after {
    background: rgba(0, 0, 0, 0.72);
    z-index: -1;
  }

  @media (prefers-reduced-motion: reduce) {
    &::before {
      filter: none;
      transform: none;
    }
  }
`;

export const LightboxContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: fit-content;
  max-width: 90vw;
  max-height: 90vh;
  min-height: 0;
  background-color: #1a1a1a;
  border: 2px solid #333;
  border-radius: 12px;
  padding: 16px;
  position: relative;
  z-index: 1;
  box-sizing: border-box;

  @media (max-width: 768px) {
    max-width: calc(100vw - 24px);
    max-height: calc(100dvh - 24px);
    padding: 10px;
  }
`;

export const LightboxImage = styled.img`
  display: block;
  max-width: min(82vw, 1100px);
  max-height: 76vh;
  min-height: 0;
  object-fit: contain;
  border-radius: 8px;
  width: auto;

  @media (max-width: 768px) {
    max-width: 100%;
    max-height: calc(100dvh - 48px);
  }

  @media (max-width: 480px) {
    max-width: 100%;
  }
`;

export const LightboxCaption = styled.p`
  margin: 0;
  font-size: 13px;
  color: var(--whitesmoke);
  text-align: center;
  padding: 4px 0;
`;

export const LightboxTopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  min-height: 20px;
`;

export const LightboxCloseButton = styled.button`
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  background-color: rgba(0, 0, 0, 0.45);
  border: 1px solid var(--clearneonBlue);
  border-radius: 6px;
  color: var(--clearneonBlue);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(0, 212, 255, 0.12);
    box-shadow: 0 0 10px var(--clearneonBlue);
    color: var(--neonBlue);
  }

  svg {
    display: block;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  @media (max-width: 600px) {
    top: 14px;
    right: 14px;
  }
`;

export const LightboxCounter = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-family: 'Cyberpunk Is Not Dead', sans-serif;
  letter-spacing: 1px;
`;

export const LightboxNavButton = styled.button<{ $side: 'left' | 'right'; disabled?: boolean }>`
  position: fixed;
  top: 50%;
  ${({ $side }) => ($side === 'left' ? 'left: 24px;' : 'right: 24px;')}
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  padding: 8px;
  transform: translateY(-50%);
  background-color: rgba(0, 0, 0, 0.45);
  border: 1px solid var(--clearneonBlue);
  border-radius: 50%;
  color: var(--clearneonBlue);
  font-size: 28px;
  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
  transition: all 0.2s ease;
  opacity: ${({ disabled }) => (disabled ? 0.3 : 1)};

  &:not(:disabled):hover {
    background-color: rgba(0, 212, 255, 0.12);
    box-shadow: 0 0 10px var(--clearneonBlue);
    color: var(--neonBlue);
  }

  &:active {
    transform: translateY(-50%) scale(0.95);
  }

  &:disabled {
    pointer-events: none;
  }

  svg {
    display: block;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  @media (max-width: 600px) {
    ${({ $side }) => ($side === 'left' ? 'left: 10px;' : 'right: 10px;')}
    width: 36px;
    height: 36px;
    font-size: 24px;
  }
`;

export const LightboxError = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 40px;
  font-size: 14px;
`;
