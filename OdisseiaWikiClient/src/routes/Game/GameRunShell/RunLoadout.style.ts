import styled from 'styled-components';
import { cyberButtonsFillWidth } from '../../../components/Generic/HighlightButton/HighlightButton.styles';
import HudCornerThin from '../../../assets/svg/HudCornerThin.svg';
import { GameNotice } from '../GameShared.style';

export const ConditionOriginCard = styled.div`
  border: 1px solid rgba(77, 238, 234, .32);
  border-radius: 5px;
  background: rgba(8, 28, 43, .56);
  > button {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    width: 100%; padding: 10px; border: 0; background: transparent;
    color: #d9f4ff; text-align: left; cursor: pointer;
    strong { color: var(--clearneonBlue); font-size: .72rem; text-transform: uppercase; }
    &:hover, &:focus-visible { background: rgba(77, 238, 234, .1); }
  }
`;

export const ConditionOriginFields = styled.div<{ $columns?: number }>`
  display: grid;
  grid-template-columns: ${({ $columns }) => $columns === 2 ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)'};
  gap: 10px;
  min-width: 0;
  padding: 0 10px 11px;
  @media (max-width: 390px) { grid-template-columns: minmax(0, 1fr); }
`;

export const LoadoutBody = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(210px, .8fr) minmax(210px, .8fr);
  gap: 18px;
  min-width: 0;
  @media (max-width: 1000px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    > :first-child { grid-column: 1 / -1; }
  }
  @media (max-width: 700px) {
    grid-template-columns: minmax(0, 1fr);
    > :first-child { grid-column: auto; }
  }
`;

export const LoadoutColumn = styled.section`
  min-width: 0;
  display: grid;
  align-content: start;
  gap: 12px;
  &[aria-label='Itens disponíveis'] {
    display: flex;
    flex-direction: column;
    align-content: stretch;
    [data-run-inventory-grid] { flex: 1 1 180px; }
  }
`;

export const LoadoutSectionTitle = styled.h3`
  display: flex;
  align-items: baseline;
  gap: 7px;
  margin: 0;
  padding-bottom: 7px;
  border-bottom: 1px solid rgba(77, 238, 234, .25);
  color: #e3faff;
  font-family: 'Orbitron', sans-serif;
  font-size: .82rem;
  font-weight: 600;
  letter-spacing: .035em;
  line-height: 1.35;
  span { color: var(--clearneonBlue); font-variant-numeric: tabular-nums; }
`;

export const LoadoutNote = styled.p`
  margin: 0;
  color: #9fb9c4;
  font-size: .79rem;
  line-height: 1.5;
`;

export const LoadoutEmpty = styled.p`
  margin: 0;
  padding: 10px 11px;
  border-left: 2px solid rgba(77, 238, 234, .55);
  background: linear-gradient(90deg, rgba(77, 238, 234, .085), transparent);
  color: #bbd4db;
  font-size: .8rem;
  line-height: 1.5;
  strong { color: #e2faff; font-weight: 600; }
`;

export const LoadoutCarry = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 3px 8px;
  margin-top: 3px;
  padding-top: 11px;
  border-top: 1px solid rgba(77, 238, 234, .18);
  color: #a4bcc7;
  font-size: .77rem;
  strong {
    color: var(--clearneonBlue);
    font-family: 'Orbitron', sans-serif;
    font-size: .76rem;
    font-variant-numeric: tabular-nums;
  }
`;

export const LoadoutTabs = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 5px;
  button {
    min-width: 0; padding: 9px 4px; border: 1px solid rgba(0, 185, 238, .35);
    background: rgba(0, 14, 28, .7); color: #b9d1da; font: inherit;
    font-size: .75rem; cursor: pointer;
  }
  button[aria-selected='true'] { border-color: var(--clearneonBlue); color: var(--clearneonBlue); background: rgba(0, 160, 220, .13); }
  button:focus-visible { outline: 2px solid white; outline-offset: 2px; }
`;

export const LoadoutGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(116px, 1fr));
  grid-auto-rows: max-content;
  align-content: start;
  gap: 10px;
  max-height: min(52vh, 560px);
  overflow-y: auto;
  padding: 7px;
  scrollbar-width: thin;
  scrollbar-color: rgba(77, 238, 234, .55) rgba(2, 13, 26, .7);
  @media (max-width: 700px) {
    grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
    max-height: 40vh;
  }
`;

export const BurstShotQuantity = styled.span`
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 38px;
  padding: 0 9px;
  border: 1px solid rgba(77, 238, 234, .5);
  background: #061622;
  color: #d9f4ff;
  font: inherit;

  && input {
    flex: 1;
    width: 100%;
    min-width: 0;
    padding: 6px 0;
    border: 0;
    background: transparent;
    color: inherit;
    text-align: right;
    outline: 0;
  }

  > span { padding-left: 2px; }
  &:focus-within { outline: 2px solid white; }
`;

export const LoadoutCard = styled.button<{ $neon: boolean }>`
  position: relative;
  isolation: isolate;
  min-width: 0;
  display: grid;
  align-content: start;
  gap: 0;
  padding: 5px;
  border: 0;
  background: transparent;
  color: #d9f4ff;
  text-align: left;
  cursor: pointer;
  transition: filter 180ms ease;
  &::before {
    content: '';
    position: absolute;
    z-index: -1;
    inset: 0;
    border: 1px solid rgba(77, 238, 234, .35);
    clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
    background: linear-gradient(155deg, rgba(12, 52, 73, .92), rgba(1, 10, 22, .96));
    transition: border-color 180ms ease, background 180ms ease;
  }
  &[data-action-equipped='true']::before {
    border: 2px solid rgba(117, 248, 245, .94);
    background: linear-gradient(155deg, rgba(15, 64, 82, .96), rgba(1, 16, 30, .98));
    box-shadow: inset 0 0 0 1px rgba(77, 238, 234, .28);
  }
  &[aria-pressed='true'] {
    &::before {
      border-color: var(--clearneonBlue);
      background: linear-gradient(155deg, rgba(12, 74, 96, .96), rgba(1, 16, 29, .98));
      box-shadow: inset 0 0 0 1px var(--clearneonBlue);
    }
  }
  &:hover:not(:disabled), &:focus-visible {
    filter: ${({ $neon }) => $neon ? 'drop-shadow(0 0 6px rgba(77, 238, 234, .65))' : 'brightness(1.12)'};
    &::before { border-color: var(--clearneonBlue); }
  }
  &:disabled { opacity: .45; cursor: default; }
  &:focus-visible { outline: 2px solid white; outline-offset: 2px; }
`;

export const LoadoutCardCorner = styled.span<{ $position: 'top-right' | 'bottom-left'; $neon: boolean }>`
  position: absolute;
  z-index: 2;
  /* Match the 14px cut without scaling up the SVG stroke. */
  width: 60px;
  height: 60px;
  pointer-events: none;
  background: var(--clearneonBlue);
  opacity: ${({ $neon }) => $neon ? 1 : .8};
  filter: ${({ $neon }) => $neon ? 'drop-shadow(0 0 4px var(--clearneonBlue))' : 'none'};
  -webkit-mask: url("${HudCornerThin}") center / contain no-repeat;
  mask: url("${HudCornerThin}") center / contain no-repeat;
  ${({ $position }) => $position === 'top-right'
    ? 'top: 0; right: 0; transform: scale(-1);'
    : 'bottom: 0; left: 0;'}
`;

export const LoadoutCardMedia = styled.span`
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(77, 238, 234, .2);
  background: rgba(0, 6, 15, .85);
  color: var(--clearneonBlue);
  img { width: 100%; height: 100%; object-fit: cover; transition: transform 240ms ease; }
  svg { font-size: clamp(2.4rem, 7vw, 3.5rem); }
  ${LoadoutCard}:hover & img, ${LoadoutCard}:focus-visible & img { transform: scale(1.06); }
`;

export const LoadoutCardCaption = styled.span`
  display: grid;
  align-content: center;
  gap: 3px;
  min-height: 52px;
  padding: 7px 5px 5px;
  border-top: 1px solid rgba(77, 238, 234, .28);
  strong {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    font-size: .74rem;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }
  small { color: #93bbc9; font-size: .67rem; }
`;

export const LoadoutSlots = styled.ol`
  display: grid; gap: 8px; padding: 0; margin: 0; list-style: none;
  li { min-height: 54px; display: flex; align-items: center; gap: 8px; padding: 8px;
    border: 1px solid rgba(77, 238, 234, .27); background: rgba(4, 23, 38, .7); }
  li > strong { color: var(--clearneonBlue); width: 22px; text-align: center; }
  li > span { min-width: 0; flex: 1; overflow-wrap: anywhere; font-size: .84rem; }
  li button { border: 0; background: transparent; color: var(--clearneonBlue); cursor: pointer;
    display: grid; place-items: center; padding: 5px; }
  li button:disabled { opacity: .4; cursor: default; }
  li button:focus-visible { outline: 2px solid white; }
  li button[data-drag='true'] { touch-action: none; }
`;

export const EquippedGear = styled(LoadoutSlots)`
  li > strong { width: auto; min-width: 30px; font-size: .68rem; text-transform: uppercase; }
  li button[aria-label^='Retirar'] { color: #ff718b; }
`;

export const LoadoutSelection = styled.div`
  display: flex; gap: 10px; align-items: center; flex-wrap: wrap;
  padding: 8px 0; border-top: 1px solid rgba(77, 238, 234, .24);
  strong { flex: 1; min-width: 120px; font-size: .85rem; }
  small { color: #a9c0cc; }
  label { color: #b9d1da; font-size: .78rem; }
  select { min-height: 36px; padding: 5px 8px; border: 1px solid rgba(77, 238, 234, .5);
    background: #061622; color: #d9f4ff; font: inherit; font-size: .8rem; }
  select:focus-visible { outline: 2px solid white; }
`;

export const ConsumableAction = styled.div`
  display: grid;
  justify-items: start;
  gap: 8px;
  width: 100%;
  padding-top: 8px;
  border-top: 1px solid rgba(77, 238, 234, .2);
  small { color: #a9c0cc; font-size: .75rem; }
  label { display: flex; align-items: center; gap: 10px; color: #bad5df; font-size: .8rem; }
  input[type='number'] { width: 68px; min-height: 36px; padding: 5px 8px;
    border: 1px solid var(--clearneonBlue); border-radius: 4px;
    background: rgba(0, 14, 26, .85); color: #fff; font: inherit; }
`;

export const ConsumableRestoration = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  span {
    padding: 4px 7px;
    border: 1px solid rgba(85, 234, 188, .46);
    color: #93f5d0;
    background: rgba(2, 46, 34, .5);
    font-size: .72rem;
  }
`;

export const LoadoutActions = styled.div`
  display: flex; justify-content: flex-end; align-items: center; gap: 10px; flex-wrap: wrap;
  padding-top: 12px; border-top: 1px solid rgba(77, 238, 234, .2);
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
    ${cyberButtonsFillWidth}
  }
`;

export const LoadoutLimitNotice = styled(GameNotice)`
  padding: 8px 10px;
  font-size: .78rem;
  line-height: 1.35;
`;

export const LoadoutItemActions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: center;
  gap: 10px;
  width: 100%;
  ${cyberButtonsFillWidth}

  & > * { min-width: 0; }
  & > :only-child { grid-column: 1 / -1; }
  & > :nth-child(3) { grid-column: 1 / -1; }
  @media (max-width: 360px) { gap: 4px; }
`;

export const LoadoutModalActions = styled(LoadoutItemActions)`
  padding-top: 11px;
  border-top: 1px solid rgba(77, 238, 234, .2);
`;

export const LoadoutDefensePanel = styled.section`
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(77, 238, 234, .26);
  border-radius: 5px;
  background: linear-gradient(140deg, rgba(9, 45, 63, .48), rgba(2, 14, 27, .6));
  min-width: 0;

  > strong {
    color: var(--clearneonBlue);
    font-family: 'Orbitron', sans-serif;
    font-size: .68rem;
    letter-spacing: .1em;
    text-transform: uppercase;
  }
`;

export const LoadoutDefenseStats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  span {
    display: inline-flex;
    align-items: baseline;
    gap: 5px;
    padding: 5px 7px;
    border: 1px solid rgba(134, 181, 206, .25);
    border-radius: 3px;
    background: rgba(2, 13, 24, .52);
    color: #9eb7c4;
    font-size: .72rem;
  }
  b { color: #ecfaff; font-family: 'Orbitron', sans-serif;
    font-size: .77rem; font-variant-numeric: tabular-nums; }
`;

export const LoadoutDefenseNote = styled.p`
  margin: 0;
  padding-top: 8px;
  border-top: 1px solid rgba(77, 238, 234, .16);
  color: #9db6c2;
  font-size: .75rem;
  line-height: 1.45;
`;

export const LoadoutAttackPreview = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 5px 12px;
  color: #b8c8d7;
  font-size: .82rem;
  line-height: 1.5;

  > span { white-space: nowrap; }
  strong {
    font-family: 'Orbitron', sans-serif;
    font-size: .95rem;
    font-weight: 600;
    color: var(--clearneonBlue);
  }
`;
