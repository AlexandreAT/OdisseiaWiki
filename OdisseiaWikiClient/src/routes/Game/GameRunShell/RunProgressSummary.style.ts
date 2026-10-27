import styled from 'styled-components';

export const RunXpLabel = styled.p`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 3px 7px;
  min-width: 0;
  line-height: 1.6;
  font-variant-numeric: tabular-nums;
  > span { display: inline-block; min-width: 0; max-width: 100%; overflow-wrap: anywhere; }
  > button { flex: none; }
`;
