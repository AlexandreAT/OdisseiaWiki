import styled from 'styled-components';

export const TargetSelectionIntro = styled.p`
  margin: 0;
  color: #bdd9e5;
  font-size: .86rem;
`;

export const TargetBoard = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: clamp(24px, 7vw, 90px);
  min-width: 0;
`;

export const TargetColumn = styled.div`
  display: grid;
  align-content: start;
  gap: 9px;
  min-width: 0;
  > h3 { margin: 0; color: var(--clearneonBlue); font-size: .8rem; text-transform: uppercase; }
`;

export const TargetCard = styled.button<{ $enemy: boolean; $chosen: boolean; $highlight: boolean }>`
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  min-height: 65px;
  padding: 8px;
  border: 1px solid ${({ $enemy }) => $enemy ? '#ff889466' : '#4deeea80'};
  border-radius: 6px;
  background: ${({ $enemy }) => $enemy ? 'rgba(74, 23, 34, .52)' : 'rgba(7, 39, 54, .68)'};
  color: #ecfaff;
  text-align: left;
  font: inherit;
  cursor: pointer;
  transition: border-color .18s, box-shadow .18s;
  ${({ $chosen, $highlight }) => ($chosen || $highlight) && `
    border-color: var(--clearneonBlue);
    box-shadow: 0 0 12px rgba(77, 238, 234, .42);
  `}
  &:hover { border-color: var(--clearneonBlue); }
  &:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
  img, .target-avatar {
    flex: 0 0 42px;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    object-fit: cover;
    display: grid;
    place-items: center;
    background: rgba(77, 238, 234, .12);
  }
  strong { overflow-wrap: anywhere; font-size: .83rem; }
  @media (max-width: 600px) {
    min-height: 54px;
    gap: 5px;
    padding: 5px;
    img, .target-avatar { flex-basis: 30px; width: 30px; height: 30px; }
    strong { font-size: .69rem; }
  }
`;

export const TargetLines = styled.svg`
  position: absolute;
  inset: 0;
  z-index: 3;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
`;

export const TargetActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;
