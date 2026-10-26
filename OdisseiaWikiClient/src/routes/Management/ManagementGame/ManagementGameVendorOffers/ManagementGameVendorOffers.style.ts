import styled, { keyframes } from 'styled-components';
import { GameAdminFields } from '../ManagementGame.style';

const catalogReveal = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const Offers = styled.div`
  display: grid;
  gap: 20px;
  min-width: 0;
  animation: ${catalogReveal} 220ms ease-out both;
  :root[data-motion='reduced'] & { animation: none; }
`;

export const VendorCatalogTrigger = styled.button<{ $neon: boolean }>`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 13px 15px;
  border: 1px solid rgba(77, 238, 234, .35);
  border-radius: 6px;
  background: rgba(3, 24, 38, .65);
  color: var(--clearneonBlue);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 180ms ease, box-shadow 180ms ease;
  > span { display: grid; gap: 4px; flex: 1; min-width: 0; }
  strong { font-family: 'Orbitron', sans-serif; font-size: .78rem; }
  small { color: #a5bfc9; font-size: .73rem; }
  > svg { flex: none; }
  &:hover { border-color: var(--clearneonBlue);
    box-shadow: ${({ $neon }) => $neon ? '0 0 12px rgba(77, 238, 234, .18)' : 'none'}; }
  &:focus-visible { outline: 2px solid var(--clearneonBlue); outline-offset: 3px; }
  :root[data-motion='reduced'] & { transition: none; }
`;

export const OfferRow = styled.article`
  min-width: 0;
  padding: 10px 0;
  border-top: 1px solid rgba(77, 238, 234, .2);
`;

export const OfferRowHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  button { display: flex; align-items: center; gap: 11px; min-width: 0;
    border: 0; background: none; color: var(--clearneonBlue); cursor: pointer;
    font: inherit; text-align: left; padding: 6px; border-radius: 4px;
    transition: background 180ms ease; }
  button:first-child { flex: 1; }
  button:first-child > span { display: grid; gap: 4px; flex: 1; min-width: 0; }
  strong { display: block; font-size: .85rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  small { color: #a3bbc6; font-size: .72rem; }
  img { width: 42px; height: 42px; object-fit: cover; border: 1px solid rgba(77, 238, 234, .25); border-radius: 4px; }
  svg, img { flex: none; }
  button:first-child > svg:last-child { transition: transform 220ms ease; }
  button[aria-expanded='true'] > svg:last-child { transform: rotate(180deg); }
  button:last-child { color: var(--neonRed); }
  button:disabled { opacity: .4; cursor: default; }
  button:hover:not(:disabled) { background: rgba(77, 238, 234, .06); }
  button:focus-visible { outline: 2px solid var(--clearneonBlue); }
  :root[data-motion='reduced'] & { button, svg { transition: none !important; } }
`;

export const OfferExpansion = styled.div<{ $expanded: boolean }>`
  display: grid;
  grid-template-rows: ${({ $expanded }) => $expanded ? '1fr' : '0fr'};
  opacity: ${({ $expanded }) => $expanded ? 1 : 0};
  transition: grid-template-rows 220ms ease, opacity 180ms ease;
  > div { overflow: hidden; min-height: 0; }
  fieldset { min-width: 0; margin: 0; padding: 22px 5px 6px; border: 0; }
  :root[data-motion='reduced'] & { transition: none; }
`;

export const OfferFields = styled(GameAdminFields)`
  grid-template-columns: repeat(3, minmax(0, 1fr));
  @media (max-width: 600px) { grid-template-columns: minmax(0, 1fr); }
`;
