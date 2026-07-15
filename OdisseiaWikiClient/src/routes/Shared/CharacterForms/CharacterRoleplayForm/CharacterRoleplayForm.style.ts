import styled from 'styled-components';

interface Props {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const RoleplayContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const HistoryHeader = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const HistoryEditorWrapper = styled.div<Props>`
  width: 100%;
  height: 220px;
  overflow: hidden;
  position: relative;
  border-radius: 7px;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 36px;
    pointer-events: none;
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0),
      ${({ theme }) => (theme === 'dark' ? 'rgba(0, 0, 10, 0.8)' : 'rgba(255, 255, 255, 0.9)')}
    );
    opacity: 0.8;
  }
`;

export const RaceChangeInfo = styled.span<Props>`
  margin-top: -6px;
  font-size: 0.85rem;
  color: ${({ theme }) =>
    theme === 'dark' ? 'var(--lightGrey)' : 'var(--deepgray)'};
`;
