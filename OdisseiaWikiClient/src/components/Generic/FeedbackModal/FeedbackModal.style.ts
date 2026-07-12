import styled from 'styled-components';

export type FeedbackModalType = 'success' | 'alert' | 'error';

const palette = {
  success: 'var(--clearneonGreen)',
  alert: 'var(--clearneonYellow)',
  error: 'var(--clearneonRed)',
} as const;

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.78);
`;

export const Sheet = styled.div<{ $type: FeedbackModalType }>`
  width: min(100%, 460px);
  padding: 24px;
  border: 2px solid ${({ $type }) => palette[$type]};
  border-radius: 8px;
  background: var(--lightBlack);
  box-shadow: 0 0 18px ${({ $type }) => palette[$type]};
  color: var(--clearWhite);
`;

export const Header = styled.div<{ $type: FeedbackModalType }>`
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${({ $type }) => palette[$type]};

  .icon {
    font-size: 28px;
  }
`;

export const Title = styled.h2`
  margin: 0;
  font-family: 'DO Futuristic', sans-serif;
  font-size: 1.2rem;
  font-weight: 100;
  letter-spacing: 2px;
`;

export const Message = styled.p`
  margin: 18px 0 24px;
  color: var(--whitesmoke);
  line-height: 1.5;
`;

export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

export const ActionButton = styled.button<{ $type: FeedbackModalType; $secondary?: boolean }>`
  min-width: 110px;
  padding: 10px 14px;
  border: 1px solid ${({ $type }) => palette[$type]};
  border-radius: 5px;
  cursor: pointer;
  font-family: 'DO Futuristic', sans-serif;
  letter-spacing: 1px;
  color: ${({ $type, $secondary }) => $secondary ? palette[$type] : 'var(--black)'};
  background: ${({ $type, $secondary }) => $secondary ? 'transparent' : palette[$type]};

  &:hover {
    box-shadow: 0 0 10px ${({ $type }) => palette[$type]};
  }
`;
