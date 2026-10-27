import styled, { css, keyframes } from 'styled-components';
import { HudFrame } from '../HudFrame';
import { FallbackImage } from '../FallbackImage/FallbackImage';
import { hudModalCloseButton } from '../HudFrame/modalAppearance';

const draw = keyframes`from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; }`;
const appear = keyframes`from { opacity: 0; transform: scale(.94); filter: brightness(1.6); } to { opacity: 1; transform: none; filter: none; }`;
const scan = keyframes`from { transform: translateY(-110%); } to { transform: translateY(110%); }`;

export const Projection = styled.div<{ $pinned: boolean; $reduced: boolean; $neon: boolean; $closing: boolean }>`
  position: fixed; inset: 0; z-index: 16000; pointer-events: ${({ $pinned }) => $pinned ? 'auto' : 'none'};
  background: ${({ $pinned }) => $pinned ? 'rgba(0, 5, 14, .55)' : 'transparent'};
  opacity: ${({ $closing }) => $closing ? 0 : 1};
  transition: opacity ${({ $reduced }) => $reduced ? '0s' : '.14s'} ease;
  > svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
  .projection-line { fill: none; stroke: var(--hologram-accent, var(--clearneonBlue)); stroke-width: 1.5;
    stroke-linecap: round; stroke-linejoin: round;
    ${({ $neon }) => $neon && 'filter: drop-shadow(0 0 4px var(--hologram-accent, var(--clearneonBlue)));'}
    ${({ $reduced }) => !$reduced && css`stroke-dasharray: 1; animation: ${draw} .22s ease-out both;`}
  }
  .projection-frame { ${({ $reduced }) => !$reduced && 'animation-duration: .4s; animation-delay: .16s;'} }
  .projection-origin { fill: var(--hologram-accent, var(--clearneonBlue)); }
`;

export const ProjectionPanel = styled(HudFrame)<{ $reduced: boolean; $hasDescription: boolean }>`
  position: absolute; box-sizing: border-box; padding: 16px;
  display: grid; grid-template-rows: auto minmax(0, 1fr) ${({ $hasDescription }) => $hasDescription ? 'auto' : ''}; gap: 12px;
  min-width: 0; min-height: 0; pointer-events: auto; overflow: hidden;
  background: linear-gradient(145deg, rgba(3, 25, 43, .99), rgba(0, 6, 17, .99));
  color: var(--whitesmoke);
  ${({ $reduced }) => !$reduced && css`animation: ${appear} .32s .16s ease-out both;`}
  &::after { content: ''; position: absolute; inset: 0; pointer-events: none;
    background: repeating-linear-gradient(0deg, transparent, transparent 3px, var(--hologram-scan-lines, rgba(77, 238, 234, .035)) 4px); }
  &::before { content: ''; position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(transparent 40%, var(--hologram-scan, rgba(77, 238, 234, .13)) 50%, transparent 60%);
    ${({ $reduced }) => $reduced ? 'display: none;' : css`animation: ${scan} .8s .2s ease-out both;`}
  }
  header { position: relative; z-index: 4; display: flex; align-items: center; gap: 12px; min-width: 0; }
  h3 { margin: 0; flex: 1; min-width: 0; overflow-wrap: anywhere; font: 400 clamp(16px, 3vw, 23px)/1.2 'DO Futuristic', sans-serif; color: var(--hologram-accent, var(--clearneonBlue)); }
  button { ${hudModalCloseButton} flex: 0 0 auto; width: 32px; height: 32px;
    color: var(--hologram-accent, var(--clearneonBlue)); border-color: var(--hologram-accent, var(--clearneonBlue));
    @media (hover: hover) { &:hover { background: var(--hologram-accent, var(--clearneonBlue)); } }
  }
`;

export const ProjectionDescription = styled.p`
  position: relative; z-index: 4; margin: 0; min-height: 0; max-height: 6em;
  overflow-y: auto; overflow-wrap: anywhere; white-space: pre-wrap;
  font: 400 14px/1.45 'Lato', sans-serif; color: inherit;
  scrollbar-width: thin; scrollbar-color: var(--hologram-accent, var(--clearneonBlue)) rgba(0, 23, 43, .72);
  &:focus-visible { outline: 1px solid var(--hologram-accent, var(--clearneonBlue)); outline-offset: 2px; }
`;

export const ProjectionContent = styled.div`
  position: relative; z-index: 4; min-width: 0; min-height: 0; overflow: auto;
  overflow-wrap: anywhere; color: inherit;
  scrollbar-width: thin; scrollbar-color: var(--hologram-accent, var(--clearneonBlue)) rgba(0, 23, 43, .72);
  &:focus-visible { outline: 1px solid var(--hologram-accent, var(--clearneonBlue)); outline-offset: -2px; }
`;

export const ProjectionImage = styled(FallbackImage)`
  width: 100%; height: 100%; min-width: 0; min-height: 0;
  color: var(--hologram-accent, var(--clearneonBlue));
  background: radial-gradient(ellipse, var(--hologram-image-glow, rgba(0, 187, 255, .09)), transparent 70%);
  > img { object-fit: var(--hologram-image-fit, contain); }
  > svg { width: 52%; height: 52%; min-width: 0; min-height: 0; opacity: .85; }
`;
