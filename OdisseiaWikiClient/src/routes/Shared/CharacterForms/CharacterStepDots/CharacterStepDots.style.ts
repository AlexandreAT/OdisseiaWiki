import styled from 'styled-components';

interface ThemeProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const StepDotsAnchor = styled.div<{ right?: string }>`
  position: absolute;
  top: 24px;
  right: ${({ right }) => right || '-46px'};
  z-index: 12;
`;

export const StepDotsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const StepDot = styled.button<ThemeProps & { active: boolean }>`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
  border: 1.5px solid ${({ theme, neon }) =>
    theme === 'dark'
      ? neon === 'on'
        ? 'var(--clearneonBlue)'
        : 'var(--lightBlack)'
      : neon === 'on'
        ? 'var(--neonViolet)'
        : 'var(--lightGrey)'};

  background: ${({ active, theme, neon }) =>
    active
      ? theme === 'dark'
        ? neon === 'on'
          ? 'var(--neonBlue)'
          : 'var(--lightGrey)'
        : neon === 'on'
          ? 'var(--neonViolet)'
          : 'var(--deepgray)'
      : theme === 'dark'
        ? 'var(--mediumgrey)'
        : 'var(--whitesmoke)'};

  box-shadow: ${({ active, theme, neon }) =>
    active && neon === 'on'
      ? `0 0 6px ${theme === 'dark' ? 'var(--neonBlue)' : 'var(--neonViolet)'}`
      : 'none'};
  transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.15s ease;

  &:hover {
    transform: scale(1.04);
  }
`;
