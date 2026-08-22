import styled, { css } from 'styled-components';

interface ThemeProps {
  $theme: 'dark' | 'light';
  $neon: boolean;
}

export const VisibilityRoot = styled.section<ThemeProps>`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  color: ${({ $theme }) => $theme === 'dark' ? 'var(--whitesmoke)' : 'var(--deepgray)'};
`;

export const VisibilityModalTitle = styled.span<ThemeProps>`
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  color: ${({ $theme }) => $theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--neonViolet)'};
  font-family: 'DO Futuristic', sans-serif;
  font-size: clamp(17px, 2vw, 23px);
  font-weight: 500;
  letter-spacing: 0.05em;
  line-height: 1.1;
  text-transform: uppercase;

  svg {
    flex: 0 0 auto;
  }

  strong {
    overflow: hidden;
    color: inherit;
    font: inherit;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  ${({ $neon, $theme }) => $neon && css`
    text-shadow: 0 0 7px ${$theme === 'dark' ? 'var(--neonBlue)' : 'var(--neonViolet)'};
  `}
`;

export const Intro = styled.p<Pick<ThemeProps, '$theme'>>`
  margin: 0;
  color: ${({ $theme }) => $theme === 'dark' ? 'var(--lightGrey)' : 'var(--grey)'};
  font-size: 0.88rem;
  line-height: 1.5;
`;

export const Toolbar = styled.div<ThemeProps>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid ${({ $theme }) => $theme === 'dark' ? 'rgba(77, 238, 234, 0.34)' : 'rgba(121, 45, 255, 0.28)'};
  border-radius: 5px;
  background: ${({ $theme }) => $theme === 'dark' ? 'rgba(0, 18, 32, 0.5)' : 'rgba(121, 45, 255, 0.045)'};
`;

export const ToolbarLabel = styled.span<Pick<ThemeProps, '$theme'>>`
  color: ${({ $theme }) => $theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--neonViolet)'};
  font-size: 0.8rem;
  font-weight: 700;
`;

export const ToolbarActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const BulkAction = styled.button<ThemeProps & { $primary?: boolean }>`
  min-height: 32px;
  padding: 6px 9px;
  border: 1px solid ${({ $primary, $theme }) => $primary
    ? ($theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--neonViolet)')
    : ($theme === 'dark' ? 'var(--lightGrey)' : 'var(--grey)')};
  border-radius: 4px;
  background: ${({ $primary, $theme }) => $primary
    ? ($theme === 'dark' ? 'rgba(0, 217, 255, 0.1)' : 'rgba(121, 45, 255, 0.09)')
    : 'transparent'};
  color: ${({ $primary, $theme }) => $primary
    ? ($theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--neonViolet)')
    : ($theme === 'dark' ? 'var(--lightGrey)' : 'var(--deepgray)')};
  cursor: pointer;
  font: inherit;
  font-size: 0.76rem;
  font-weight: 700;
  transition: background-color 160ms ease, box-shadow 160ms ease, color 160ms ease;

  &:hover:not(:disabled),
  &:focus-visible:not(:disabled) {
    outline: 0;
    background: ${({ $theme }) => $theme === 'dark' ? 'rgba(0, 217, 255, 0.16)' : 'rgba(121, 45, 255, 0.14)'};
    box-shadow: ${({ $neon, $theme }) => $neon
      ? `0 0 7px ${$theme === 'dark' ? 'var(--neonBlue)' : 'var(--neonViolet)'}`
      : 'none'};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const VisibilityGroup = styled.fieldset<ThemeProps>`
  min-width: 0;
  margin: 0;
  padding: 12px;
  border: 1px solid ${({ $theme }) => $theme === 'dark' ? 'rgba(189, 189, 189, 0.28)' : 'rgba(44, 44, 44, 0.2)'};
  border-radius: 5px;

  legend {
    padding: 0 7px;
    color: ${({ $theme }) => $theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--neonViolet)'};
    font-family: 'Cyberpunk Is Not Dead', sans-serif;
    font-size: 0.81rem;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }
`;

export const VisibilityOptions = styled.div<{ $saving: boolean }>`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 9px;
  pointer-events: ${({ $saving }) => $saving ? 'none' : 'auto'};

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 540px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const VisibilityOption = styled.div<ThemeProps & { $visible: boolean }>`
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 8px;
  border: 1px solid ${({ $visible, $theme }) => $visible
    ? ($theme === 'dark' ? 'rgba(0, 217, 255, 0.42)' : 'rgba(121, 45, 255, 0.42)')
    : ($theme === 'dark' ? 'rgba(189, 189, 189, 0.2)' : 'rgba(44, 44, 44, 0.16)')};
  border-radius: 5px;
  background: ${({ $visible, $theme }) => $visible
    ? ($theme === 'dark' ? 'rgba(0, 217, 255, 0.055)' : 'rgba(121, 45, 255, 0.045)')
    : ($theme === 'dark' ? 'rgba(0, 0, 0, 0.11)' : 'rgba(44, 44, 44, 0.025)')};
  transition: border-color 160ms ease, background-color 160ms ease;

  > div {
    min-height: 26px;
    padding: 2px;
  }
`;

export const VisibilityOptionDescription = styled.small<Pick<ThemeProps, '$theme'>>`
  display: block;
  margin: 5px 3px 0;
  color: ${({ $theme }) => $theme === 'dark' ? 'var(--lightGrey)' : 'var(--grey)'};
  font-size: 0.72rem;
  line-height: 1.32;
`;

export const LoadingState = styled.div<Pick<ThemeProps, '$theme'>>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  color: ${({ $theme }) => $theme === 'dark' ? 'var(--lightGrey)' : 'var(--grey)'};
`;

export const ErrorState = styled.div`
  padding: 10px 12px;
  border: 1px solid var(--neonRed);
  border-radius: 4px;
  background: rgba(210, 39, 48, 0.08);
  color: var(--clearneonRed);
  font-size: 0.84rem;
  line-height: 1.4;
`;

export const ModalFooter = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
`;
