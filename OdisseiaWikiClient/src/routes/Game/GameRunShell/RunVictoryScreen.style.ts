import styled, { css, keyframes } from 'styled-components';
import { cyberButtonsFillWidth } from '../../../components/Generic/HighlightButton/HighlightButton.styles';

const reveal = keyframes`
  from { opacity: 0; transform: translateY(22px) scale(.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;
const scan = keyframes`
  from { background-position: center 100%; }
  to { background-position: center 0; }
`;
const orbit = keyframes`
  to { transform: rotate(360deg); }
`;
const pulse = keyframes`
  50% { text-shadow: 0 0 26px var(--neonBlue), 0 0 48px var(--neonPurple); }
`;
const glitchCyan = keyframes`
  0%, 84%, 100% { opacity: 0; transform: translate(0); }
  85%, 87% { opacity: .75; transform: translate(-3px, 1px); }
  86% { opacity: .4; transform: translate(2px, -1px); }
  88% { opacity: 0; }
`;
const glitchPink = keyframes`
  0%, 90%, 100% { opacity: 0; transform: translate(0); }
  91%, 93% { opacity: .65; transform: translate(3px, -1px); }
  92% { opacity: .3; transform: translate(-2px, 1px); }
  94% { opacity: 0; }
`;

export const VictoryPanel = styled.section<{ $neon: boolean }>`
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
  max-height: calc(100dvh - 32px);
  box-sizing: border-box;
  overscroll-behavior: contain;
  padding: clamp(24px, 5vw, 52px);
  border: 1px solid var(--neonBlue);
  border-radius: 14px;
  color: #e9faff;
  background: radial-gradient(circle at 50% -25%, rgba(0, 228, 255, .22), transparent 48%),
    linear-gradient(140deg, #061a28 0%, #020a15 70%, #160a29 100%);
  box-shadow: 0 24px 70px rgba(0, 0, 0, .58), inset 0 0 40px rgba(0, 208, 255, .07);
  animation: ${reveal} .6s ease-out both;
  ${({ $neon }) => $neon && css`box-shadow: 0 0 28px rgba(0, 220, 255, .3),
    0 24px 70px rgba(0, 0, 0, .58), inset 0 0 45px rgba(0, 208, 255, .12);`}
  &::before {
    content: ''; position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(transparent 43%, rgba(74, 250, 255, .07) 50%, transparent 57%);
    background-size: 100% 220%;
    animation: ${scan} 7s linear infinite;
  }
  &::after {
    content: ''; position: absolute; inset: 7px; border: 1px solid rgba(95, 238, 255, .14);
    clip-path: polygon(0 0, 24% 0, 24% 2px, 76% 2px, 76% 0, 100% 0,
      100% 100%, 0 100%); pointer-events: none;
  }
  @media (prefers-reduced-motion: reduce) {
    &, &::before, * { animation-duration: .01ms !important; animation-iteration-count: 1 !important; }
  }
`;

export const VictoryClose = styled.button`
  position: absolute; z-index: 2; top: 14px; right: 14px; display: grid; place-items: center;
  width: 34px; height: 34px; border: 0; background: transparent; color: #c4e6ed;
  cursor: pointer; border-radius: 50%; transition: color .2s, background .2s;
  &:hover, &:focus-visible { color: white; background: rgba(0, 234, 255, .15); }
`;

export const VictoryHero = styled.header`
  position: relative; z-index: 1; text-align: center; padding: 16px 0 25px;
  &::before { content: ''; position: absolute; width: 160px; height: 160px; top: -28px; left: calc(50% - 80px);
    border: 1px dashed rgba(65, 235, 255, .42); border-radius: 50%;
    animation: ${orbit} 24s linear infinite; pointer-events: none; }
  small { display: block; color: var(--neonBlue); letter-spacing: .26em; text-transform: uppercase; }
  h2 { position: relative; isolation: isolate; margin: 15px 0 4px;
    font-size: clamp(2.5rem, 9vw, 5.4rem); line-height: 1.05;
    color: #e7feff; font-family: 'Orbitron', sans-serif; letter-spacing: .08em;
    text-transform: uppercase; animation: ${pulse} 3.5s ease-in-out infinite; }
  h2::before, h2::after { content: attr(data-text); position: absolute; inset: 0;
    pointer-events: none; opacity: 0; }
  h2::before { color: var(--clearneonBlue); clip-path: inset(18% 0 53% 0);
    text-shadow: -2px 0 9px var(--neonBlue); animation: ${glitchCyan} 5s steps(1, end) infinite; }
  h2::after { color: var(--clearneonPink); clip-path: inset(57% 0 13% 0);
    text-shadow: 2px 0 9px var(--neonPink); animation: ${glitchPink} 5s steps(1, end) infinite; }
  p { color: #afc8d1; margin: 10px 0 0; }
`;

export const VictoryStats = styled.div`
  position: relative; z-index: 1; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px; margin: 16px 0 24px;
  @media (max-width: 650px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`;
export const VictoryStat = styled.div<{ $index: number }>`
  padding: 16px 10px; text-align: center; border: 1px solid rgba(99, 225, 244, .35);
  border-radius: 8px; background: rgba(4, 23, 40, .7); backdrop-filter: blur(8px);
  animation: ${reveal} .5s ease-out both; animation-delay: ${({ $index }) => `${.18 + $index * .12}s`};
  strong { display: block; font: 700 clamp(1.5rem, 4vw, 2.4rem) 'Orbitron', sans-serif;
    color: var(--neonBlue); }
  span { display: block; margin-top: 4px; color: #bbd5dd; font-size: .78rem; letter-spacing: .08em; text-transform: uppercase; }
`;
export const VictoryDetail = styled.div`
  position: relative; z-index: 1; padding: 14px 17px; border-left: 2px solid var(--neonPurple);
  background: rgba(119, 60, 176, .08); color: #c5dae2;
  strong { display: block; color: #e7faff; margin-bottom: 5px; }
  p { margin: 0; line-height: 1.5; }
`;
export const VictoryActions = styled.div`
  position: relative; z-index: 1; display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; margin-top: 27px;
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
    ${cyberButtonsFillWidth}
  }
`;
