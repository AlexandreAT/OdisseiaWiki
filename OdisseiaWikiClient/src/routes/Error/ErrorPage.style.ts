import styled, { keyframes } from 'styled-components';

const errorPulse = keyframes`
  0%, 100% { filter: drop-shadow(0 0 5px rgba(255, 45, 85, 0.45)); }
  50% { filter: drop-shadow(0 0 14px rgba(255, 45, 85, 0.8)); }
`;

export const ErrorPageContainer = styled.main`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: calc(100svh - 84px);
  padding: 32px 20px;
  box-sizing: border-box;
  background:
    radial-gradient(circle at 50% 35%, rgba(0, 212, 255, 0.09), transparent 42%),
    var(--black-blue);

  @media (max-width: 1100px) {
    min-height: calc(100svh - 66px);
  }

  @media (max-width: 768px) {
    min-height: calc(100svh - 54px);
    padding: 24px 12px;
  }
`;

export const ErrorPanel = styled.section`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(100%, 620px);
  padding: clamp(28px, 6vw, 56px);
  box-sizing: border-box;
  overflow: hidden;
  border: 1px solid rgba(0, 212, 255, 0.5);
  border-radius: 10px;
  background: rgba(0, 8, 18, 0.82);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.45), inset 0 0 24px rgba(0, 212, 255, 0.05);
  text-align: center;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 38%;
    height: 2px;
    background: var(--clearneonPink);
    box-shadow: 0 0 8px var(--clearneonPink);
  }
`;

export const ErrorIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(72px, 11vw, 100px);
  height: clamp(72px, 11vw, 100px);
  color: var(--clearneonPink);
  animation: ${errorPulse} 2.4s ease-in-out infinite;

  svg {
    width: 100%;
    height: 100%;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const ErrorTitle = styled.h1`
  margin: 18px 0 0;
  color: var(--whitesmoke) !important;
  font-family: 'DO Futuristic', sans-serif;
  font-size: clamp(24px, 4vw, 38px);
  font-weight: 100;
  letter-spacing: 2px;
  line-height: 1.2;
  overflow-wrap: anywhere;
`;

export const ErrorDescription = styled.p`
  max-width: 500px;
  margin: 14px 0 0;
  color: rgba(245, 245, 245, 0.76) !important;
  font-size: clamp(14px, 2vw, 17px);
  line-height: 1.6;
  overflow-wrap: anywhere;
`;

export const ErrorActions = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
  margin-top: 28px;
`;

export const ErrorActionButton = styled.button<{ $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 9px 16px;
  border: 1px solid ${({ $primary }) => $primary ? 'var(--clearneonBlue)' : 'rgba(255, 255, 255, 0.35)'};
  border-radius: 5px;
  background: ${({ $primary }) => $primary ? 'rgba(0, 212, 255, 0.14)' : 'rgba(255, 255, 255, 0.05)'};
  color: var(--whitesmoke);
  font-family: 'Cyberpunk Is Not Dead', sans-serif;
  font-size: 13px;
  letter-spacing: 0.7px;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover,
  &:focus-visible {
    outline: none;
    transform: translateY(-2px);
    border-color: var(--clearneonBlue);
    background: rgba(0, 212, 255, 0.2);
  }

  @media (max-width: 480px) {
    flex: 1 1 130px;
    padding-inline: 10px;
    font-size: 12px;
  }
`;
