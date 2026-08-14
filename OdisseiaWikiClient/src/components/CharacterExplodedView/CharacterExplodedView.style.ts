import styled, { css, keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import CharacterBackgroundDistant from '../../assets/CharacterBackgroundDistant.jpeg';
import { HudFrame } from '../Generic/HudFrame';

type ThemeProps = { $theme: 'dark' | 'light'; $neon: 'on' | 'off' };
type AccentProps = { $accent: string; $clearAccent: string };

const backpackOpen = keyframes`
  0% { transform: translateY(0) rotate(0); }
  45% { transform: translateY(-3px) rotate(-8deg); }
  100% { transform: translateY(-7px) rotate(-16deg); }
`;

const equippedTrace = keyframes`
  to { transform: rotate(1turn); }
`;

const pulse = keyframes`
  50% { opacity: .55; transform: scale(.97); }
`;

export const LauncherButton = styled.button<ThemeProps & { $opening: boolean }>`
  position: relative;
  width: 38px;
  height: 38px;
  border: 1px solid ${({ $neon }) => $neon === 'on' ? 'var(--clearneonBlue)' : 'var(--neonBlue)'};
  border-radius: 4px;
  background: ${({ $theme }) => $theme === 'dark' ? 'rgba(1, 10, 20, .72)' : 'rgba(245, 245, 245, .84)'};
  color: ${({ $neon }) => $neon === 'on' ? 'var(--clearneonBlue)' : 'var(--neonBlue)'};
  display: inline-grid;
  place-items: center;
  cursor: pointer;
  overflow: visible;
  transition: .22s ease;

  svg { font-size: 23px; }
  .backpack-flap {
    position: absolute;
    top: 8px;
    width: 15px;
    height: 5px;
    border-top: 1px solid currentColor;
    transform-origin: left center;
    opacity: 0;
  }

  ${({ $opening }) => $opening && css`
    box-shadow: 0 0 14px var(--clearneonBlue);
    .backpack-flap { opacity: 1; animation: ${backpackOpen} .26s ease forwards; }
    svg { animation: ${pulse} .26s ease; }
  `}

  &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 0 10px var(--clearneonBlue); }
`;

export const Overlay = styled(motion.div)`
  position: fixed;
  top: var(--main-header-height, 85px);
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 13000;
  background: rgba(0, 2, 8, .88);
  backdrop-filter: blur(6px);
  padding: clamp(10px, 1.4vh, 18px) clamp(12px, 2vw, 32px) 18px;
  box-sizing: border-box;
`;

export const Shell = styled(motion.section)<ThemeProps & AccentProps>`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr;
  isolation: isolate;
  --exploded-accent: ${({ $accent }) => $accent};
  --exploded-clear: ${({ $clearAccent }) => $clearAccent};
  --exploded-glow: ${({ $neon, $clearAccent }) => $neon === 'on' ? $clearAccent : 'transparent'};
  color: var(--whitesmoke);
  background:
    linear-gradient(115deg, rgba(0, 8, 18, .97), rgba(1, 14, 28, .94) 55%, rgba(0, 5, 14, .98)),
    radial-gradient(circle at 65% 45%, color-mix(in srgb, var(--exploded-accent) 9%, transparent), transparent 40%),
    url(${CharacterBackgroundDistant}) center / cover no-repeat;
  border: 0;
  clip-path: ${({ $neon }) => $neon === 'on'
    ? 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)'
    : 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'};
  box-shadow: ${({ $neon }) => $neon === 'on' ? '0 0 16px var(--exploded-glow)' : 'none'};

  @media (max-width: 980px) {
    overflow-y: auto;
  }
`;

export const ShellHudFrame = styled(HudFrame)`
  position: absolute;
  inset: 0;
  z-index: 8;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  pointer-events: none;
  background: transparent;
`;

export const ModalBackground = styled.div`
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: .52;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(115deg, rgba(0, 8, 18, .94), rgba(1, 14, 28, .87) 55%, rgba(0, 5, 14, .95)),
      radial-gradient(circle at 65% 45%, color-mix(in srgb, var(--exploded-accent) 10%, transparent), transparent 42%);
  }
`;

export const Header = styled.header`
  min-height: 58px;
  padding: 10px 14px;
  border-bottom: 1px solid color-mix(in srgb, var(--exploded-accent) 28%, transparent);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 14px;

  @media (max-width: 980px) {
    grid-template-columns: minmax(0, 1fr) auto;
  }
`;

export const Tabs = styled.nav`
  display: flex;
  gap: 8px;
  padding: 4px 2px;
  margin: -4px -2px;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: thin;
`;

export const TabButton = styled.button<{ $active: boolean; $color: string; $clearColor: string }>`
  min-width: 112px;
  min-height: 38px;
  padding: 8px 14px;
  border: 1px solid ${({ $active, $color }) => $active ? $color : 'rgba(196, 204, 218, .35)'};
  background: ${({ $active, $color }) => $active
    ? `color-mix(in srgb, ${$color} 9%, rgba(4, 8, 16, .68))`
    : 'rgba(4, 8, 16, .68)'};
  color: ${({ $active, $color }) => $active ? $color : 'var(--grey)'};
  font: 700 13px 'Michroma', sans-serif;
  text-transform: uppercase;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: .2s ease;
  &:hover {
    color: ${({ $color }) => $color};
    border-color: ${({ $color }) => $color};
    transform: translateY(-1px);
    box-shadow: 0 0 7px ${({ $clearColor }) => $clearColor};
  }

  @media (max-width: 520px) {
    min-width: 88px;
    padding-inline: 9px;
    font-size: 10px;
  }
`;

export const OrganizeButton = styled.button<{ $active: boolean }>`
  min-height: 38px;
  padding: 8px 14px;
  white-space: nowrap;
  border: 1px solid var(--exploded-accent);
  background: ${({ $active }) => $active
    ? 'color-mix(in srgb, var(--exploded-accent) 13%, rgba(2, 9, 18, .7))'
    : 'rgba(2, 9, 18, .7)'};
  color: var(--exploded-accent);
  font: 700 12px 'Michroma', sans-serif;
  cursor: pointer;
  transition: .2s ease;

  &:hover {
    border-color: var(--exploded-accent);
    box-shadow: 0 0 8px var(--exploded-clear);
  }

  @media (max-width: 980px) {
    grid-column: 1 / -1;
    grid-row: 2;
  }
`;

export const CloseButton = styled.button`
  width: 38px;
  height: 38px;
  border: 1px solid rgba(255, 255, 255, .38);
  background: rgba(5, 8, 14, .72);
  color: var(--whitesmoke);
  display: grid;
  place-items: center;
  cursor: pointer;
  svg { font-size: 23px; }
  &:hover { color: var(--neonPink); border-color: var(--neonPink); }
`;

export const Content = styled.div<{ $simple?: boolean }>`
  min-height: 0;
  padding: 14px;
  display: grid;
  grid-template-columns: ${({ $simple }) => $simple
    ? 'minmax(220px, 18%) minmax(360px, 1fr)'
    : 'minmax(220px, 18%) minmax(360px, 1fr) minmax(360px, 44%)'};
  gap: 14px;
  overflow: hidden;

  @media (max-width: 1180px) {
    grid-template-columns: ${({ $simple }) => $simple
      ? '190px minmax(300px, 1fr)'
      : '190px minmax(300px, .9fr) minmax(400px, 1.25fr)'};
  }

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    overflow: visible;
    padding: 9px;
  }
`;

export const Summary = styled(HudFrame)`
  min-height: 0;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: linear-gradient(180deg, rgba(0, 19, 34, .84), rgba(0, 7, 18, .78));
  box-sizing: border-box;

  h2 {
    margin: 0;
    color: var(--exploded-accent);
    font: 700 clamp(15px, 1.2vw, 21px) 'DO Futuristic', sans-serif;
    letter-spacing: 2px;
    text-align: center;
  }

  @media (max-width: 980px) { min-height: auto; }
  @media (max-width: 520px) { padding: 14px 12px; }
`;

export const Capacity = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: center;
  strong { font: 600 15px 'Michroma', sans-serif; }
  .track { grid-column: 1 / -1; height: 7px; border-radius: 99px; background: rgba(160, 170, 190, .2); overflow: hidden; }
  .fill { height: 100%; border-radius: inherit; background: var(--exploded-accent); box-shadow: 0 0 8px var(--exploded-glow); }
`;

export const SummaryMetric = styled.div`
  padding: 14px 0;
  border-block: 1px solid color-mix(in srgb, var(--exploded-accent) 24%, transparent);
  display: flex;
  align-items: center;
  gap: 12px;
  svg { color: var(--exploded-accent); font-size: 25px; }
  span { color: var(--grey); font-size: 12px; text-transform: uppercase; }
  strong { display: block; font-size: 24px; font-weight: 400; }
`;

export const CharacterIdentity = styled.div`
  margin-top: auto;
  display: grid;
  grid-template-columns: 78px 1fr;
  gap: 12px;
  align-items: center;
  img, .placeholder {
    width: 78px;
    aspect-ratio: 1;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid var(--exploded-accent);
    background: rgba(0, 0, 0, .55);
  }
  h3 { margin: 0 0 8px; color: var(--exploded-accent); font: 400 22px 'DO Futuristic', sans-serif; }
  p { margin: 3px 0; font-size: 12px; color: var(--grey); }
  b { color: var(--whitesmoke); }

  @media (max-width: 980px) { margin-top: 0; }
  @media (max-width: 520px) {
    grid-template-columns: 62px 1fr;
    img, .placeholder { width: 62px; }
  }
`;

export const InventoryArea = styled(HudFrame)`
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  box-sizing: border-box;
  background:
    linear-gradient(color-mix(in srgb, var(--exploded-accent) 3%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--exploded-accent) 3%, transparent) 1px, transparent 1px),
    rgba(0, 5, 14, .62);
  background-size: 32px 32px;

  @media (max-width: 980px) { min-height: 520px; }
  @media (max-width: 520px) { min-height: 470px; }
`;

export const InventoryAreaHeader = styled.header`
  position: relative;
  z-index: 1;
  min-height: 42px;
  padding: 10px 16px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--exploded-accent) 24%, transparent);
  background: rgba(0, 6, 16, .76);

  h2 {
    margin: 0;
    color: var(--exploded-accent);
    font: 700 clamp(12px, 1vw, 16px) 'DO Futuristic', sans-serif;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    text-align: center;
  }

  span {
    position: absolute;
    right: 16px;
    color: var(--grey);
    font: 9px 'Michroma', sans-serif;
    text-transform: uppercase;
  }

  @media (max-width: 520px) {
    padding-inline: 10px;
    span { display: none; }
  }
`;

export const InventoryAreaBody = styled.div`
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
`;

export const TableHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  > h2 { margin-block: 4px; }
`;

export const FreeCanvasRoot = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  touch-action: none;
`;

export const InventoryCard = styled.button<{ $equipped?: boolean; $accent?: string }>`
  position: relative;
  width: clamp(72px, 6vw, 88px);
  padding: 6px;
  border: 1px solid ${({ $accent }) => $accent ?? 'var(--exploded-accent)'};
  background: rgba(2, 8, 18, .94);
  color: var(--whitesmoke);
  cursor: grab;
  user-select: none;
  touch-action: pan-y;
  display: grid;
  gap: 6px;
  overflow: hidden;
  box-shadow: 0 7px 18px rgba(0, 0, 0, .35);
  &::before {
    content: '';
    position: absolute;
    inset: -70%;
    pointer-events: none;
    opacity: ${({ $equipped }) => $equipped ? 1 : 0};
    background: conic-gradient(
      transparent 0 37%,
      var(--exploded-accent) 46%,
      transparent 55% 87%,
      var(--exploded-accent) 96%,
      transparent 100%
    );
    animation: ${equippedTrace} 2.4s linear infinite;
  }
  &::after {
    content: '';
    position: absolute;
    inset: 1px;
    background: rgba(2, 8, 18, .96);
    pointer-events: none;
  }
  img, .entry-placeholder, span { position: relative; z-index: 1; }
  img, .entry-placeholder { width: 100%; aspect-ratio: 1; object-fit: contain; background: rgba(0, 0, 0, .48); }
  span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 700 10px 'Michroma', sans-serif; }
  &:active { cursor: grabbing; }
`;

export const OrganizedGridRoot = styled.div`
  position: relative;
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(74px, 86px));
  grid-auto-rows: 104px;
  justify-content: center;
  align-content: start;
  gap: 8px;
  scrollbar-color: var(--exploded-accent) transparent;
`;

export const EquipmentColumn = styled(HudFrame)`
  position: relative;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(210px, 1fr) minmax(210px, .8fr);
  gap: 12px;
  overflow: hidden;
  box-sizing: border-box;

  &[data-search-open='false'] { grid-template-columns: 1fr; }

  @media (max-width: 1180px) {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }

  @media (max-width: 980px) {
    min-height: 690px;
    overflow: visible;
  }
`;

export const MannequinStage = styled.div`
  position: relative;
  min-height: 0;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--exploded-accent) 22%, transparent);
  background: radial-gradient(circle at center, color-mix(in srgb, var(--exploded-accent) 8%, transparent), rgba(0, 4, 12, .76) 65%);

  .mannequin-silhouette {
    position: absolute;
    left: 50%;
    top: 51%;
    width: min(43%, 250px);
    height: 82%;
    transform: translate(-50%, -50%);
    color: var(--exploded-accent);
    opacity: .72;
    filter: drop-shadow(0 0 4px var(--exploded-glow));
    pointer-events: none;
  }

  .equipment-circuit-lines {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }

  .equipment-line {
    stroke: var(--exploded-accent);
    stroke-width: 1px;
    stroke-dasharray: 2 1.5;
    opacity: .28;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
    transition: opacity .16s ease, stroke-width .16s ease, filter .16s ease;
  }

  .equipment-line-hit {
    stroke: transparent;
    stroke-width: 9px;
    vector-effect: non-scaling-stroke;
    pointer-events: stroke;
    cursor: pointer;
  }

  .equipment-line[data-highlighted='true'] {
    opacity: .96;
    stroke-width: 2px;
    filter: drop-shadow(0 0 3px var(--exploded-accent));
  }

  @media (max-width: 1180px) { min-height: 560px; }
  @media (max-width: 980px) { min-height: 660px; }
  @media (max-width: 520px) { min-height: 590px; }
`;

export const EquipmentSlotButton = styled.button<{
  $selected?: boolean;
  $filled?: boolean;
  $highlighted?: boolean;
}>`
  position: absolute;
  width: clamp(34px, 3.4vw, 50px);
  aspect-ratio: 1;
  padding: 4px;
  display: grid;
  place-items: center;
  border: 1px solid ${({ $selected, $filled }) => $selected ? 'var(--exploded-accent)' : $filled ? 'var(--neonGreen)' : 'rgba(180, 190, 205, .35)'};
  background: rgba(2, 8, 16, .9);
  color: ${({ $filled }) => $filled ? 'var(--neonGreen)' : 'var(--grey)'};
  cursor: pointer;
  box-shadow: ${({ $selected, $highlighted }) => $selected || $highlighted ? '0 0 12px var(--exploded-glow)' : 'none'};
  transition: .18s ease;
  transform: translate(-50%, -50%);
  z-index: 2;
  img { width: 100%; height: 100%; object-fit: contain; }
  svg { font-size: 20px; }
  &[data-region='torso'] { width: clamp(30px, 2.9vw, 42px); }
  ${({ $highlighted }) => $highlighted && css`
    transform: translate(-50%, -50%) scale(1.07);
    border-color: var(--exploded-accent);
    color: var(--exploded-accent);
  `}
  &:hover { transform: translate(-50%, -50%) scale(1.07); border-color: var(--exploded-accent); color: var(--exploded-accent); }
`;

export const EquipmentSearchPanel = styled(motion.aside)`
  min-width: 0;
  min-height: 0;
  padding: 14px;
  overflow-y: auto;
  border: 1px solid var(--exploded-accent);
  background: rgba(0, 8, 17, .92);
  scrollbar-color: var(--exploded-accent) transparent;
  h3 { margin: 0 0 12px; color: var(--exploded-accent); font: 700 14px 'Michroma', sans-serif; text-transform: uppercase; }
  input {
    width: 100%;
    box-sizing: border-box;
    padding: 11px 12px;
    border: 1px solid color-mix(in srgb, var(--exploded-accent) 28%, transparent);
    background: rgba(0, 0, 0, .46);
    color: var(--whitesmoke);
    outline: 0;
    &:focus { border-color: var(--exploded-accent); }
  }

  @media (max-width: 1180px) {
    min-height: 300px;
    overflow: visible;
  }
`;

export const EquipmentSearchList = styled.div`
  margin-top: 12px;
  display: grid;
  gap: 8px;
`;

export const EquipmentSearchItem = styled.button`
  padding: 7px;
  display: grid;
  grid-template-columns: 52px 1fr auto;
  gap: 9px;
  align-items: center;
  text-align: left;
  color: var(--whitesmoke);
  border: 1px solid color-mix(in srgb, var(--exploded-accent) 22%, transparent);
  background: rgba(7, 13, 23, .76);
  cursor: pointer;
  img, .placeholder { width: 52px; aspect-ratio: 1; object-fit: contain; background: rgba(0, 0, 0, .5); }
  strong { display: block; font-size: 12px; }
  small { color: var(--grey); }
  &:hover { border-color: var(--exploded-accent); background: color-mix(in srgb, var(--exploded-accent) 7%, transparent); }

  @media (max-width: 520px) {
    grid-template-columns: 44px 1fr;
    img, .placeholder { width: 44px; }
    > small { grid-column: 2; }
  }
`;

export const EmptyState = styled.div`
  position: absolute;
  inset: 0;
  z-index: 4;
  display: grid;
  place-items: center;
  padding: 24px;
  color: var(--grey);
  text-align: center;
  font: 14px 'Michroma', sans-serif;
  pointer-events: none;
`;
