import { css } from 'styled-components';

/** Shared with the character action center: one surface, frame alignment and scrollbar. */
export const hudModalSurface = css<{ neon: boolean }>`
  box-sizing: border-box;
  min-width: 0;
  min-height: 0;
  border-radius: 0;
  color: var(--whitesmoke);
  background: ${({ neon }) => neon
    ? 'linear-gradient(145deg, rgba(4, 22, 42, 0.99), rgba(0, 5, 14, 0.99))'
    : 'linear-gradient(145deg, rgba(1, 13, 28, 0.99), rgba(0, 5, 14, 0.99))'};
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

export const hudModalScrollbar = css`
  scrollbar-width: thin;
  scrollbar-color: var(--clearneonBlue) rgba(0, 23, 43, 0.72);
  &::-webkit-scrollbar { width: 9px; }
  &::-webkit-scrollbar-track { background: rgba(0, 23, 43, 0.72); }
  &::-webkit-scrollbar-thumb { border-radius: 10px; background: var(--clearneonBlue); }
`;

export const hudModalHeader = css`
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
  h2, .modal-title {
    margin: 0;
    color: var(--clearneonBlue);
    font-family: 'DO Futuristic', sans-serif;
    font-size: clamp(1.15rem, 3vw, 1.65rem);
    font-weight: 100;
    letter-spacing: 1.4px;
    line-height: 1.15;
    overflow-wrap: anywhere;
  }
  p { margin: 5px 0 0; color: var(--lightGrey); font-size: 0.76rem; }
  @media (max-width: 480px) { padding: 12px 52px 12px 14px; }
`;

export const hudModalCloseButton = css`
  display: inline-grid;
  flex: none;
  width: 44px;
  height: 44px;
  padding: 0;
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
