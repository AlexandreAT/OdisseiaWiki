import styled, { css, keyframes } from 'styled-components';

const hoverGlow = keyframes`
  from { filter: drop-shadow(0 0 2px rgba(77, 238, 234, .22)); }
  to { filter: drop-shadow(0 0 6px rgba(77, 238, 234, .48)); }
`;

const routeTravel = keyframes`
  from { stroke-dashoffset: 100; }
  to { stroke-dashoffset: 0; }
`;

const lockPulse = keyframes`
  from { opacity: .75; filter: drop-shadow(0 0 1px rgba(255, 220, 70, .2)); }
  to { opacity: 1; filter: drop-shadow(0 0 3px rgba(255, 220, 70, .45)); }
`;

const rescueHintReveal = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const MapWrap = styled.div`
  position: relative;
  display: grid;
  place-items: center;
  min-width: 0;
`;

export const MapDrawing = styled.svg<{ $neon: boolean }>`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 700px;
  min-height: 280px;
  border-radius: 8px;

  .map-edge {
    fill: none;
    stroke: var(--deepgray);
    stroke-width: 1.6;
    stroke-linecap: round;
    opacity: .7;
    transition: stroke 180ms ease, stroke-width 180ms ease, opacity 180ms ease, filter 180ms ease;
  }
  .map-edge[data-route-state='possible'] {
    stroke: var(--clearneonBlue);
    stroke-width: 2;
    opacity: .9;
  }
  .map-edge[data-route-state='completed'] { stroke: var(--neonBlue); opacity: .8; }
  .map-edge[data-route-state='ignored'] { stroke: var(--deepgray); opacity: .8; }
  .map-edge[data-route-state='blocked'] { stroke: color-mix(in srgb, var(--deepgray) 75%, var(--neonBlue)); opacity: .58; }
  .map-edge[data-highlighted='true'] {
    stroke: #b8f5ff;
    stroke-width: 3;
    opacity: 1;
    ${({ $neon }) => $neon && `
      filter: drop-shadow(0 0 3px rgba(77, 238, 234, .5)) drop-shadow(0 0 6px rgba(0, 187, 255, .3));
    `}
  }
  g[data-node-id] { outline: none; transition: filter 180ms ease, opacity 180ms ease; }
  g[data-available='true'] { cursor: pointer; }
  g[data-hovered='true']:is([data-current='true'], [data-available='true']),
  g[data-linked='true'] {
    filter: drop-shadow(0 0 3px rgba(77, 238, 234, .3));
    ${({ $neon }) => $neon && css`animation: ${hoverGlow} 850ms ease-in-out infinite alternate;`}
  }
  g:focus-visible :is(rect, .node-portrait-border) { stroke: #fff; stroke-width: 3; }
  rect {
    fill: #071a2c;
    stroke: var(--neonBlue);
    stroke-width: 2;
    transition: fill 180ms ease, stroke 180ms ease;
  }
  g[data-state='DISPONIVEL'] rect { fill: #062535; stroke: var(--clearneonBlue); }
  g[data-state='SELECIONADO'] rect { fill: #092b3c; stroke: var(--clearneonBlue); }
  g[data-state='CONCLUIDO'] rect { fill: #092238; stroke: var(--neonBlue); }
  g[data-state='BLOQUEADO'] rect {
    fill: #101820;
    stroke: color-mix(in srgb, var(--deepgray) 80%, var(--neonBlue));
  }
  g[data-state='IGNORADO'] { opacity: .55; }
  g[data-state='IGNORADO'] rect {
    fill: #10151b;
    stroke: var(--deepgray);
  }
  .node-portrait { fill: #071a2c; }
  .npc-lock-frame { fill: rgba(4, 22, 42, .94); stroke: var(--clearneonBlue); stroke-width: 1; }
  .npc-lock-trace { fill: none; stroke: var(--clearneonYellow); stroke-width: .8; stroke-linecap: round; opacity: .65; }
  .npc-lock-icon { fill: none; stroke: var(--clearneonYellow); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
  .npc-rescue-hint rect { fill: rgba(1, 10, 24, .98); stroke: var(--clearneonBlue); stroke-width: .7; }
  .npc-rescue-hint text { font: 12px 'Lato', sans-serif; fill: var(--whitesmoke); }
  .npc-rescue-hint { animation: ${rescueHintReveal} 140ms ease-out both; }
  ${({ $neon }) => $neon && css`
    .npc-lock-frame { filter: drop-shadow(0 0 2px rgba(77, 238, 234, .25)); }
    .npc-lock-icon { animation: ${lockPulse} 2.6s ease-in-out infinite alternate; }
  `}
  :root[data-motion='reduced'] & {
    .npc-lock-icon { animation: none; filter: none; }
    .npc-rescue-hint { animation: none; }
  }
  .node-portrait-border { fill: none; stroke: var(--neonBlue); stroke-width: 2; transition: stroke 180ms ease; }
  g[data-state='DISPONIVEL'] .node-portrait-border,
  g[data-state='SELECIONADO'] .node-portrait-border { stroke: var(--clearneonBlue); }
  g[data-state='BLOQUEADO'] .node-portrait-border {
    stroke: color-mix(in srgb, var(--deepgray) 80%, var(--neonBlue));
  }
  g[data-state='IGNORADO'] .node-portrait-border { stroke: var(--deepgray); }
  ${({ $neon }) => $neon && `
    g[data-current='true'] rect,
    g[data-current='true'] .node-portrait-border {
      stroke: var(--clearneonViolet);
      filter: drop-shadow(0 0 4px rgba(194, 91, 235, .48));
    }
  `}
  g[data-state='DISPONIVEL']:hover :is(rect, .node-portrait-border) { stroke: #fff; }
  text {
    fill: #e9f8ff;
    font-family: 'Orbitron', sans-serif;
    font-size: 13px;
    font-weight: 700;
    pointer-events: none;
  }
  .area-name { fill: var(--clearneonBlue); font-size: 11px; letter-spacing: .08em; }
  g[data-state='IGNORADO'] text { fill: #72808b; }

  .route-effects :is(.route-light, .route-light-blur) { pointer-events: none; }
  .route-effects .route-light-blur {
    fill: none;
    stroke: rgba(77, 238, 234, .55);
    stroke-width: 9;
    stroke-linecap: round;
    stroke-dasharray: 3 97;
    filter: blur(4px);
    animation: ${routeTravel} 4.8s linear infinite;
  }
  .route-effects .route-light {
    fill: none;
    stroke: #c5ffff;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-dasharray: 3 97;
    filter: drop-shadow(0 0 4px rgba(77, 238, 234, .75));
    animation: ${routeTravel} 4.8s linear infinite;
  }
`;

