import styled from 'styled-components';
import { cyberButtonActionRow } from '../../../components/Generic/HighlightButton/HighlightButton.styles';

export const InventoryHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  min-width: 0;
  > div { min-width: 0; }
`;

export const InventoryClose = styled.button`
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: #d9f4ff;
  cursor: pointer;
  svg { font-size: 1.5rem; }
  &:hover:not(:disabled) { color: var(--inventory-accent, var(--clearneonBlue)); }
  &:disabled { opacity: .55; cursor: not-allowed; }
  &:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
`;

export const InventoryToggle = styled.button`
  min-height: 36px;
  padding: 7px 12px;
  border: 1px solid color-mix(in srgb, var(--inventory-accent, #4deeea) 50%, transparent);
  border-radius: 5px;
  background: rgba(0, 26, 40, .7);
  color: #d9f4ff;
  font: inherit;
  font-size: .82rem;
  cursor: pointer;
  &:hover:not(:disabled) { border-color: var(--inventory-accent, var(--clearneonBlue)); background: color-mix(in srgb, var(--inventory-accent, #00a7d6) 18%, transparent); }
  &:disabled { opacity: .55; cursor: not-allowed; }
  &:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
`;

export const InventoryContent = styled.div`
  display: grid;
  gap: 16px;
  min-width: 0;
`;

export const InventoryTypeFilters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  button {
    min-height: 29px;
    padding: 4px 9px;
    border: 1px solid color-mix(in srgb, var(--inventory-accent, #4deeea) 32%, transparent);
    border-radius: 3px;
    background: rgba(1, 15, 29, .62);
    color: #bed2dc;
    font: inherit;
    font-size: .72rem;
    cursor: pointer;
  }
  button[aria-pressed='true'], button:hover {
    border-color: var(--inventory-accent, var(--clearneonBlue));
    color: var(--inventory-accent, var(--clearneonBlue));
    background: color-mix(in srgb, var(--inventory-accent, #00a7d6) 16%, transparent);
  }
  button:focus-visible { outline: 2px solid white; outline-offset: 2px; }
`;

export const InventoryGroup = styled.div`
  display: grid;
  gap: 9px;
  min-width: 0;
  h3 { margin: 0; color: var(--inventory-accent, #d9f4ff); font-size: .93rem; }
  p { margin: 0; color: #a9c0cc; font-size: .82rem; line-height: 1.5; }
`;

export const InventoryList = styled.ol`
  display: grid;
  gap: 9px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const InventoryItem = styled.li`
  min-width: 0;
  display: grid;
  grid-template-columns: 26px 42px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border: 1px solid color-mix(in srgb, var(--inventory-accent, #4deeea) 22%, transparent);
  border-radius: 6px;
  background: rgba(7, 30, 46, .58);
  > strong { color: var(--inventory-accent, var(--clearneonBlue)); text-align: center; font-size: .8rem; }
  @media (max-width: 560px) {
    grid-template-columns: 22px 36px minmax(0, 1fr) 34px;
    gap: 7px;
  }
`;

export const InventoryImage = styled.div`
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--inventory-accent, #4deeea) 30%, transparent);
  border-radius: 5px;
  color: var(--inventory-accent, var(--clearneonBlue));
  background: rgba(0, 6, 15, .7);
  img { width: 100%; height: 100%; object-fit: cover; }
  svg { font-size: 1.3rem; }
  @media (max-width: 560px) { width: 36px; height: 36px; }
`;

export const InventoryItemInfo = styled.div`
  min-width: 0;
  display: grid;
  gap: 3px;
  strong { overflow-wrap: anywhere; font-size: .86rem; }
  small { color: #a9c0cc; font-size: .74rem; overflow-wrap: anywhere; }
`;

export const InventoryControls = styled.div`
  display: flex;
  gap: 5px;
  button {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--inventory-accent, #4deeea) 45%, transparent);
    border-radius: 4px;
    background: rgba(0, 18, 30, .85);
    color: var(--inventory-accent, var(--clearneonBlue));
    cursor: pointer;
    touch-action: none;
    user-select: none;
  }
  button:hover:not(:disabled) { background: color-mix(in srgb, var(--inventory-accent, #00a7d6) 22%, transparent); }
  button:disabled { opacity: .4; cursor: not-allowed; }
  button:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
  button svg { font-size: 1.1rem; }
`;

export const InventorySaveActions = styled.div`
  ${cyberButtonActionRow}
  gap: 9px;
`;

export const OtherInventoryList = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: 9px;
  margin: 0;
  padding: 0;
  list-style: none;
  li {
    min-width: 0;
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 9px;
    border: 1px solid color-mix(in srgb, var(--inventory-accent, #4deeea) 16%, transparent);
    border-radius: 5px;
    background: rgba(7, 30, 46, .38);
  }
`;
