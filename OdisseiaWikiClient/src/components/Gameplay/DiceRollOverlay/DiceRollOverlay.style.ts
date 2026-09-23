import styled from 'styled-components';

export const Overlay = styled.div`
  position: fixed;
  z-index: 12050;
  inset: 0;
  overflow: hidden;
  isolation: isolate;
  background: rgba(0, 4, 12, .55);
  cursor: pointer;

  &::before, &::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(transparent, color-mix(in srgb, var(--clearneonBlue) 70%, transparent), transparent);
    pointer-events: none;
  }
  &::before { left: max(3px, env(safe-area-inset-left)); }
  &::after { right: max(3px, env(safe-area-inset-right)); }
`;

export const DiceStage = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
`;

export const Dice = styled.div<{ $interactive: boolean; $dragging: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 112px;
  height: 112px;
  perspective: 760px;
  perspective-origin: center center;
  transform-style: preserve-3d;
  will-change: transform;
  pointer-events: ${({ $interactive }) => $interactive ? 'auto' : 'none'};
  cursor: ${({ $interactive, $dragging }) => !$interactive ? 'default' : $dragging ? 'grabbing' : 'grab'};
  touch-action: none;
  user-select: none;
`;

export const DiceMesh = styled.div`
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  will-change: transform;
`;

export const DieStatus = styled.span<{ $discarded: boolean }>`
  position: absolute;
  left: 50%;
  bottom: -23px;
  padding: 3px 7px;
  border: 1px solid ${({ $discarded }) => $discarded ? 'var(--lightGrey)' : 'var(--clearneonGreen)'};
  border-radius: 2px;
  color: ${({ $discarded }) => $discarded ? 'var(--lightGrey)' : 'var(--clearneonGreen)'};
  background: rgba(1, 11, 22, .92);
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
  transform: translateX(-50%);
`;

export const DiceFace = styled.div<{ $discarded: boolean; $selected: boolean }>`
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  transform-style: preserve-3d;

  svg {
    width: 100%;
    height: 100%;
    overflow: visible;
    filter: drop-shadow(0 0 4px rgba(0, 188, 255, .4));
  }
  polygon {
    fill: rgba(2, 23, 40, .97);
    stroke: ${({ $discarded }) => $discarded ? 'var(--lightGrey)' : 'var(--clearneonBlue)'};
    stroke-width: 1.65px;
    stroke-linejoin: round;
  }
  text {
    fill: ${({ $discarded, $selected }) => $discarded
      ? 'var(--lightGrey)'
      : $selected ? 'var(--clearneonYellow)' : 'var(--whitesmoke)'};
    font-family: 'Cyberpunk Is Not Dead', sans-serif;
    font-size: 26px;
    font-weight: 700;
    paint-order: stroke;
    stroke: rgba(0, 19, 35, .96);
    stroke-width: 3px;
    filter: drop-shadow(0 0 3px var(--clearneonBlue));
  }
`;

export const ResultStrip = styled.div<{ $tone: 'success' | 'failure' | 'neutral' | 'error'; $atTop: boolean }>`
  --result-color: ${({ $tone }) => $tone === 'success' ? 'var(--clearneonGreen)'
    : $tone === 'failure' || $tone === 'error' ? 'var(--clearneonRed)' : 'var(--clearneonBlue)'};
  position: absolute;
  z-index: 2;
  top: ${({ $atTop }) => $atTop ? 'max(24px, env(safe-area-inset-top))' : 'auto'};
  bottom: ${({ $atTop }) => $atTop ? 'auto' : 'max(clamp(72px, 12dvh, 150px), calc(env(safe-area-inset-bottom) + 20px))'};
  left: 50%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  width: min(560px, calc(100vw - 32px));
  max-height: min(34dvh, 180px);
  padding: 10px 14px;
  overflow-y: auto;
  border: 1px solid color-mix(in srgb, var(--result-color) 55%, transparent);
  border-left: 3px solid var(--result-color);
  border-radius: 3px;
  color: var(--whitesmoke);
  background: rgba(1, 11, 22, .96);
  box-shadow: 0 9px 28px rgba(0, 0, 0, .45);
  transform: translateX(-50%);
  scrollbar-width: thin;
  scrollbar-color: var(--clearneonBlue) rgba(0, 23, 43, .72);

  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-track { background: rgba(0, 23, 43, .72); }
  &::-webkit-scrollbar-thumb { background: var(--clearneonBlue); }

  > div { display: grid; gap: 2px; min-width: 0; }
  small { color: var(--lightGrey); font-size: .69rem; }
  > small { flex: 0 1 130px; text-align: right; line-height: 1.35; }
  strong { color: var(--result-color); font-size: clamp(.85rem, 3vw, 1.05rem); overflow-wrap: anywhere; }
  span { color: var(--lightGrey); font-size: .72rem; overflow-wrap: anywhere; }
  @media (max-width: 520px) {
    align-items: flex-start;
    flex-direction: column;
    width: calc(100vw - 24px);
    padding: 9px 11px;
    > small { flex: none; text-align: left; }
  }
`;
