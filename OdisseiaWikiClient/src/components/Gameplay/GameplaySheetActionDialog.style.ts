import styled from 'styled-components';

export const FavoriteButton = styled.button<{ $active: boolean }>`
  color: ${({ $active }) => $active ? '#ffd65a' : 'inherit'} !important;

  &:disabled { opacity: .55; cursor: wait; }
`;

export const SheetActionForm = styled.div`
  display: grid;
  gap: 16px;
  min-width: min(100%, 440px);

  p {
    margin: 0;
    color: var(--text-secondary, #aab4c4);
    line-height: 1.45;
  }
`;

export const SheetActionFields = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

export const SheetActionError = styled.p`
  border-left: 3px solid var(--neonRed);
  background: color-mix(in srgb, var(--neonRed) 12%, transparent);
  color: var(--neonRed) !important;
  padding: 10px 12px;
`;

export const SheetActionButton = styled.div`
  display: flex;
  justify-content: center;
`;

export const SheetActionResult = styled.section`
  display: grid;
  gap: 9px;
  padding: 12px 14px;
  border-left: 3px solid var(--clearneonBlue);
  border-bottom: 1px solid rgba(0, 210, 255, .34);
  background: rgba(0, 15, 30, .64);

  header { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
  strong { color: var(--clearneonBlue); font-size: 1.15rem; }
  small { color: var(--grey); }
  ul { display: grid; gap: 4px; margin: 0; padding: 0; list-style: none; }
  li { display: flex; justify-content: space-between; gap: 12px; color: var(--lightGrey); font-size: .78rem; }
  li span:last-child { color: var(--whitesmoke); font-weight: 700; }
`;
