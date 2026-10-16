import styled, { css, keyframes } from 'styled-components';
import type { BattleTone } from './battlePresentation';

const outcomeColor = (tone: BattleTone) => ({
  positive: '#75efa2',
  negative: '#ff7886',
  warning: 'var(--clearneonYellow)',
  neutral: '#d9e8f0',
})[tone];

const borderTravel = keyframes`
  0% { top: -5px; left: -5px; }
  25% { top: -5px; left: calc(100% - 5px); }
  50% { top: calc(100% - 5px); left: calc(100% - 5px); }
  75% { top: calc(100% - 5px); left: -5px; }
  100% { top: -5px; left: -5px; }
`;

export const ActorName = styled.span<{ $enemy: boolean }>`
  color: ${({ $enemy }) => $enemy ? 'var(--clearneonRed)' : 'var(--clearneonBlue)'};
  font-family: 'DO Futuristic', sans-serif;
  font-weight: 100;
  letter-spacing: .025em;
`;

export const ActionName = styled.span`
  color: #e4f4fb;
  font-family: 'Cyberpunk Is Not Dead', sans-serif;
  letter-spacing: .025em;
`;

export const OutcomeText = styled.span<{ $tone: BattleTone; $critical?: boolean }>`
  color: ${({ $tone }) => outcomeColor($tone)};
  font-weight: ${({ $critical }) => $critical ? 900 : 750};
  ${({ $critical, $tone }) => $critical ? `text-shadow: 0 0 10px ${outcomeColor($tone)}80;` : ''}
  &::before { content: ${({ $critical }) => $critical ? "'✦ '" : "''"}; }
`;

export const OutcomeNumber = styled(OutcomeText)`
  font-variant-numeric: tabular-nums;
  font-size: ${({ $critical }) => $critical ? '1.2em' : '1em'};
  &::before { content: none; }
`;

export const DamageText = styled.span<{ $tone: BattleTone }>`
  color: ${({ $tone }) => outcomeColor($tone)};
  font-weight: 800;
`;

export const AmmoRemaining = styled.span`
  color: #9db6c2;
  font-size: .8em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

export const ReplayContent = styled.div`
  display: grid;
  align-content: start;
  gap: 10px;
  min-width: 0;
`;

export const ReplayIntro = styled.p`
  margin: 0;
  max-width: 68ch;
  color: #b8c8d7;
  line-height: 1.55;
`;

export const ReplayActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
`;

export const ReplayNote = styled.p`
  margin: 0;
  color: #95b5c4;
  font-size: .78rem;
  line-height: 1.45;
`;

export const Combatants = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: start;
  gap: 12px;

  @media (max-width: 650px) { gap: 5px; }
`;

export const EnemyGroup = styled.div`
  min-width: 0;
  max-height: min(68vh, 680px);
  display: grid;
  align-content: start;
  gap: 8px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--clearneonBlue) transparent;
`;

export const Versus = styled.div`
  align-self: center;
  color: var(--clearneonBlue);
  font-family: 'Orbitron', sans-serif;
  font-size: .9rem;
  font-weight: 800;
  text-align: center;
  @media (max-width: 650px) { font-size: .66rem; }
`;

export const CombatantCard = styled.div<{ $enemy?: boolean; $result?: 'win' | 'loss'; $neon?: boolean; $active?: boolean }>`
  position: relative;
  min-width: 0;
  padding: 12px;
  border: 1px solid ${({ $enemy, $result, $active }) => $result === 'win' ? '#55eabc'
    : $result === 'loss' ? '#ff7886' : $active ? ($enemy ? 'var(--clearneonRed)' : 'var(--clearneonBlue)')
      : $enemy ? 'rgba(255, 115, 120, .38)' : 'rgba(77, 238, 234, .38)'};
  border-radius: 8px;
  background: ${({ $enemy, $result }) => $result === 'win' ? 'rgba(10, 80, 59, .3)'
    : $result === 'loss' ? 'rgba(98, 24, 39, .35)'
      : $enemy ? 'rgba(74, 23, 34, .24)' : 'rgba(7, 39, 54, .52)'};
  transition: border-color .2s ease, box-shadow .2s ease;
  ${({ $active, $enemy, $neon, $result }) => $active && !$result && css`
    box-shadow: 0 0 ${$neon ? '15px 3px' : '8px 1px'}
      ${$enemy ? 'rgba(255, 65, 80, .45)' : 'rgba(77, 238, 234, .45)'},
      inset 0 0 12px ${$enemy ? 'rgba(255, 65, 80, .12)' : 'rgba(77, 238, 234, .12)'};
  `}
  ${({ $result, $neon }) => $result && $neon && css`
    box-shadow: 0 0 14px ${$result === 'win' ? '#55eabc66' : '#ff788666'},
      inset 0 0 18px ${$result === 'win' ? '#55eabc33' : '#ff788633'};
    &::after {
      content: '';
      position: absolute;
      z-index: 2;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      pointer-events: none;
      background: ${$result === 'win' ? '#55eabc' : '#ff7886'};
      box-shadow: 0 0 12px 4px ${$result === 'win' ? '#55eabc88' : '#ff788688'};
      animation: ${borderTravel} 3.2s linear infinite;
    }
    @media (prefers-reduced-motion: reduce) { &::after { animation: none; } }
  `}

  header {
    display: flex;
    align-items: center;
    gap: 11px;
    margin-bottom: 10px;
  }
  header span {
    position: relative;
    flex: 0 0 46px;
    height: 46px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    overflow: hidden;
    background: ${({ $enemy }) => $enemy ? 'rgba(255, 115, 120, .16)' : 'rgba(77, 238, 234, .16)'};
    color: ${({ $enemy }) => $enemy ? '#ff9aa2' : 'var(--clearneonBlue)'};
    font-family: 'Orbitron', sans-serif;
    font-size: .83rem;
    img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  }
  header strong {
    min-width: 0;
    overflow-wrap: anywhere;
    color: ${({ $enemy }) => $enemy ? 'var(--clearneonRed)' : 'var(--clearneonBlue)'};
    font-family: 'DO Futuristic', sans-serif;
    font-size: clamp(1.08rem, 1.45vw, 1.34rem);
    font-weight: 100;
    letter-spacing: .035em;
    line-height: 1.2;
  }
  @media (max-width: 650px) {
    padding: 8px 6px;
    header { gap: 6px; margin-bottom: 8px; }
    header span { flex-basis: 35px; height: 35px; font-size: .73rem; }
    header strong { font-size: clamp(.8rem, 2.6vw, 1.04rem); }
  }
`;

export const CombatantResources = styled.div`
  display: grid;
  gap: 7px;
  @media (max-width: 650px) { gap: 6px; }
`;

export const CombatantResource = styled.div`
  min-width: 0;
  > div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    color: #bdd0dc;
    font-size: .75rem;
  }
  strong { color: #f0f9ff; font-variant-numeric: tabular-nums; white-space: nowrap; }
  @media (max-width: 650px) {
    > div { gap: 2px; font-size: .57rem; }
  }
`;

export const ResourceTrack = styled.div<{ $protected?: boolean }>`
  height: 7px;
  margin-top: 5px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255, 255, 255, .13);
  ${({ $protected }) => $protected && 'box-shadow: 0 0 7px var(--neonPurple), inset 0 0 4px var(--neonPurple);'}
`;

export const ResourceFill = styled.div<{ $initialPercent: number; $tone: 'hitPoints' | 'mana' | 'stamina' | 'protection'; $enemy?: boolean }>`
  width: ${({ $initialPercent }) => `${$initialPercent}%`};
  height: 100%;
  transition: width 1.5s cubic-bezier(.22, 1, .36, 1);
  background: ${({ $tone, $enemy }) => ({
    hitPoints: $enemy ? 'linear-gradient(90deg, #ba4b66, #ff8490)' : 'linear-gradient(90deg, #b43d57, #ff7785)',
    mana: 'linear-gradient(90deg, #3079cc, #6bd5ff)',
    stamina: 'linear-gradient(90deg, #0b9064, #55eabc)',
    protection: 'linear-gradient(90deg, var(--neonPurple), var(--clearneonPurple))',
  })[$tone]};
`;

export const CombatantDefenses = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin: 0 0 8px;
  font-family: 'Orbitron', sans-serif;
  font-size: .72rem;
  font-variant-numeric: tabular-nums;
  > span { display: inline-flex; align-items: center; gap: 4px; }
  svg { font-size: 1rem; }
  .armor { color: var(--clearneonYellow); }
  .shield { color: var(--clearneonPink); }
`;

export const ReplayControls = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
`;

export const ReplayToolbar = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 8px;
`;

export const ReplayClose = styled.button`
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: #d9f4ff;
  cursor: pointer;
  &:hover { color: var(--clearneonBlue); }
  &:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
`;

export const ReplayControl = styled.button<{ $selected?: boolean }>`
  min-height: 32px;
  padding: 5px 8px;
  white-space: nowrap;
  border: 1px solid ${({ $selected }) => $selected ? 'var(--clearneonBlue)' : 'rgba(77, 238, 234, .37)'};
  border-radius: 4px;
  background: ${({ $selected }) => $selected ? 'rgba(0, 166, 191, .2)' : 'rgba(4, 25, 39, .65)'};
  color: #e2f9ff;
  font: inherit;
  font-size: .78rem;
  font-weight: 700;
  cursor: pointer;
  transition: border-color .2s, background-color .2s;
  &:hover:not(:disabled) { border-color: var(--clearneonBlue); background: rgba(0, 166, 191, .23); }
  &:focus-visible { outline: 2px solid var(--clearneonBlue); outline-offset: 2px; }
  &:disabled { opacity: .45; cursor: not-allowed; }
  @media (max-width: 650px) { min-height: 29px; padding: 4px 6px; font-size: .66rem; }
`;

export const ReplayProgress = styled.span`
  padding: 4px 0;
  color: #b7cbd4;
  font-size: .8rem;
  font-variant-numeric: tabular-nums;
`;

export const CurrentEvent = styled.div<{ $criticalTone?: BattleTone }>`
  min-height: 52px;
  padding: 10px 12px;
  display: grid;
  align-content: center;
  gap: 5px;
  border-left: 3px solid ${({ $criticalTone }) => $criticalTone ? outcomeColor($criticalTone) : 'var(--clearneonBlue)'};
  border-radius: 2px 7px 7px 2px;
  background: ${({ $criticalTone }) => $criticalTone === 'positive' ? 'rgba(55, 235, 137, .12)'
    : $criticalTone === 'negative' ? 'rgba(255, 90, 110, .12)' : 'rgba(77, 238, 234, .08)'};
  box-shadow: ${({ $criticalTone }) => $criticalTone ? `inset 0 0 22px ${outcomeColor($criticalTone)}20` : 'none'};
  color: #e7faff;
  font-size: .87rem;
  line-height: 1.55;
  > div {
    display: grid;
    gap: 2px;
    opacity: .68;
  }
  > div[data-current='true'] { opacity: 1; }
  > div + div {
    padding-top: 7px;
    border-top: 1px solid rgba(77, 238, 234, .16);
  }
  strong { color: var(--clearneonBlue); font-size: .75rem; text-transform: uppercase; letter-spacing: .08em; }
`;

export const ReplayResult = styled.div<{ $win?: boolean }>`
  padding: 12px 15px;
  border: 1px solid ${({ $win }) => $win ? '#55eabc' : '#ff7886'};
  border-radius: 6px;
  background: ${({ $win }) => $win ? 'rgba(10, 80, 59, .3)' : 'rgba(98, 24, 39, .35)'};
  color: ${({ $win }) => $win ? '#9affc8' : '#ffabb5'};
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
`;

const xpRoulette = keyframes`
  0% { color: var(--clearneonYellow); transform: translateY(8px) scale(.85); opacity: .4; text-shadow: 0 0 20px var(--clearneonYellow); }
  35% { color: var(--clearneonYellow); transform: translateY(-3px) scale(1.12); opacity: 1; text-shadow: 0 0 18px var(--clearneonYellow); }
  68% { color: var(--clearneonYellow); transform: translateY(0) scale(1.04); text-shadow: 0 0 12px var(--clearneonYellow); }
  100% { color: var(--whitesmoke); transform: translateY(0) scale(1); text-shadow: none; }
`;

export const ReplayRewards = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 16px;
`;

export const ReplayXp = styled.strong`
  display: inline-block;
  color: var(--whitesmoke);
  font-family: 'Orbitron', sans-serif;
  font-size: 1.02rem;
  letter-spacing: .04em;
  font-variant-numeric: tabular-nums;
  animation: ${xpRoulette} 1.5s ease-out both;
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

export const ReplayLevel = styled.strong`
  display: inline-block;
  padding: 3px 9px;
  border: 1px solid var(--clearneonYellow);
  border-radius: 4px;
  color: var(--clearneonYellow);
  font-family: 'Orbitron', sans-serif;
  font-size: .88rem;
  letter-spacing: .07em;
  animation: ${xpRoulette} 1.5s ease-out both;
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

export const ReplayPoints = styled.span`
  color: #dbe6e8;
  font-size: .78rem;
  font-weight: 600;
`;

export const EventList = styled.ol`
  max-height: 155px;
  margin: 0;
  padding: 0 8px 0 0;
  overflow-y: auto;
  list-style: none;
  scrollbar-width: thin;
  scrollbar-color: rgba(77, 238, 234, .5) rgba(2, 17, 28, .7);
  li {
    min-height: 36px;
    padding: 6px 8px;
    border-bottom: 1px solid rgba(77, 238, 234, .1);
    color: #c2d7e0;
    font-size: .79rem;
    line-height: 1.5;
  }
  li:last-child { border-bottom: 0; }
  li[data-critical='positive'] {
    background: rgba(55, 235, 137, .11);
    box-shadow: inset 3px 0 #75efa2;
  }
  li[data-critical='negative'] {
    background: rgba(255, 90, 110, .11);
    box-shadow: inset 3px 0 #ff7886;
  }
  li > span:first-child { margin-right: 8px; color: var(--clearneonBlue); font-variant-numeric: tabular-nums; }
`;
