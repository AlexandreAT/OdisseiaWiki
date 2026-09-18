import styled from 'styled-components';

export const VariantSheet = styled.section`
  position: relative;
  width: 100%;
  min-width: 0;
  z-index: 1;
  padding: 0 42px;
  box-sizing: border-box;
  scroll-margin-top: calc(var(--main-header-height, 85px) + 16px);
  @media (max-width: 768px) { padding: 0; }
`;

export const VariantHeading = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin: 18px 0 24px;
  min-height: 56px;
  padding: 0 48px;
  text-align: center;
  overflow-wrap: anywhere;
  color: inherit;
  small { opacity: .8; }

  @media (max-width: 768px) {
    margin: 14px 0 16px;
    padding: 0 48px;
  }
`;

export const VariantPicker = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  max-width: 100%;
  margin-top: 2px;
  color: inherit;
  font-size: 0.72rem;
  opacity: 0.86;

  label {
    white-space: nowrap;
  }

  select {
    min-width: 150px;
    max-width: min(280px, 60vw);
    padding: 4px 24px 4px 7px;
    border: 1px solid var(--clearneonBlue);
    border-radius: 3px;
    background: var(--blackTransp);
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  option {
    background: var(--black-blue);
    color: var(--whitesmoke);
  }

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 4px;

    select {
      width: min(210px, 58vw);
      min-width: 0;
      max-width: 100%;
    }
  }
`;

export const VariantArrow = styled.button<{ $side: 'left' | 'right'; $neon: boolean }>`
  position: absolute;
  ${({ $side }) => $side}: 0;
  top: 180px;
  width: 36px;
  min-height: 48px;
  border: 1px solid var(--neonBlue);
  background: ${({ $neon }) => $neon ? 'rgba(0, 180, 235, .14)' : 'transparent'};
  color: var(--neonBlue);
  font-size: 26px;
  cursor: pointer;
  &:disabled { opacity: .3; cursor: default; }
  &:focus-visible { outline: 2px solid var(--neonBlue); outline-offset: 2px; }
  @media (max-width: 768px) { top: 0; width: 40px; }
`;

export const VariantFooter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  justify-content: center;
  margin: 24px 0;
`;
