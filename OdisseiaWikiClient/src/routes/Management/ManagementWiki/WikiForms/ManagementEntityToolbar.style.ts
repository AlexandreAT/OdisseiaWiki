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
    justify-content: flex-start;
    gap: 8px;
    padding: 6px;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      display: none;
    }

    > div {
      flex: 0 0 min(145px, calc(50% - 4px));
      width: min(145px, calc(50% - 4px)) !important;
      height: 51px !important;

      > div,
      > button {
        width: calc(100% - 15px) !important;
        height: 38px !important;
      }

      > button {
        padding-inline: 6px;
        font-size: 10px;
      }
    }
  }
`;
