import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

export const NoticeWrapper = styled.div<{ $error: boolean }>`
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 100000;
  display: flex;
  align-items: center;
  gap: 12px;
  width: min(430px, calc(100vw - 40px));
  padding: 12px 14px;
  box-sizing: border-box;
  border: 1px solid ${({ $error }) => ($error ? 'var(--clearneonPink)' : 'var(--clearneonBlue)')};
  border-radius: 7px;
  background: rgba(0, 8, 18, 0.94);
  box-shadow: 0 0 18px ${({ $error }) => ($error ? 'rgba(255, 0, 140, 0.28)' : 'rgba(0, 212, 255, 0.25)')};
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  @media (max-width: 768px) {
    right: 12px;
    bottom: 12px;
    width: calc(100vw - 24px);
    gap: 9px;
    padding: 10px;
  }
`;

export const NoticeSpinner = styled.span`
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  border: 3px solid rgba(0, 212, 255, 0.22);
  border-top-color: var(--clearneonBlue);
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

export const NoticeContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  gap: 2px;

  strong {
    color: var(--whitesmoke);
    font-size: 14px;
  }

  span {
    color: rgba(255, 255, 255, 0.72) !important;
    font-size: 12px;
    line-height: 1.35;
  }
`;

export const NoticeAction = styled.button`
  flex: 0 0 auto;
  padding: 8px 10px;
  border: 1px solid var(--clearneonBlue);
  border-radius: 4px;
  background: rgba(0, 212, 255, 0.1);
  color: var(--whitesmoke);
  font-size: 12px;

  &:focus-visible {
    outline: 2px solid var(--clearneonYellow);
    outline-offset: 2px;
  }

  @media (max-width: 480px) {
    padding: 7px 8px;
    font-size: 11px;
  }
`;
