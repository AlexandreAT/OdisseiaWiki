import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0%, 100% { color: var(--neonYellow); filter: drop-shadow(0 0 1px var(--neonYellow)); transform: translateY(0) scale(1); }
  50% { color: var(--clearneonYellow); filter: drop-shadow(0 0 8px var(--neonYellow)); transform: translateY(-2px) scale(1.12); }
`;
const reveal = keyframes`
  from { opacity: 0; transform: translateY(18px) scale(.9); filter: brightness(2); }
  to { opacity: 1; transform: none; filter: brightness(1); }
`;
export const UpgradeArrow = styled.button`
  display: inline-grid; place-items: center; vertical-align: middle;
  border: 0; padding: 0 6px; background: none; color: var(--neonYellow); cursor: pointer;
  animation: ${pulse} 1.35s ease-in-out infinite;
  svg { font-size: 1.55rem; }
  &:focus-visible { outline: 1px solid currentColor; }
  :root[data-motion='reduced'] & { animation: none; }
`;
export const RewardsBody = styled.div`
  display: grid; gap: 18px; padding: 6px 4px 20px; color: var(--lightGray, #e4edf3);
  h3 { margin: 0; color: var(--clearneonBlue); }
  p { margin: 0; line-height: 1.5; }
  .points { color: var(--neonYellow); }
`;
export const AttributeGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(112px, 1fr)); gap: 18px 12px;
  .attribute-tile { position: relative; min-width: 0; display: grid; justify-items: center; }
  .attribute-hex { position: relative; width: min(100%, 142px); aspect-ratio: 1.15;
    display: grid; place-content: center; justify-items: center; gap: 6px;
    color: var(--clearneonBlue); background: color-mix(in srgb, var(--clearneonBlue) 55%, transparent);
    clip-path: polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%);
  }
  .attribute-hex::before { content: ''; position: absolute; inset: 2px; z-index: -1;
    background: rgba(0, 18, 29, .94);
    clip-path: polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%);
  }
  .attribute-code { font-weight: 800; letter-spacing: .11em; font-size: 1.04rem; }
  .attribute-value { display: flex; align-items: center; justify-content: center; gap: 4px;
    font-size: 1.5rem; line-height: 1; font-weight: 700; font-variant-numeric: tabular-nums; }
  button { border: 0; background: none; cursor: pointer; }
  .attribute-info { color: var(--clearneonBlue); min-height: 30px; display: inline-grid; place-items: center; }
  .attribute-info:hover, .attribute-info:focus-visible { filter: drop-shadow(0 0 6px currentColor); }
  .attribute-up { color: var(--neonYellow); padding: 0; display: inline-grid; place-items: center;
    animation: ${pulse} 1.45s ease-in-out infinite; }
  .attribute-up svg { font-size: 1.35rem; filter: drop-shadow(0 0 3px currentColor); }
  .attribute-up:hover, .attribute-up:focus-visible { filter: drop-shadow(0 0 8px var(--neonYellow)); }
  .attribute-up:disabled { opacity: .4; cursor: wait; }
  :root[data-motion='reduced'] & { .attribute-up { animation: none; } }
`;
export const AttributePopover = styled.div<{ $top: number; $left: number }>`
  position: fixed; z-index: 12000; width: min(310px, calc(100vw - 24px)); max-height: min(290px, 60vh);
  top: ${({ $top }) => `${$top}px`}; left: ${({ $left }) => `${$left}px`};
  overflow-y: auto; padding: 13px 15px; color: var(--lightGray, #e4edf3);
  border: 1px solid var(--clearneonBlue); background: rgba(0, 15, 27, .98);
  box-shadow: 0 10px 30px rgba(0, 0, 0, .55), 0 0 14px color-mix(in srgb, var(--clearneonBlue) 15%, transparent);
  h4 { color: var(--clearneonBlue); margin: 0 0 8px; }
  p { margin: 0 0 8px; line-height: 1.45; }
  p:last-child { margin-bottom: 0; }
  strong { color: var(--neonYellow); }
`;
export const LootGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(125px, 1fr)); gap: 14px;
  align-items: start;
  min-width: 0;
  > article {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-content: start;
    min-width: 0;
    animation: ${reveal} .5s ease-out both;
    /* A button's intrinsic width must not depend on its image or item name. */
    > button { width: 100%; min-width: 0; box-sizing: border-box; }
  }
  :root[data-motion='reduced'] & { > article { animation: none; } }
`;
