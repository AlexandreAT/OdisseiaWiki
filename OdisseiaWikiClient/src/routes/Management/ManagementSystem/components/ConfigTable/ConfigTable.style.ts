import styled, { css } from 'styled-components';

interface ThemeProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const TableContainer = styled.section<ThemeProps>`
  width: 100%;
  min-width: 0;
  overflow: visible;
  border: 1px solid ${({ theme, neon }) => (
    neon === 'on'
      ? theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--clearneonViolet)'
      : 'var(--grey)'
  )};
  border-radius: 8px;
  background: ${({ theme }) => theme === 'dark' ? 'rgba(0, 5, 15, 0.72)' : 'rgba(255, 255, 255, 0.72)'};
  box-shadow: ${({ neon, theme }) => neon === 'on'
    ? `0 0 9px ${theme === 'dark' ? 'rgba(0, 174, 255, 0.18)' : 'rgba(145, 0, 255, 0.16)'}`
    : 'none'};
  box-sizing: border-box;

  .system-table-scroll {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    overscroll-behavior-inline: contain;
  }
`;

export const TableHeader = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--grey);

  p {
    margin: 5px 0 0;
    color: var(--lightGrey) !important;
    font-size: 12px;
    line-height: 1.45;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 12px;
  }
`;

export const TableTitle = styled.h4`
  margin: 0;
  color: var(--clearneonBlue) !important;
  font-family: 'DO Futuristic', sans-serif;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 1.5px;
`;

export const TableToolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 7px;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: flex-start;
  }
`;

export const IconAction = styled.button<{ $danger?: boolean }>`
  min-width: 30px;
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 5px 8px;
  border: 1px solid ${({ $danger }) => $danger ? 'var(--neonRed)' : 'var(--grey)'};
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.25);
  color: ${({ $danger }) => $danger ? 'var(--clearneonRed)' : 'var(--whitesmoke)'} !important;
  font-size: 11px;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;

  svg {
    width: 17px;
    height: 17px;
  }

  &:hover:not(:disabled) {
    border-color: ${({ $danger }) => $danger ? 'var(--clearneonRed)' : 'var(--clearneonBlue)'};
    color: ${({ $danger }) => $danger ? 'var(--clearneonRed)' : 'var(--clearneonBlue)'} !important;
    box-shadow: 0 0 7px ${({ $danger }) => $danger ? 'var(--neonRed)' : 'var(--neonBlue)'};
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

export const Table = styled.table`
  width: 100%;
  min-width: 780px;
  border-collapse: collapse;
  table-layout: auto;

  th,
  td {
    min-width: 112px;
    padding: 8px;
    border-bottom: 1px solid rgba(127, 127, 127, 0.25);
    vertical-align: top;
  }

  th {
    background: rgba(0, 0, 0, 0.28);
    color: var(--lightGrey) !important;
    font-family: 'DO Futuristic', sans-serif;
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 0.7px;
    text-align: center;
  }

  .actions-column {
    width: 142px;
    min-width: 142px;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

  tbody tr:hover {
    background: rgba(0, 174, 255, 0.035);
  }
`;

export const TableCellControl = styled.div<{ $error?: boolean }>`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;

  input:not([type='checkbox']),
  select,
  textarea {
    width: 100%;
    min-width: 92px;
    min-height: 34px;
    padding: 7px 8px;
    border: 1px solid ${({ $error }) => $error ? 'var(--clearneonRed)' : 'var(--grey)'};
    border-radius: 5px;
    outline: none;
    background: rgba(0, 0, 0, 0.46);
    color: var(--whitesmoke);
    font-size: 12px;
    box-sizing: border-box;

    &:focus {
      border-color: var(--clearneonBlue);
      box-shadow: 0 0 6px rgba(0, 174, 255, 0.42);
    }

    &:disabled {
      opacity: 0.72;
      cursor: default;
    }
  }

  textarea {
    min-height: 68px;
    resize: vertical;
  }

  input[type='checkbox'] {
    width: 20px;
    height: 20px;
    margin: 7px auto;
    accent-color: var(--clearneonBlue);
  }

  ${({ $error }) => $error && css`
    input:not([type='checkbox']), select, textarea {
      box-shadow: 0 0 7px rgba(255, 0, 64, 0.48);
    }
  `}
`;

export const CellError = styled.span`
  color: var(--clearneonRed) !important;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.3;
`;

export const RowActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;

  ${IconAction} {
    padding: 4px;
  }
`;

export const EmptyTable = styled.div`
  padding: 26px 16px;
  color: var(--lightGrey) !important;
  font-size: 13px;
  text-align: center;
`;
