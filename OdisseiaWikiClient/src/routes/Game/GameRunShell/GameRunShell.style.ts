import Dialog from '@mui/material/Dialog';
import styled, { css, keyframes } from 'styled-components';
import { GameFrame, GamePage, GameTextLink } from '../GameShared.style';

const backpackHeartbeat = keyframes`
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 5px 18px rgba(0, 0, 0, .35);
    filter: none;
  }
  18%, 52% {
    transform: scale(1.11);
    box-shadow: 0 0 0 2px rgba(77, 238, 234, .65), 0 0 22px 8px rgba(0, 187, 255, .48);
    filter: drop-shadow(0 0 10px rgba(77, 238, 234, .8));
  }
  34%, 70% {
    transform: scale(1.02);
    box-shadow: 0 0 0 1px rgba(77, 238, 234, .34), 0 0 12px 4px rgba(0, 187, 255, .26);
    filter: drop-shadow(0 0 5px rgba(77, 238, 234, .55));
  }
`;

export const GameRunPage = styled(GamePage)<{ $areaImage: string }>`
  position: relative;
  isolation: isolate;
  min-height: var(--stable-viewport-height, 100vh);

  &::before,
  &::after {
    content: '';
    position: fixed;
    inset: 0;
    height: var(--stable-viewport-height, 100vh);
    pointer-events: none;
  }

  &::before {
    z-index: -2;
    background-image: ${({ $areaImage }) => $areaImage ? `url(${JSON.stringify($areaImage)})` : 'none'};
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    filter: blur(12px);
    transform: scale(1.08);
  }

  &::after {
    z-index: -1;
    background: rgba(1, 8, 17, .5);
  }
`;

export const RunLoadingPage = styled(GamePage)`
  min-height: 55vh;
  display: flex;
  align-items: center;
  justify-content: center;
  > span { flex: 0 0 auto; width: max-content; max-width: 100%; }
  > span > span:last-child { flex: 0 0 auto; }
`;

export const RunPanel = styled(GameFrame)`
  display: grid;
  gap: 18px;
`;

export const RunHudPanel = styled(RunPanel)`
  width: 100%;
  gap: clamp(14px, 2vw, 22px);
  background: linear-gradient(180deg, rgba(2, 16, 30, .96), rgba(1, 9, 20, .96));
  ${({ neon }) => neon && css`
    box-shadow: inset 0 0 13px rgba(77, 238, 234, .05), 0 0 5px rgba(77, 238, 234, .12);
    > span:nth-of-type(-n + 4) { filter: drop-shadow(0 0 2px rgba(77, 238, 234, .42)); }
    > span:nth-of-type(n + 5):nth-of-type(-n + 8) { box-shadow: 0 0 3px rgba(77, 238, 234, .38); }
  `}
  > :is(header, section, div, p):not([data-run-region-backdrop], [data-run-sticky-header]) {
    position: relative;
    z-index: 1;
  }
  &[data-map-centering='true']::after {
    content: '';
    display: block;
    height: var(--map-center-space, 0px);
  }
  @media (max-width: 600px) { padding: 16px 12px; }
`;

export const RunPanelBackdrop = styled.div<{ $top: number; $height: number }>`
  position: absolute;
  z-index: 0;
  top: ${({ $top }) => `${$top}px`};
  height: ${({ $height }) => `${$height}px`};
  left: 0;
  right: 0;
  overflow: hidden;
  background: #020e1b;
  pointer-events: none;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
    opacity: .72;
  }
`;

export const RunHudTopline = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  > button {
    display: inline-grid;
    place-items: center;
    min-width: 36px;
    min-height: 36px;
    padding: 5px 8px;
    border: 1px solid rgba(77, 238, 234, .25);
    border-radius: 4px;
    background: transparent;
    color: #a9c0cc;
    font: inherit;
    font-size: .76rem;
    cursor: pointer;
  }
  > button:hover:not(:disabled) { color: #fff; border-color: var(--clearneonBlue); }
  > button:disabled { opacity: .5; cursor: not-allowed; }
  > button:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
`;

export const RunHudNavigation = styled(RunHudTopline)`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  > button { grid-column: 3; white-space: nowrap; }
  > span { min-width: 0; }
  @media (max-width: 600px) {
    grid-template-columns: minmax(0, 1fr) auto;
    > button { grid-column: 2; }
    > span { grid-column: 1 / -1; grid-row: 2; }
  }
`;

export const RunBackLink = styled(GameTextLink)<{ $neon: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: 7px;
  min-height: 36px;
  padding: 5px 11px;
  border: 1px solid rgba(77, 238, 234, .37);
  border-radius: 4px;
  background: rgba(4, 25, 39, .65);
  font-family: 'Orbitron', sans-serif;
  font-size: .76rem;
  font-weight: 700;
  letter-spacing: .06em;
  text-decoration: none;
  text-transform: uppercase;
  white-space: nowrap;
  transition: border-color .2s, background-color .2s, box-shadow .2s;
  svg { width: 17px; height: 17px; transition: transform .2s; }
  &:hover {
    border-color: var(--clearneonBlue);
    background: rgba(0, 166, 191, .23);
    box-shadow: ${({ $neon }) => $neon ? '0 0 10px rgba(77, 238, 234, .2), inset 0 0 8px rgba(77, 238, 234, .06)' : 'none'};
  }
  &:hover svg { transform: translateX(-2px); }
  @media (prefers-reduced-motion: reduce) { &, svg { transition: none; } &:hover svg { transform: none; } }
`;

export const RunStickyHeader = styled.div`
  position: sticky;
  top: calc(var(--main-header-height, 85px) + 18px);
  z-index: 20;
  display: grid;
  gap: 10px;
  padding: 10px;
  border: 1px solid rgba(77, 238, 234, .24);
  border-radius: 8px;
  background: rgba(2, 14, 28, .72);
  backdrop-filter: blur(10px) saturate(115%);
  -webkit-backdrop-filter: blur(10px) saturate(115%);
  box-shadow: 0 8px 24px rgba(0, 0, 0, .35);
  @media (max-width: 600px) {
    top: calc(var(--main-header-height, 54px) + 10px);
    padding: 8px;
  }
`;

const conclusionReveal = keyframes`
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const RunConclusion = styled.div<{ $won: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 3px 14px;
  padding: 7px 11px;
  border-left: 2px solid ${({ $won }) => $won ? 'var(--clearneonGreen)' : 'var(--neonRed)'};
  background: ${({ $won }) => $won ? 'rgba(11, 57, 42, .35)' : 'rgba(78, 24, 35, .35)'};
  color: ${({ $won }) => $won ? 'var(--clearneonGreen)' : 'var(--neonRed)'};
  font-size: .76rem;
  animation: ${conclusionReveal} .45s ease-out both;
  strong { font-family: 'Orbitron', sans-serif; letter-spacing: .04em; }
  span { color: #c4d6dd; }
  button { border: 1px solid currentColor; border-radius: 5px; padding: 4px 9px;
    background: transparent; color: inherit; cursor: pointer; font: inherit;
    transition: background .2s, box-shadow .2s; }
  button:hover, button:focus-visible { background: rgba(36, 213, 157, .12);
    box-shadow: 0 0 12px rgba(36, 213, 157, .2); }
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

export const RunHudMeta = styled.span`
  color: #a9c0cc;
  font-size: .8rem;
  letter-spacing: .04em;
`;

export const RunHudHeader = styled.header`
  display: grid;
  grid-template-columns: minmax(200px, 300px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(16px, 3vw, 36px);
  padding: 13px 16px;
  border: 1px solid rgba(77, 238, 234, .17);
  border-radius: 7px;
  background: rgba(4, 23, 39, .44);
  backdrop-filter: blur(7px);
  -webkit-backdrop-filter: blur(7px);
  @media (max-width: 700px) { grid-template-columns: 1fr; gap: 14px; }
  @media (max-width: 420px) { padding: 12px; }
`;

export const SnapshotHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
  > div:last-child { min-width: 0; width: 100%; }
  h1 { margin: 0; padding: 4px 2px; line-height: 1.2; min-width: 0; }
  p { margin: 3px 0 0; color: #a9c0cc; font-size: .76rem; }
`;

const xpHudReveal = keyframes`
  0% { color: var(--clearneonYellow); text-shadow: 0 0 12px var(--clearneonYellow); }
  55% { color: var(--clearneonYellow); text-shadow: 0 0 8px var(--clearneonYellow); }
  100% { color: #a9c0cc; text-shadow: none; }
`;

export const RunXpLabel = styled.p<{ $pulse: boolean }>`
  font-variant-numeric: tabular-nums;
  ${({ $pulse }) => $pulse && css`animation: ${xpHudReveal} 1.8s ease-out both;`}
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

const currencyHudReveal = keyframes`
  from { text-shadow: 0 0 12px var(--neonYellow); filter: brightness(1.4); }
  to { text-shadow: none; filter: brightness(1); }
`;

export const RunCurrency = styled.p`
  margin: 2px 0 0; color: var(--clearneonYellow); font-size: .78rem;
  font-variant-numeric: tabular-nums; letter-spacing: .04em;
  animation: ${currencyHudReveal} 1.1s ease-out both;
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

export const ResourceAndAttributes = styled.div`
  display: grid;
  gap: 9px;
  min-width: 0;
`;

export const RunDefenseRow = styled.div`
  display: grid;
  grid-template-columns: minmax(110px, min(40%, 320px)) minmax(0, 1fr);
  align-items: center;
  gap: 10px 18px;
  min-width: 0;
  @media (max-width: 600px) { grid-template-columns: minmax(0, 1fr); }
`;

export const RunDefenseDetails = styled.div`
  display: grid;
  grid-template-columns: max-content max-content minmax(0, 1fr);
  align-items: center;
  justify-content: start;
  gap: 8px;
  min-width: 0;
  > [aria-label='Condições ativas'] {
    margin-top: 0;
    max-width: 100%;
  }
`;

export const RunProtection = styled.div`
  flex: 1 1 150px;
  max-width: 320px;
  min-width: 110px;
`;

export const RunDefenseValue = styled.span<{ $shield?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: ${({ $shield }) => $shield ? 'var(--clearneonPink)' : 'var(--clearneonYellow)'};
  font-family: 'Orbitron', sans-serif;
  font-size: .8rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  svg { font-size: 1.1rem; }
`;

export const AttributeList = styled.div<{ $neon: boolean }>`
  display: flex;
  flex-wrap: wrap;
  gap: 5px 8px;
  min-width: 0;
  padding-top: 8px;
  border-top: 1px solid rgba(77, 238, 234, .19);
  button {
    position: relative;
    display: inline-flex;
    align-items: baseline;
    justify-content: center;
    gap: 4px;
    min-width: 48px;
    padding: 3px 5px;
    border: 1px solid rgba(77, 238, 234, .14);
    border-radius: 3px;
    background: rgba(0, 11, 22, .23);
    color: #a8bdc7;
    font: inherit;
    font-size: .67rem;
    cursor: help;
    transition: border-color .18s ease, background .18s ease, color .18s ease;
  }
  button strong {
    color: #e0f7f8;
    font-family: 'Orbitron', sans-serif;
    font-size: .71rem;
    font-variant-numeric: tabular-nums;
    ${({ $neon }) => $neon && 'text-shadow: 0 0 5px rgba(77, 238, 234, .38);'}
  }
  button:hover, button:focus-visible, button[aria-expanded='true'] {
    color: #e3f9fa;
    border-color: rgba(77, 238, 234, .55);
    background: rgba(10, 54, 69, .65);
    ${({ $neon }) => $neon && 'box-shadow: inset 0 0 6px rgba(77, 238, 234, .16);'}
  }
  button:focus-visible { outline: 1px solid var(--clearneonBlue); outline-offset: 1px; }
  button em {
    position: absolute;
    z-index: 2;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%) translateY(3px);
    padding: 5px 8px;
    border: 1px solid rgba(77, 238, 234, .55);
    border-radius: 3px;
    background: rgba(2, 19, 31, .94);
    color: #eafcff;
    font-size: .72rem;
    font-style: normal;
    white-space: nowrap;
    box-shadow: 0 4px 10px rgba(0, 0, 0, .36);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity .16s ease, transform .16s ease, visibility .16s ease;
  }
  button:hover em, button:focus-visible em, button[aria-expanded='true'] em {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0);
  }
  @media (max-width: 700px) {
    gap: 4px;
    button { min-height: 28px; }
    button em, button:hover em, button:focus-visible em {
      display: none;
    }
    button[aria-expanded='true'] em {
      position: static;
      display: inline;
      padding: 0;
      transform: none;
      border: 0;
      background: none;
      box-shadow: none;
      opacity: 1;
      visibility: visible;
    }
  }
`;

export const SnapshotPortrait = styled.div`
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(77, 238, 234, .5);
  border-radius: 50%;
  background: rgba(77, 238, 234, .08);
  color: var(--clearneonBlue);
  img { width: 100%; height: 100%; object-fit: cover; }
  svg { font-size: 1.6rem; }
`;

export const ResourceList = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(8px, 2vw, 20px);
  min-width: 0;
  @media (max-width: 420px) { gap: 8px; }
`;

export const ResourceItem = styled.div`
  display: grid;
  gap: 5px;
  min-width: 0;
`;

export const ResourceLabels = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 2px 6px;
  color: #bcd0dc;
  font-size: .72rem;
  strong { color: #fff; font-variant-numeric: tabular-nums; white-space: nowrap; }
  @media (max-width: 950px) { font-size: .68rem; }
  @media (max-width: 600px) { strong { display: none; } }
`;

export const ResourceTrack = styled.div`
  position: relative;
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, .12);
  @media (max-width: 600px) { height: 19px; }
`;

export const ResourceBarValue = styled.strong`
  display: none;
  @media (max-width: 600px) {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: #fff;
    font-size: .61rem;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    text-shadow: 0 1px 3px #00121b, 0 0 5px #00121b;
  }
`;

export const ResourceFill = styled.span<{ $percent: number; $tone: 'life' | 'mana' | 'stamina' | 'protection' }>`
  display: block;
  width: ${({ $percent }) => `${$percent}%`};
  height: 100%;
  border-radius: inherit;
  background: ${({ $tone }) => ({
    life: 'linear-gradient(90deg, #ae3551, #ff6679)',
    mana: 'linear-gradient(90deg, #3d76d2, #6bd5ff)',
    stamina: 'linear-gradient(90deg, #05895b, #55eabc)',
    protection: 'linear-gradient(90deg, var(--neonPurple), var(--clearneonPurple))',
  })[$tone]};
  transition: width .3s ease;
  @media (prefers-reduced-motion: reduce) { transition: none; }
`;

export const RunRouteBusy = styled.div`
  position: fixed;
  z-index: 1200;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  display: grid;
  place-items: center;
  @media (max-width: 600px) { width: min(88vw, 320px); }
`;

export const RunMapArea = styled.div`
  position: relative;
  min-width: 0;
  padding: 4px clamp(52px, 7vw, 86px);
  @media (max-width: 600px) { padding: 4px 0; }
`;

export const RunActionRail = styled.nav`
  position: absolute;
  top: calc(100% + 10px);
  right: 4px;
  z-index: 15;
  display: grid;
  justify-items: center;
  gap: 10px;
  pointer-events: none;
  button {
    pointer-events: auto;
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    padding: 0;
    box-sizing: border-box;
    appearance: none;
    border: 1px solid rgba(77, 238, 234, .55);
    border-radius: 8px;
    background: rgba(3, 28, 44, .62);
    color: var(--clearneonBlue);
    box-shadow: 0 5px 18px rgba(0, 0, 0, .35);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    cursor: pointer;
    overflow: hidden;
    -webkit-tap-highlight-color: transparent;
    transition: color .16s ease, border-color .16s ease, background .16s ease, box-shadow .16s ease;
  }
  button:hover:not(:disabled) {
    color: #fff;
    border-color: var(--clearneonBlue);
    background: rgba(4, 40, 58, .95);
    box-shadow: 0 0 9px rgba(0, 187, 255, .18);
  }
  button:active { background: rgba(0, 167, 214, .3); }
  button:disabled { opacity: .5; cursor: not-allowed; }
  button:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
  button[data-attention='true'] { animation: ${backpackHeartbeat} .75s ease-in-out infinite; }
  button svg { pointer-events: none; }
  button > svg { font-size: 1.55rem; }
  @media (max-width: 600px) {
    gap: 7px;
    button {
      width: 40px;
      height: 40px;
      border: 0;
      border-radius: 50%;
      background: rgba(3, 28, 44, .43);
      box-shadow: 0 3px 9px rgba(0, 0, 0, .2);
    }
    button:hover:not(:disabled) {
      border: 0;
      background: rgba(4, 40, 58, .95);
      box-shadow: 0 0 8px rgba(0, 187, 255, .16);
    }
    button:active { background: rgba(0, 167, 214, .18); }
    button:focus-visible { outline-color: var(--clearneonBlue); color: #fff; }
    button svg {
      filter: drop-shadow(0 2px 3px rgba(0, 0, 0, .85));
      transition: filter .16s ease, opacity .16s ease, transform .16s ease;
    }
    button:hover svg, button:focus-visible svg {
      filter: drop-shadow(0 0 7px var(--clearneonBlue));
    }
    button:active svg { opacity: .8; transform: scale(.9); }
    button > svg { font-size: 1.55rem; }
  }
  @media (prefers-reduced-motion: reduce) {
    button[data-attention='true'] {
      animation: none;
      box-shadow: 0 0 16px 4px rgba(0, 187, 255, .5);
      color: #fff;
    }
  }
`;

export const TrainingIcon = styled.span`
  position: relative;
  display: grid;
  place-items: center;
  pointer-events: none;
  > svg:first-child { font-size: 1.7rem; }
  > svg:last-child { position: absolute; top: -4px; right: -5px; font-size: .85rem; }
  @media (max-width: 600px) {
    > svg:first-child { font-size: 1.55rem; }
    > svg:last-child { top: -3px; right: -4px; font-size: .7rem; }
  }
`;

export const RunSectionLabel = styled.h2`
  margin: 0 0 8px;
  color: #a9c0cc;
  font-size: .72rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
`;

export const RunBattleHistoryNav = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  max-height: none;
  align-content: flex-start;
  padding: 1px 5px 1px 1px;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(77, 238, 234, .5) rgba(2, 13, 26, .3);
  button {
    max-width: 100%;
    overflow: hidden;
    padding: 5px 9px;
    border: 1px solid rgba(77, 238, 234, .28);
    border-radius: 5px;
    background: rgba(7, 30, 46, .42);
    color: #bdd3df;
    font: inherit;
    font-size: .75rem;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }
  button:hover { border-color: var(--clearneonBlue); color: #fff; }
  button:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
`;

export const ReplaySection = styled(RunPanel)<{ $areaImage?: string }>`
  align-content: start;
  align-self: start;
  gap: 9px;
  ${({ $areaImage }) => $areaImage && css`
    background-color: rgb(2, 11, 21);
    isolation: isolate;
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -2;
      pointer-events: none;
      background-image: url(${JSON.stringify($areaImage)});
      background-size: auto max(1150px, var(--stable-viewport-height, 100vh));
      background-position: center top;
      background-repeat: no-repeat;
    }
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      pointer-events: none;
      background: rgba(0, 0, 0, .38);
    }
  `}
`;

export const RunOverlayDialog = styled(Dialog)`
  .MuiDialog-paper {
    max-height: calc(100dvh - 32px);
    overflow-y: auto;
    background: transparent;
    box-shadow: none;
    color: #fff;
    scrollbar-color: rgba(77, 238, 234, .6) rgba(2, 13, 26, .7);
    scrollbar-width: thin;
  }
`;

export const RunTrainingDialog = styled(RunOverlayDialog)`
  .MuiDialog-paper { overflow: hidden; }
`;

export const RunTrainingPanel = styled(ReplaySection)`
  min-height: 0;
  max-height: calc(100dvh - 32px);
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
`;

export const RunTrainingBody = styled.div`
  min-height: 0;
  min-width: 0;
  max-height: calc(100dvh - 160px);
  overflow-y: auto;
  overscroll-behavior-y: contain;
  touch-action: pan-y;
  padding-right: 7px;
  scrollbar-width: thin;
  scrollbar-color: rgba(77, 238, 234, .6) rgba(2, 13, 26, .7);
  @media (max-width: 600px) { max-height: calc(100dvh - 136px); }
`;

export const RunFooterActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
`;
