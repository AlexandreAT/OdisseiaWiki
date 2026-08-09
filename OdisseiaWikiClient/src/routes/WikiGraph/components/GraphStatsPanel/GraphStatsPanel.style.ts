import styled from 'styled-components';

export const StatsPositioner = styled.div`
  position: absolute;
  top: 18px;
  left: 18px;
  z-index: 8;
  width: min(220px, calc(100% - 36px));

  @media (max-width: 1100px) {
    top: 12px;
    left: 12px;
    width: 190px;
  }

  @media (max-width: 768px) {
    top: 8px;
    left: 8px;
    width: 158px;
  }
`;

export const StatsContent = styled.div`
  padding: 22px 18px 20px;

  @media (max-width: 768px) {
    padding: 16px 12px 14px;
  }
`;

export const StatsTitle = styled.h2`
  margin: 0 0 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(71, 219, 255, 0.2);
  color: var(--clearneonBlue);
  font-family: 'Cyberpunk Is Not Dead', sans-serif;
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 1.2px;
  text-transform: uppercase;

  @media (max-width: 768px) {
    margin-bottom: 8px;
    padding-bottom: 7px;
    font-size: 10.5px;
  }
`;

export const StatList = styled.dl<{ $neon: boolean }>`
  display: grid;
  gap: 14px;
  margin: 0;

  > div {
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr);
    gap: 9px;
    align-items: center;
  }

  svg {
    grid-row: span 2;
    color: var(--clearneonBlue) !important;
    fill: var(--clearneonBlue) !important;
    font-size: 22px;
    filter: ${({ $neon }) => $neon ? 'drop-shadow(0 0 5px var(--clearneonBlue))' : 'none'};
  }

  dt {
    color: rgba(245, 245, 245, 0.74);
    font-size: 10px;
    letter-spacing: 0.7px;
    text-transform: uppercase;
  }

  dd {
    min-width: 0;
    margin: 2px 0 0;
    color: var(--whitesmoke);
    font-family: 'Orbitron', sans-serif;
    font-size: 20px;
    line-height: 1.1;
    overflow-wrap: anywhere;
  }

  @media (max-width: 768px) {
    gap: 8px;

    > div {
      grid-template-columns: 20px minmax(0, 1fr);
      gap: 6px;
    }

    svg { font-size: 16px; }
    dt { font-size: 9px; }
    dd { font-size: 14px; }
  }
`;

export const CentralType = styled.span`
  display: block;
  margin-top: 3px;
  color: var(--clearneonBlue);
  font-family: 'DO Futuristic', sans-serif;
  font-size: 10px;
  letter-spacing: 0.7px;
`;
