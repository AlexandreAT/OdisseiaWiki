import styled from 'styled-components';

export const SelectableInventoryCard = styled.div`
  position: relative; min-width: 0; width: min(100%, 210px); justify-self: center;
  > button { width: 100%; }
`;

export const InventoryCardSelection = styled.div`
  position: absolute; z-index: 3; top: 18px; right: 18px;
  display: grid; place-items: center;
  width: 20px; height: 20px;
  input { margin: 0; flex: none; cursor: pointer; }
  label { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
`;
