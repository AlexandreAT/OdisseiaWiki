import styled from 'styled-components';

export const MultiStepNavigationContainer = styled.nav<{ $position: 'top' | 'bottom' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  width: 100%;
  gap: 20px;
  margin: ${({ $position }) => $position === 'top' ? '0 0 4px' : '4px 0 0'};
  box-sizing: border-box;

  > * {
    max-width: 100%;
  }

  @media (max-width: 1100px) {
    padding: 10px;
    border-radius: 8px;
    background: rgba(0, 8, 18, 0.78);
  }

  @media (max-width: 768px) {
    flex-wrap: nowrap;
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
