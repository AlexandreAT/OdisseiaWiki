import styled from 'styled-components';

interface ThemeProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const FloatingActions = styled.div`
  position: fixed;
  right: 18px;
  bottom: 84px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 12000;

  @media (max-width: 1100px) {
    right: 10px;
    top: auto;
    bottom: 78px;
    width: auto;
    flex-direction: column;
    justify-content: flex-start;
    order: initial;
    z-index: 12000;
  }

  @media (max-width: 768px) {
    gap: 6px;
    right: max(8px, env(safe-area-inset-right));
    bottom: max(72px, calc(env(safe-area-inset-bottom) + 64px));
  }
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

  @media (max-width: 768px) {
    width: 34px;
    height: 34px;

    .icon {
      font-size: 17px;
    }
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

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    padding: 7px;

    .icon {
      font-size: 17px;
    }
  }
`;
