import styled from 'styled-components';

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
