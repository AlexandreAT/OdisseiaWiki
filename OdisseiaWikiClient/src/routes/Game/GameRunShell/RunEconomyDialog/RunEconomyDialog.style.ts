import styled, { keyframes } from 'styled-components';
import { cyberButtonsFillWidth } from '../../../../components/Generic/HighlightButton/HighlightButton.styles';
import { LoadoutTabs, LoadoutSectionTitle } from '../RunLoadout.style';

const balanceReveal = keyframes`
  from { color: var(--clearneonYellow); text-shadow: 0 0 14px var(--neonYellow); }
  to { color: var(--clearneonYellow); text-shadow: none; }
`;

export const EconomyBody = styled.div`
  display: grid;
  align-content: start;
  gap: 16px;
  min-height: 0;
  min-width: 0;
  padding: 12px 4px 18px;
  overflow-y: auto;
  /* Keep the user's position instead of re-anchoring to a card on repaint/load. */
  overflow-anchor: none;
  scrollbar-gutter: stable;
  overscroll-behavior-y: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(77, 238, 234, .6) transparent;
  .economy-sale-hint { color: #a3bbc6; font-size: .75rem; line-height: 1.5; }
`;

export const EconomyTopline = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 16px;
  small { color: #a3bbc6; font-size: .75rem; }
`;

export const MerchantIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  > span { display: grid; gap: 4px; min-width: 0; }
  h2 { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  small { color: #a3bbc6; font-size: .75rem; }
`;

export const MerchantAvatar = styled.span<{ $neon: boolean }>`
  display: grid;
  place-items: center;
  flex: none;
  width: 46px;
  height: 46px;
  overflow: hidden;
  border: 1px solid var(--clearneonBlue);
  border-radius: 50%;
  color: var(--clearneonBlue);
  background: rgba(3, 25, 40, .8);
  box-shadow: ${({ $neon }) => $neon ? '0 0 10px rgba(77, 238, 234, .22)' : 'none'};
  img { width: 100%; height: 100%; object-fit: cover; }
`;

export const EconomyBalance = styled.strong`
  color: var(--clearneonYellow);
  font-family: 'Orbitron', sans-serif;
  font-size: .9rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: .04em;
  animation: ${balanceReveal} 900ms ease-out both;
  :root[data-motion='reduced'] & { animation: none; }
`;

export const EconomyTabs = styled(LoadoutTabs)<{ $neon?: boolean }>`
  --inventory-glow: ${({ $neon }) => $neon ? 'var(--clearneonBlue)' : 'transparent'};
  grid-template-columns: repeat(auto-fit, minmax(88px, 1fr));
  button:disabled { opacity: .45; cursor: not-allowed; }
  button[aria-pressed='true'] { color: var(--clearneonBlue); border-color: var(--clearneonBlue); background: rgba(0, 183, 213, .12); }
`;

export const EconomyCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  grid-auto-rows: max-content;
  align-content: start;
  gap: 20px;
  padding: 5px;
  @media (max-width: 550px) { grid-template-columns: minmax(0, 1fr); }
`;

export const EconomyCard = styled.article`
  display: grid;
  align-content: start;
  gap: 10px;
  min-width: 0;
  > button { width: min(100%, 210px); justify-self: center; }
  > small { color: #afc8d4; font-size: .76rem; line-height: 1.4; }
  > small[data-empty='true'] { color: var(--clearneonYellow); }
`;

export const EconomyActions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  > :only-child { grid-column: 1 / -1; }
  gap: 10px;
  align-items: center;
  ${cyberButtonsFillWidth}
  @media (max-width: 360px) { grid-template-columns: minmax(0, 1fr); }
`;

export const EconomyDetails = styled.div`
  display: grid;
  gap: 10px;
  p { margin: 0; color: #b9d1da; font-size: .82rem; line-height: 1.5; }
  strong { color: var(--clearneonBlue); }
`;

export const EconomySectionTitle = styled(LoadoutSectionTitle)`
  margin-bottom: 2px;
`;
