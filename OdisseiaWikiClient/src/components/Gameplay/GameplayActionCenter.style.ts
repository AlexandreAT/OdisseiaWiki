import styled, { css, keyframes } from 'styled-components';
import { HudFrame } from '../Generic/HudFrame/HudFrame';

const framedCorners = css`
  > span:nth-of-type(1) { top: 0; left: 0; }
  > span:nth-of-type(2) { top: 0; right: 0; }
  > span:nth-of-type(3) { bottom: 0; left: 0; }
  > span:nth-of-type(4) { right: 0; bottom: 0; }
  > span:nth-of-type(5) { top: 0; }
  > span:nth-of-type(6) { right: 0; }
  > span:nth-of-type(7) { bottom: 0; }
  > span:nth-of-type(8) { left: 0; }
  > span:nth-of-type(-n + 8) { z-index: 10; }
`;

const gameplayScrollbar = css`
  scrollbar-width: thin;
  scrollbar-color: var(--clearneonBlue) rgba(0, 23, 43, 0.72);

  &::-webkit-scrollbar { width: 9px; }
  &::-webkit-scrollbar-track { background: rgba(0, 23, 43, 0.72); }
  &::-webkit-scrollbar-thumb {
    border-radius: 10px;
    background: var(--clearneonBlue);
  }
`;

const revealPanel = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const GameplayBackdrop = styled.div<{ $concealed?: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 11000;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right))
    max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  background: rgba(0, 3, 10, 0.78);
  backdrop-filter: blur(3px);
  ${({ $concealed }) => $concealed && css`
    visibility: hidden;
    pointer-events: none;
  `}

  @media (max-width: 767px) {
    padding: max(8px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right))
      max(8px, env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left));
  }
`;

export const GameplayPanelShell = styled.div`
  box-sizing: border-box;
  width: min(1120px, 100%);
  height: min(900px, 100%);
  max-height: 100%;
  min-height: 0;
  animation: ${revealPanel} 180ms ease-out both;

  @media (max-width: 767px) {
    width: 100%;
    height: 100%;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const GameplayPanel = styled(HudFrame)`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  border-radius: 0;
  color: var(--whitesmoke);
  background: ${({ neon }) => neon
    ? 'linear-gradient(145deg, rgba(4, 22, 42, 0.99), rgba(0, 5, 14, 0.99))'
    : 'linear-gradient(145deg, rgba(1, 13, 28, 0.99), rgba(0, 5, 14, 0.99))'};
  ${framedCorners}
`;

export const GameplayHeader = styled.header`
  position: relative;
  z-index: 5;
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  min-height: 76px;
  padding: 15px 62px 15px 22px;
  border-bottom: 1px solid rgba(0, 210, 255, 0.32);
  background: rgba(0, 7, 18, 0.94);

  h2 {
    margin: 0;
    color: var(--clearneonBlue);
    font-family: 'DO Futuristic', sans-serif;
    font-size: clamp(1.15rem, 3vw, 1.65rem);
    font-weight: 100;
    letter-spacing: 1.4px;
    line-height: 1.15;
  }

  p {
    margin: 5px 0 0;
    color: var(--lightGrey);
    font-size: 0.76rem;
  }

  @media (max-width: 480px) {
    padding: 12px 52px 12px 14px;
  }
`;

export const CloseButton = styled.button`
  display: inline-grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 1px solid var(--clearneonBlue);
  border-radius: 4px;
  color: var(--clearneonBlue);
  background: rgba(0, 16, 32, 0.82);
  cursor: pointer;

  &:focus-visible { outline: 2px solid var(--clearneonYellow); outline-offset: 2px; }
  @media (hover: hover) {
    &:hover { color: var(--black); background: var(--clearneonBlue); }
  }
`;

export const GameplayBody = styled.div`
  position: relative;
  z-index: 4;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  min-width: 0;
  margin: 0 8px 48px 0;
  padding: 16px 20px 24px;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  ${gameplayScrollbar}

  @media (max-width: 480px) {
    margin-right: 5px;
    margin-bottom: 42px;
    padding: 12px 12px 18px;
  }
`;

export const RollDialogBackdrop = styled.div<{ $concealed?: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 11020;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right))
    max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  overflow-y: auto;
  overscroll-behavior: contain;
  background: rgba(0, 3, 10, 0.86);
  backdrop-filter: blur(4px);
  ${({ $concealed }) => $concealed && css`
    visibility: hidden;
    pointer-events: none;
  `}

  @media (max-width: 767px) {
    padding: max(8px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right))
      max(8px, env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left));
  }
`;

export const RollDialogPanel = styled(HudFrame)`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: min(560px, 100%);
  max-height: min(740px, calc(100dvh - 32px));
  min-height: 0;
  color: var(--whitesmoke);
  background: ${({ neon }) => neon
    ? 'linear-gradient(145deg, rgba(4, 22, 42, 0.99), rgba(0, 5, 14, 0.99))'
    : 'linear-gradient(145deg, rgba(1, 13, 28, 0.99), rgba(0, 5, 14, 0.99))'};
  ${framedCorners}

  @media (max-width: 767px) {
    max-height: calc(100dvh - 16px);
  }
`;

export const RollDialogHeader = styled.header`
  position: relative;
  z-index: 5;
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 70px;
  padding: 14px 60px 14px 22px;
  border-bottom: 1px solid rgba(0, 210, 255, 0.32);
  background: rgba(0, 7, 18, 0.94);

  h2, h3 {
    margin: 0;
    color: var(--clearneonBlue);
    font-family: 'DO Futuristic', sans-serif;
    font-size: clamp(1rem, 3vw, 1.3rem);
    font-weight: 100;
    line-height: 1.2;
  }

  p { margin: 5px 0 0; color: var(--lightGrey); font-size: 0.72rem; }

  @media (max-width: 480px) {
    padding: 12px 52px 12px 14px;
  }
`;

export const RollDialogHeaderActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 7px;
`;

export const FavoriteRollButton = styled(CloseButton)<{ $active: boolean }>`
  width: 40px;
  height: 40px;
  color: ${({ $active }) => $active ? '#ffd65a' : 'var(--clearneonBlue)'};
  border-color: ${({ $active }) => $active ? 'rgba(255, 214, 90, .75)' : 'var(--clearneonBlue)'};

  &:disabled { opacity: .55; cursor: wait; }
`;

export const RollDialogBody = styled.div`
  position: relative;
  z-index: 4;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  min-height: 0;
  margin: 0 8px 48px 0;
  padding: 18px 20px 24px;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  ${gameplayScrollbar}

  @media (max-width: 480px) {
    margin-right: 5px;
    margin-bottom: 42px;
    padding: 14px 12px 18px;
  }
`;

export const ContextRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 12px;
  min-width: 0;

  > * { min-width: 0; }

  @media (max-width: 520px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const SessionState = styled.span<{ $active: boolean }>`
  align-self: center;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 32px;
  padding: 6px 10px;
  border: 1px solid ${({ $active }) => $active ? 'var(--clearneonGreen)' : 'var(--grey)'};
  border-radius: 4px;
  color: ${({ $active }) => $active ? 'var(--clearneonGreen)' : 'var(--lightGrey)'};
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  &::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: ${({ $active }) => $active ? '0 0 7px currentColor' : 'none'};
  }
`;

export const Tabs = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  padding: 5px;
  border: 1px solid rgba(0, 210, 255, 0.25);
  background: rgba(0, 4, 12, 0.68);

  @media (max-width: 520px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const TabButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 44px;
  padding: 8px;
  border: 1px solid ${({ $active }) => $active ? 'var(--clearneonBlue)' : 'transparent'};
  color: ${({ $active }) => $active ? 'var(--clearneonBlue)' : 'var(--lightGrey)'};
  background: ${({ $active }) => $active ? 'rgba(0, 184, 255, 0.11)' : 'transparent'};
  font: inherit;
  font-size: clamp(0.66rem, 2.5vw, 0.8rem);
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;

  svg { width: 18px; height: 18px; }
  &:focus-visible { outline: 2px solid var(--clearneonYellow); outline-offset: -1px; }
`;

export const WorkArea = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
  align-items: start;
  min-height: 0;

  > * { min-width: 0; }

`;

export const ActionWorkspace = styled.section`
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
`;

export const GroupTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;

  h3 {
    margin: 0;
    color: var(--clearneonBlue);
    font-family: 'DO Futuristic', sans-serif;
    font-size: 0.9rem;
    font-weight: 100;
    letter-spacing: 0.8px;
  }

  small { color: var(--lightGrey); font-size: 0.67rem; }
`;

export const AttributeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 420px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const AttributeButton = styled.button<{ $selected: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-height: 58px;
  padding: 9px 11px;
  border: 1px solid ${({ $selected }) => $selected ? 'var(--clearneonBlue)' : 'rgba(0, 210, 255, 0.26)'};
  border-left-width: 3px;
  color: var(--whitesmoke);
  background: ${({ $selected }) => $selected ? 'rgba(0, 184, 255, 0.13)' : 'rgba(0, 9, 21, 0.72)'};
  font: inherit;
  text-align: left;
  cursor: pointer;

  span { min-width: 0; overflow-wrap: anywhere; }
  strong { color: var(--clearneonBlue); font-size: 1.05rem; }
  &:focus-visible { outline: 2px solid var(--clearneonYellow); outline-offset: 2px; }
`;

export const ComposerCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  padding: 14px;
  border: 1px solid rgba(0, 210, 255, 0.34);
  background: rgba(0, 7, 18, 0.82);

  h3 { margin: 0; color: var(--clearneonBlue); font-size: 0.95rem; }
  > p { margin: -5px 0 0; color: var(--lightGrey); font-size: 0.74rem; line-height: 1.45; }
`;

export const ComposerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  > * { min-width: 0; max-width: 100%; }
  .full { grid-column: 1 / -1; }
  .full > * { width: 100%; max-width: 100%; }

  @media (max-width: 440px) {
    grid-template-columns: minmax(0, 1fr);
    .full { grid-column: auto; }
  }
`;

export const FormulaPreview = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 42px;
  padding: 9px 11px;
  border-left: 3px solid var(--clearneonViolet);
  color: var(--lightGrey);
  background: rgba(112, 0, 255, 0.08);
  font-size: 0.72rem;

  span, strong { min-width: 0; overflow-wrap: anywhere; }
  strong { color: var(--clearneonViolet); text-align: right; }
`;

export const SubmitButton = styled.button<{ $accent?: 'blue' | 'yellow' | 'pink' }>`
  --gameplay-accent: ${({ $accent }) => $accent === 'yellow'
    ? 'var(--clearneonYellow)'
    : $accent === 'pink'
      ? 'var(--clearneonPink)'
      : 'var(--clearneonBlue)'};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 10px 16px;
  border: 1px solid var(--gameplay-accent);
  border-radius: 4px;
  color: var(--gameplay-accent);
  background: color-mix(in srgb, var(--gameplay-accent) 7%, rgba(0, 5, 14, 0.9));
  font-family: 'Cyberpunk Is Not Dead', sans-serif;
  font-size: 0.82rem;
  letter-spacing: 0.05em;
  cursor: pointer;

  &:disabled { opacity: 0.42; cursor: not-allowed; }
  &:focus-visible { outline: 2px solid var(--whitesmoke); outline-offset: 2px; }
  @media (hover: hover) {
    &:hover:not(:disabled) { box-shadow: 0 0 10px color-mix(in srgb, var(--gameplay-accent) 46%, transparent); }
  }
`;

export const XpSourceList = styled.div`
  display: grid;
  gap: 7px;
`;

export const XpSourceButton = styled(AttributeButton)`
  grid-template-columns: minmax(0, 1fr);
  min-height: 54px;

  small { display: block; margin-top: 3px; color: var(--lightGrey); line-height: 1.35; }
`;

export const InlineMessage = styled.div<{ $kind?: 'error' | 'warning' | 'info' }>`
  padding: 10px 12px;
  border-left: 3px solid ${({ $kind }) => $kind === 'error'
    ? 'var(--clearneonRed)'
    : $kind === 'warning'
      ? 'var(--clearneonYellow)'
      : 'var(--clearneonBlue)'};
  color: ${({ $kind }) => $kind === 'error'
    ? 'var(--clearneonRed)'
    : $kind === 'warning'
      ? 'var(--clearneonYellow)'
      : 'var(--lightGrey)'};
  background: rgba(0, 5, 14, 0.72);
  font-size: 0.75rem;
  line-height: 1.45;
`;

export const ResultCard = styled.div<{ $outcome?: 'success' | 'failure' | 'neutral' }>`
  --result-accent: ${({ $outcome }) => $outcome === 'success'
    ? 'var(--clearneonGreen)'
    : $outcome === 'failure'
      ? 'var(--clearneonRed)'
      : 'var(--clearneonBlue)'};
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--result-accent);
  background: color-mix(in srgb, var(--result-accent) 7%, rgba(0, 5, 14, 0.95));

  header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; min-width: 0; }
  h3 { min-width: 0; margin: 0; color: var(--result-accent); font-size: 0.92rem; overflow-wrap: anywhere; }
  strong { color: var(--result-accent); font-size: 1.4rem; }
  p { margin: 0; color: var(--lightGrey); font-size: 0.75rem; overflow-wrap: anywhere; }
`;

export const RollDialogResult = styled(ResultCard)`
  padding: 18px;
  text-align: center;

  header { justify-content: center; }
  strong { display: block; font-size: clamp(1.8rem, 6vw, 2.8rem); line-height: 1.1; }

  @media (max-width: 480px) {
    padding: 14px;
  }
`;

export const Badge = styled.span<{ $tone?: 'blue' | 'pink' | 'yellow' | 'grey' }>`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 22px;
  padding: 3px 7px;
  border: 1px solid ${({ $tone }) => $tone === 'pink'
    ? 'var(--clearneonPink)'
    : $tone === 'yellow'
      ? 'var(--clearneonYellow)'
      : $tone === 'grey'
        ? 'var(--grey)'
        : 'var(--clearneonBlue)'};
  border-radius: 999px;
  color: ${({ $tone }) => $tone === 'pink'
    ? 'var(--clearneonPink)'
    : $tone === 'yellow'
      ? 'var(--clearneonYellow)'
      : $tone === 'grey'
        ? 'var(--lightGrey)'
        : 'var(--clearneonBlue)'};
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

export const HistoryPanel = styled.aside`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  min-height: 160px;
  border: 1px solid rgba(0, 210, 255, 0.3);
  background: rgba(0, 5, 14, 0.72);
`;

export const HistoryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 12px;
  border-bottom: 1px solid rgba(0, 210, 255, 0.24);

  h3 { margin: 0; color: var(--clearneonBlue); font-size: 0.86rem; }
  button {
    display: inline-grid;
    width: 36px;
    height: 36px;
    place-items: center;
    border: 1px solid rgba(0, 210, 255, 0.34);
    color: var(--clearneonBlue);
    background: transparent;
    cursor: pointer;
  }
`;

export const HistoryList = styled.div`
  display: flex;
  flex-direction: column-reverse;
  flex: 1 1 auto;
  gap: 8px;
  min-height: 0;
  min-width: 0;
  padding: 10px;
  overflow: visible;

  @media (max-width: 900px) {
    min-height: 110px;
  }
`;

export const HistoryCard = styled.article<{ $manual: boolean }>`
  display: grid;
  gap: 7px;
  min-width: 0;
  padding: 10px 11px;
  border: 1px solid ${({ $manual }) => $manual ? 'rgba(255, 235, 0, 0.36)' : 'rgba(0, 210, 255, 0.28)'};
  border-left: 3px solid ${({ $manual }) => $manual ? 'var(--clearneonYellow)' : 'var(--clearneonBlue)'};
  background: rgba(0, 10, 23, 0.84);

  header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 8px; min-width: 0; }
  h4 { min-width: 0; margin: 0; color: var(--whitesmoke); font-size: 0.76rem; line-height: 1.3; overflow-wrap: anywhere; }
  time { color: var(--grey); font-size: 0.6rem; white-space: nowrap; }
  p { margin: 0; color: var(--lightGrey); font-size: 0.69rem; line-height: 1.4; overflow-wrap: anywhere; }
  strong { color: var(--clearneonBlue); }
`;

export const CardBadges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
`;

export const LoadMoreButton = styled(SubmitButton)`
  min-height: 38px;
  margin: 0 10px 10px;
`;

export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

export const LoadingBlock = styled.div`
  display: grid;
  min-height: 150px;
  place-items: center;
`;

export const FieldHint = styled.small`
  display: block;
  margin-top: -6px;
  color: var(--grey);
  font-size: 0.65rem;
  line-height: 1.35;
`;

export const ManualMarker = css`
  color: var(--clearneonYellow);
`;
