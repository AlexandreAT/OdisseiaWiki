import styled, { keyframes } from 'styled-components';
import { GameFrame } from '../../Game/GameShared.style';
import { CardContainer, ManagementMetadata } from '../ManagementWiki/WikiForms/FormBuscarConteúdo/ResultCard/ResultCard.style';

export const GameAdminFrame = styled(GameFrame)`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1180px;
  margin: 0 auto;
  color: var(--whitesmoke);
`;

export const GameAdminVersion = styled.div`
  max-width: 350px;
`;

export const GameAdminHeader = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  h1 {
    color: var(--clearneonBlue);
    margin: 0 0 4px;
    font-family: 'DO Futuristic', sans-serif;
    font-weight: 100;
    letter-spacing: 3px;
    font-size: clamp(1.2rem, 3vw, 2rem);
  }
  p { margin: 0; color: #b6c7d3; }
`;

export const GameAdminActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

export const GameAdminDraftActions = styled(GameAdminActions)<{ $paired: boolean }>`
  display: grid;
  grid-template-columns: ${({ $paired }) => $paired ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)'};
  width: min(100%, 430px);
  > * { min-width: 0; }
  @media (max-width: 420px) { gap: 8px; button { font-size: .68rem; } }
`;

export const GameAdminSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 20px;
  border-top: 1px solid rgba(0, 187, 255, .28);
  padding-top: 24px;
  h2 {
    margin: 0;
    color: var(--clearneonBlue);
    font-family: 'DO Futuristic', sans-serif;
    font-weight: 100;
    letter-spacing: 3px;
    font-size: 1.2rem;
  }
  > h3, > p { margin: 0; }
`;

export const GameAdminGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  @media (max-width: 760px) { grid-template-columns: 1fr; }
`;

export const GameAdminCard = styled(GameFrame)`
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  box-sizing: border-box;
  padding: 24px;
  > h3 {
    margin: 0;
    color: var(--clearneonBlue);
    font-family: 'DO Futuristic', sans-serif;
    font-weight: 100;
    letter-spacing: 2px;
  }
  > h4, > p { margin: 0; }
  @media (max-width: 600px) { padding: 20px 16px; }
`;

export const GameAdminFields = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 18px;
  align-items: start;
  > * { min-width: 0; }
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

export const GameAdminRoute = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 20px 18px;
  padding-top: 18px;
  border-top: 1px solid rgba(0, 187, 255, .18);
  > * { min-width: 0; }
  > button:last-child { justify-self: end; }
  > [data-route-image] {
    grid-column: 1 / -1;
    justify-self: center;
    width: min(100%, 250px);
  }
  @media (max-width: 520px) { grid-template-columns: 1fr; }
`;

export const GameAdminWeightRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  > :first-child { flex: 1 1 auto; min-width: 0; }
  label { display: inline-flex; align-items: center; gap: 8px; color: var(--clearneonBlue); white-space: nowrap; }
  input[type='checkbox'] {
    appearance: none;
    position: relative;
    width: 36px;
    height: 20px;
    margin: 0;
    border: 1px solid var(--clearneonBlue);
    border-radius: 999px;
    background: rgba(0, 187, 255, .08);
    cursor: pointer;
    transition: background 160ms ease, box-shadow 160ms ease;
    &::after {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--whitesmoke);
      transition: transform 160ms ease;
    }
    &:checked { background: rgba(0, 187, 255, .35); box-shadow: 0 0 7px var(--neonBlue); }
    &:checked::after { transform: translateX(16px); background: var(--clearneonBlue); }
    &:focus-visible { outline: 2px solid var(--clearneonBlue); outline-offset: 2px; }
    &:disabled { opacity: .45; cursor: not-allowed; }
  }
  @media (max-width: 520px) { flex-wrap: wrap; }
`;

export const GameAdminEncounterHeader = styled.div`
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
  h3 { margin: 0 0 2px; }
  small { color: #b6c7d3; }
`;

export const GameAdminNpcSearch = styled.div`
  min-width: 0;
`;

export const GameAdminDelete = styled.button`
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0 !important;
  background: transparent !important;
  color: #ff6475 !important;
  cursor: pointer;
  svg { font-size: 1.3rem; }
  &:hover:not(:disabled) { color: #ff9ba6 !important; }
  &:disabled { opacity: .4; cursor: not-allowed; }
  &:focus-visible { outline: 2px solid #ff6475; outline-offset: 2px; }
`;

export const GameAdminImage = styled.div`
  max-width: 250px;
`;

export const GameAdminEncounterForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  padding: 4px 0;
`;

export const GameAdminTabs = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  border-bottom: 1px solid rgba(0, 187, 255, .3);
  padding-bottom: 10px;
  button {
    min-height: 40px;
    padding: 8px 14px;
    border: 1px solid rgba(0, 187, 255, .4);
    border-radius: 4px;
    background: rgba(0, 18, 31, .48);
    color: var(--whitesmoke);
    cursor: pointer;
    font-family: 'Cyberpunk Is Not Dead', sans-serif;
    font-size: .86rem;
    transition: background .2s, border-color .2s, box-shadow .2s;
    &[aria-pressed='true'], &:hover, &:focus-visible {
      border-color: var(--clearneonBlue);
      background: rgba(0, 187, 255, .12);
      color: var(--clearneonBlue);
      outline: none;
    }
    &[aria-pressed='true'] { box-shadow: 0 0 10px rgba(0, 187, 255, .16); }
  }
  @media (max-width: 600px) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    button { min-width: 0; }
  }
`;

export const GameAdminCatalog = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 235px), 1fr));
  gap: 16px;
  align-items: stretch;
  @media (max-width: 560px) { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  @media (max-width: 380px) { grid-template-columns: 1fr; }
`;

export const GameAdminEnemyCard = styled(CardContainer)`
  max-width: none;
  height: auto;
  min-height: 350px;
  padding: 12px;
  ${ManagementMetadata} > span {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  @media (max-width: 560px) { min-height: 275px; height: auto; }
`;

const gearPulse = keyframes`
  0%, 100% { box-shadow: 0 0 4px var(--clearneonBlue); filter: brightness(1); }
  50% { box-shadow: 0 0 13px var(--clearneonBlue); filter: brightness(1.4); }
`;

export const GameAdminGear = styled.button<{ $pulse: boolean }>`
  position: absolute;
  z-index: 1;
  top: 12px;
  right: 12px;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid var(--clearneonBlue);
  border-radius: 50%;
  background: rgba(0, 13, 23, .85);
  color: var(--clearneonBlue);
  cursor: pointer;
  animation: ${({ $pulse }) => $pulse ? gearPulse : 'none'} 1.8s ease-in-out infinite;
  svg { width: 21px; height: 21px; }
  &:hover, &:focus-visible { outline: none; color: var(--whitesmoke); box-shadow: 0 0 12px var(--clearneonBlue); }
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

export const GameAdminAddCard = styled.button`
  min-height: 350px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border: 1px dashed var(--clearneonBlue);
  border-radius: 8px;
  background: rgba(0, 187, 255, .04);
  color: var(--clearneonBlue);
  font-family: 'Cyberpunk Is Not Dead', sans-serif;
  cursor: pointer;
  svg { font-size: 2.6rem; }
  &:hover, &:focus-visible { outline: none; background: rgba(0, 187, 255, .12); box-shadow: 0 0 12px rgba(0, 187, 255, .25); }
  &:disabled { opacity: .4; cursor: not-allowed; }
  @media (max-width: 560px) { min-height: 275px; }
`;

export const GameAdminCardStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 10px;
  color: var(--whitesmoke);
  font-size: .83rem;
  span { min-width: 0; overflow-wrap: anywhere; }
  strong { color: var(--clearneonBlue); }
  @media (max-width: 560px) { grid-template-columns: 1fr; font-size: .75rem; }
`;

export const GameAdminHint = styled.p`
  margin: 0;
  color: #b6c7d3;
  font-size: .88rem;
  line-height: 1.35;
  &[role='alert'] {
    padding: 8px 10px;
    border-left: 2px solid #ffba53;
    background: rgba(90, 48, 11, .18);
    color: #ffd29a;
  }
`;

export const GameAdminInlineActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  min-width: 0;
  ${GameAdminHint} { margin-right: auto; }
  > button:not(${GameAdminDelete}) {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border: 0;
    background: transparent;
    color: var(--clearneonBlue);
    cursor: pointer;
    &:disabled { opacity: .35; cursor: default; }
    &:hover:not(:disabled) { color: var(--whitesmoke); }
  }
`;

export const GameAdminNpcActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  h4 { color: var(--clearneonBlue); margin: 0; }
`;

export const GameAdminNpcAction = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
  padding: 10px 0;
  border-bottom: 1px solid rgba(0, 187, 255, .25);
  strong { display: block; color: var(--whitesmoke); }
  span { display: block; color: #b6c7d3; font-size: .82rem; line-height: 1.4; }
  @media (max-width: 520px) { align-items: flex-start; flex-direction: column; }
`;
