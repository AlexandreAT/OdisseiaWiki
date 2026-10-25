import styled from 'styled-components';

export const TrainingChoices = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 16px;
  align-items: start;
  @media (max-width: 440px) { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
`;
export const TrainingEnemyCard = styled.button`
  display: grid;
  justify-items: stretch;
  gap: 10px;
  min-width: 0;
  padding: 14px 12px;
  border: 1px solid rgba(77,238,234,.3);
  border-radius: 6px;
  background: rgba(1,14,27,.85);
  color: var(--grey);
  font: inherit;
  cursor: pointer;
  transition: border-color .18s ease, background .18s ease, box-shadow .18s ease;
  &:hover:not(:disabled), &:focus-visible {
    border-color: var(--clearneonBlue);
    background: rgba(0,75,95,.25);
  }
  &[data-neon='true']:hover:not(:disabled) { box-shadow: 0 0 12px rgba(77,238,234,.2); }
  &:focus-visible { outline: 2px solid var(--clearneonBlue); outline-offset: 3px; }
  &:disabled { cursor: wait; opacity: .6; }
  > strong {
    font-family: 'DO Futuristic', sans-serif;
    color: var(--clearneonRed);
    font-size: 1.12rem;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  > small { color: var(--grey); font-size: .72rem; text-align: center; }
`;
export const TrainingPortrait = styled.span`
  display: grid;
  place-items: center;
  justify-self: center;
  width: 82px;
  height: 82px;
  overflow: hidden;
  border: 1px solid var(--clearneonRed);
  border-radius: 50%;
  color: var(--clearneonRed);
  background: rgba(0,0,0,.3);
  img { width: 100%; height: 100%; object-fit: cover; }
  svg { font-size: 38px; }
`;
export const TrainingHint = styled.p`
  color: var(--grey);
  font-size: .85rem;
  line-height: 1.5;
  margin: 0 0 16px;
`;
