import styled, { css } from "styled-components";

interface DropdownProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  focus?: boolean;
  error?: boolean;
}

interface DisplayProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  focus?: boolean;
  error?: boolean;
}

export const CheckListDropdown = styled.div<DropdownProps>`
  position: absolute;
  top: calc(100% + 2px);
  min-width: 100%;
  width: fit-content;
  z-index: 9999;
  max-height: 200px;
  overflow-y: auto;
  background-color: rgba(0, 0, 0, 0.9);
  border: 2px solid var(--black-blue);
  border-radius: 7px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);

  ${({ theme, neon }) =>
    neon === 'on' &&
    css`
      border-color: ${theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--clearneonPink)'};
    `}
`;

export const CheckListContainer = styled.div`
  padding: 8px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &:last-child {
    border-bottom: none;
  }
`;

export const CheckDisplay = styled.div<DisplayProps & { height?: string }>`
  padding: 25px 10px 10px;
  min-height: ${({ height }) => height || '54.2px'};
  border-radius: 7px;
  cursor: pointer;
  background-color: ${({ theme, neon }) =>
        theme === 'dark' 
            ? 'var(--blackTransp)'
            : neon === 'on' 
                ? 'var(--clearWhite)'
                : 'var(--clearblack)'};
  border: 2px solid var(--black-blue);
  box-shadow: 0 0 1px 1px rgba(50,50,50,0.8);
  transition: border 0.2s, box-shadow 0.2s;

  ${({ focus, theme, neon }) =>
    focus &&
    css`
      border-color: ${neon === 'on' ? (theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--clearneonPink)') : 'var(--black-blue)'};
      box-shadow: ${neon === 'on'
        ? theme === 'dark'
          ? '0 0 10px 1px var(--clearneonBlue), inset 0 0 10px 1px var(--clearneonBlue)'
          : '0 0 10px 1px var(--clearneonPink), inset 0 0 10px 1px var(--clearneonPink)'
        : '0 0 1px 1px rgba(50,50,50,0.8)'};
    `}

  ${({ error }) =>
    error &&
    css`
      border-color: var(--clearneonRed);
      box-shadow: 0 0 10px 2px var(--neonRed), 0 0 20px 1px var(--neonBlue);
    `}
`;