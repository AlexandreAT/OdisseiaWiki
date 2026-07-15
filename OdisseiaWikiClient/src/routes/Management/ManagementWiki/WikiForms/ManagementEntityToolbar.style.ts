import { css } from 'styled-components';

export const managementEntityToolbarResponsive = css`
  @media (max-width: 1100px) {
    order: -1;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    width: 100%;
    gap: 10px;
    margin-top: 0;
    padding: 10px;
    border: 0;
    border-radius: 8px;
    background: rgba(0, 8, 18, 0.78);
    box-sizing: border-box;
    flex-wrap: wrap;
  }

  @media (max-width: 768px) {
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: center;
    gap: 4px;
    padding: 6px;

    > div {
      flex: 1 1 0;
      width: auto !important;
      min-width: 0;
      height: 44px !important;

      > div,
      > button {
        width: 100% !important;
        height: 36px !important;
      }

      > button {
        padding-inline: 4px;
        font-size: 9px;
      }
    }
  }
`;
