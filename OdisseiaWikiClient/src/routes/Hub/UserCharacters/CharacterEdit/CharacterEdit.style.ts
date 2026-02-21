import styled from 'styled-components';

interface ThemeProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const FloatingActions = styled.div`
  position: fixed;
  right: 18px;
  bottom: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 12000;
`;

export const SyncIconBadge = styled.div<ThemeProps & { synced: boolean }>`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid ${({ theme, neon }) =>
    theme === 'dark'
      ? neon === 'on'
        ? 'var(--clearneonBlue)'
        : 'var(--lightBlack)'
      : neon === 'on'
        ? 'var(--neonViolet)'
        : 'var(--lightGrey)'};
  background: ${({ theme }) => theme === 'dark' ? 'var(--clearblack)' : 'var(--whitesmoke)'};
  color: ${({ synced }) => (synced ? 'var(--clearneonGreen)' : 'var(--clearneonRed)')};
  box-shadow: ${({ synced, neon }) =>
    neon === 'on'
      ? `0 0 6px ${synced ? 'var(--neonGreen)' : 'var(--neonRed)'}`
      : 'none'};
  transition: box-shadow 0.2s ease, border-color 0.2s ease;

  .icon {
    font-size: 19px;
  }
`;

export const FloatingSaveButton = styled.button<ThemeProps>`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  border: 1.5px solid ${({ theme, neon }) =>
    theme === 'dark'
      ? neon === 'on'
        ? 'var(--clearneonBlue)'
        : 'var(--lightBlack)'
      : neon === 'on'
        ? 'var(--neonViolet)'
        : 'var(--lightGrey)'};
  background: ${({ theme }) => theme === 'dark' ? 'var(--clearblack)' : 'var(--whitesmoke)'};
  color: ${({ theme, neon }) =>
    theme === 'dark'
      ? neon === 'on'
        ? 'var(--neonBlue)'
        : 'var(--clearWhite)'
      : neon === 'on'
        ? 'var(--deepneonViolet)'
        : 'var(--deepgray)'};

  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: ${({ theme, neon }) =>
      theme === 'dark'
        ? neon === 'on'
          ? 'var(--neonBlue)'
          : 'var(--clearWhite)'
        : neon === 'on'
          ? 'var(--neonViolet)'
          : 'var(--deepgray)'};
    box-shadow: ${({ neon, theme }) =>
      neon === 'on'
        ? `0 0 7px ${theme === 'dark' ? 'var(--neonBlue)' : 'var(--neonViolet)'}`
        : 'none'};
  }

  .icon {
    font-size: 18px;
  }
`;
