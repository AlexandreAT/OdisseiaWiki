import styled from 'styled-components';
import HudCornerThin from '../../../assets/svg/HudCornerThin.svg';
import { HudFrame } from '../../../components/Generic/HudFrame/HudFrame';
import { Corner } from '../../../components/Generic/HudFrame/HudFrame.style';

export const ActionDialogFrame = styled(HudFrame)`
  && { background: linear-gradient(145deg, rgba(2, 16, 31, .985), rgba(1, 7, 17, .98)); }
  && > ${Corner} {
    width: 52px;
    height: 52px;
    -webkit-mask-image: url("${HudCornerThin}");
    mask-image: url("${HudCornerThin}");
  }
  && > ${Corner}:nth-child(1) { top: -1px; left: -1px; }
  && > ${Corner}:nth-child(2) { top: -1px; right: -1px; }
  && > ${Corner}:nth-child(3) { bottom: -1px; left: -1px; }
  && > ${Corner}:nth-child(4) { bottom: -1px; right: -1px; }
`;

export const ActionDialogHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 15px 16px 10px;
  min-width: 0;
  border-bottom: 1px solid rgba(77, 238, 234, .2);
  > div { min-width: 0; }
  h3 { margin: 0; color: var(--clearneonBlue); font-family: 'Orbitron', sans-serif;
    font-size: .95rem; line-height: 1.35; overflow-wrap: anywhere; }
`;

export const ActionDialogMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
  margin-top: 5px;
  color: #a3bbc6;
  font-size: .75rem;
  line-height: 1.4;
  font-variant-numeric: tabular-nums;
`;

export const ActionDialogClose = styled.button`
  flex: none;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 0;
  background: transparent;
  color: var(--clearneonBlue);
  cursor: pointer;
  &:hover { color: white; }
  &:focus-visible { outline: 2px solid white; }
`;

export const ActionDialogBody = styled.div`
  display: grid;
  gap: 12px;
  padding: 14px 16px 17px;
  min-width: 0;
  label { display: grid; gap: 5px; color: #b9d1da; font-size: .8rem; }
  select, input {
    min-height: 38px;
    width: 100%;
    padding: 6px 9px;
    border: 1px solid rgba(77, 238, 234, .5);
    background: #061622;
    color: #d9f4ff;
    font: inherit;
  }
  select:focus-visible, input:focus-visible { outline: 2px solid white; }
  > button { justify-self: start; min-width: 110px; }
`;
