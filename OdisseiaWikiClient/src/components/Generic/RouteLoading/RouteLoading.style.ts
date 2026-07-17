import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-3px); }
`;

export const LoadingWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 55vh;
  color: var(--whitesmoke);
  font-family: 'DO Futuristic', sans-serif;
  font-size: clamp(15px, 2vw, 21px);
  letter-spacing: 2px;
`;

export const LoadingDots = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const LoadingDot = styled.span`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--clearneonBlue);
  box-shadow: 0 0 7px var(--clearneonBlue);
  animation: ${pulse} 1s ease-in-out infinite;

  &:nth-child(2) { animation-delay: 0.14s; }
  &:nth-child(3) { animation-delay: 0.28s; }
`;
