import styled from 'styled-components';
import { MesaGameActivityPanel } from './GameplayLiveHistory.style';

export const CombatPanel = styled(MesaGameActivityPanel)`
  flex: 0 1 auto;
  height: auto;
  min-height: 220px;
  max-height: min(52svh, 560px);

  @media (max-width: 720px) {
    height: auto;
    min-height: 220px;
    max-height: min(58svh, 520px);
  }
`;

export const CombatHeader = styled.header`
  position: relative;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 16px 16px 12px;
  border-bottom: 1px solid rgba(57, 211, 255, .27);

  h2 { margin: 0; color: var(--clearneonBlue); font-family: 'DO Futuristic', sans-serif; font-size: 1.05rem; font-weight: 100; }
  small { color: var(--lightGrey); font-size: .7rem; }
`;

export const CombatContent = styled.div`
  position: relative;
  z-index: 5;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 12px 14px 18px;
  scrollbar-width: thin;
  scrollbar-color: var(--clearneonBlue) rgba(0, 23, 43, .72);
  &::-webkit-scrollbar { width: 7px; }
  &::-webkit-scrollbar-track { background: rgba(0, 23, 43, .72); }
  &::-webkit-scrollbar-thumb { border-radius: 8px; background: var(--clearneonBlue); }
`;

export const CombatMessage = styled.p<{ $error?: boolean }>`
  margin: 0 0 10px;
  padding: 10px;
  border-left: 2px solid ${({ $error }) => $error ? 'var(--neonRed)' : 'var(--clearneonBlue)'};
  background: rgba(0, 10, 23, .72);
  color: ${({ $error }) => $error ? 'var(--neonRed)' : 'var(--lightGrey)'};
  font-size: .75rem;
  line-height: 1.4;
`;

export const CombatList = styled.div`
  display: grid;
  gap: 7px;
`;

export const CombatParticipant = styled.article<{ $active?: boolean }>`
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid ${({ $active }) => $active ? 'var(--clearneonPink)' : 'rgba(57, 211, 255, .32)'};
  border-left-width: 2px;
  background: ${({ $active }) => $active ? 'rgba(255, 0, 168, .08)' : 'rgba(0, 12, 25, .75)'};

  img, .combat-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; display: grid; place-items: center; background: rgba(57, 211, 255, .1); color: var(--clearneonBlue); }
  strong { display: block; min-width: 0; color: var(--whitesmoke); font-size: .78rem; overflow-wrap: anywhere; }
  small { color: var(--lightGrey); font-size: .66rem; }
`;

export const InitiativeValue = styled.span`
  min-width: 28px;
  color: var(--clearneonBlue);
  font-size: .88rem;
  font-weight: 800;
  text-align: center;
`;

export const CombatButton = styled.button<{ $danger?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 31px;
  padding: 6px 9px;
  border: 1px solid ${({ $danger }) => $danger ? 'var(--neonRed)' : 'var(--clearneonBlue)'};
  background: rgba(0, 18, 34, .78);
  color: ${({ $danger }) => $danger ? 'var(--neonRed)' : 'var(--clearneonBlue)'};
  font-size: .68rem;
  font-weight: 700;
  cursor: pointer;
  transition: color 150ms ease, border-color 150ms ease, background 150ms ease;
  &:hover:not(:disabled), &:focus-visible { color: var(--clearneonPink); border-color: var(--clearneonPink); background: rgba(255, 0, 168, .08); outline: none; }
  &:disabled { opacity: .48; cursor: wait; }
`;

export const CombatActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 10px;
`;

export const CombatForm = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(78px, .45fr) auto;
  gap: 7px;
  margin-top: 10px;

  input, select {
    min-width: 0;
    height: 34px;
    padding: 0 8px;
    border: 1px solid rgba(57, 211, 255, .38);
    background: rgba(0, 8, 18, .88);
    color: var(--whitesmoke);
  }

  @media (max-width: 560px) { grid-template-columns: minmax(0, 1fr); }
`;

export const SelectionRow = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 4px;
  color: var(--whitesmoke);
  font-size: .75rem;
  cursor: pointer;
  input { accent-color: var(--clearneonBlue); }
`;

export const RestSection = styled.section`
  margin-bottom: 12px;
  padding: 10px;
  border-left: 2px solid var(--clearneonGreen);
  background: rgba(0, 30, 25, .34);

  > strong { color: var(--clearneonGreen); font-size: .76rem; }
`;

export const ConditionChips = styled.div`
  grid-column: 2 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  span, button { padding: 3px 6px; border: 1px solid rgba(255, 214, 90, .45); background: rgba(255, 214, 90, .07); color: #ffd65a; font-size: .62rem; }
  button { cursor: pointer; }
`;
