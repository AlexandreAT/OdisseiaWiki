import styled from 'styled-components';

export const ListModalTitle = styled.span`
  font-family: 'Cyberpunk Is Not Dead', sans-serif;
  font-size: 18px;
  font-weight: 100;
  letter-spacing: 3px;
  color: var(--black);
  text-shadow: -1px -1px 0 var(--neonBlue), -1px 1px 0 var(--neonBlue), 1px -1px 0 var(--neonBlue), 1px 1px 0 var(--neonBlue);
`;

export const ListModalGrid = styled.div<{ $color: string }>`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  > * {
    min-width: 0;
    border-color: ${({ $color }) => $color};
  }

  @media (max-width: 767px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const ListModalEmpty = styled.p`
  margin: 0;
  color: var(--muted, #cfcfcf);
  text-align: center;
`;
