import styled from 'styled-components';

export const ListModalTitle = styled.span<{ $theme: 'dark' | 'light' }>`
  font-family: 'Cyberpunk Is Not Dead', sans-serif;
  font-size: 18px;
  font-weight: 100;
  letter-spacing: 3px;
  color: var(--black) !important;
  text-shadow: ${({ $theme }) => $theme === 'dark'
    ? '-1px -1px 0 var(--neonBlue), -1px 1px 0 var(--neonBlue), 1px -1px 0 var(--neonBlue), 1px 1px 0 var(--neonBlue)'
    : '-1px -1px 0 var(--neonPink), -1px 1px 0 var(--neonPink), 1px -1px 0 var(--neonPink), 1px 1px 0 var(--neonPink)'};
`;

export const ListModalViewport = styled.div<{
  $maxVisibleRows?: number;
  $itemHeight?: number;
}>`
  width: 100%;
  max-height: ${({ $maxVisibleRows, $itemHeight }) => (
    $maxVisibleRows && $itemHeight
      ? `${($maxVisibleRows * $itemHeight) + (($maxVisibleRows - 1) * 12)}px`
      : 'none'
  )};
  overflow-x: hidden;
  overflow-y: ${({ $maxVisibleRows }) => $maxVisibleRows ? 'auto' : 'visible'};
  padding-right: ${({ $maxVisibleRows }) => $maxVisibleRows ? '4px' : '0'};
  box-sizing: border-box;
  overscroll-behavior-y: contain;

  &::-webkit-scrollbar { width: 9px; }
  &::-webkit-scrollbar-track { background: rgba(0, 23, 43, 0.72); }
  &::-webkit-scrollbar-thumb {
    border-radius: 10px;
    background: var(--clearneonBlue);
  }
`;

export const ListModalGrid = styled.div<{
  $color: string;
  $columns: number;
  $itemHeight?: number;
}>`
  display: grid;
  grid-template-columns: repeat(${({ $columns }) => $columns}, minmax(0, 1fr));
  grid-auto-rows: ${({ $itemHeight }) => $itemHeight ? `${$itemHeight}px` : 'auto'};
  gap: 12px;

  > * {
    min-width: 0;
    border-color: ${({ $color }) => $color};
  }

  @media (max-width: 1200px) {
    grid-template-columns: repeat(${({ $columns }) => Math.min($columns, 3)}, minmax(0, 1fr));
  }

  @media (max-width: 700px) {
    grid-template-columns: repeat(${({ $columns }) => Math.min($columns, 2)}, minmax(0, 1fr));
  }

`;

export const ListModalEmpty = styled.p`
  margin: 0;
  color: var(--muted, #cfcfcf);
  text-align: center;
`;
