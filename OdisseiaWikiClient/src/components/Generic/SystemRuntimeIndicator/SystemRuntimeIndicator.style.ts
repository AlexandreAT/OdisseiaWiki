import styled from 'styled-components';

export const RuntimeIndicator = styled.aside<{ $hasWarnings: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-width: 0;
  padding: 8px 12px;
  box-sizing: border-box;
  border-left: 2px solid ${({ $hasWarnings }) => $hasWarnings ? 'var(--neonYellow)' : 'var(--neonBlue)'};
  border-bottom: 1px solid ${({ $hasWarnings }) => $hasWarnings ? 'rgba(255, 214, 0, 0.5)' : 'rgba(0, 210, 255, 0.38)'};
  border-bottom-left-radius: 5px;
  background: rgba(0, 9, 20, 0.42);

  @media (max-width: 600px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }
`;

export const RuntimeIdentity = styled.div`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 5px 9px;
  min-width: 0;
`;

export const RuntimeName = styled.strong`
  color: var(--clearneonBlue);
  font-family: 'DO Futuristic', sans-serif;
  font-size: 0.78rem;
  font-weight: 100;
  letter-spacing: 1px;
  overflow-wrap: anywhere;
`;

export const RuntimeMeta = styled.span`
  color: var(--grey);
  font-size: 0.69rem;
  line-height: 1.35;

  @media (max-width: 600px) {
    font-size: 0.78rem;
  }
`;

export const RuntimeWarningGroup = styled.div`
  position: relative;
  min-width: 0;

  &:hover > [role='tooltip'],
  &:focus-within > [role='tooltip'] {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
    pointer-events: auto;
  }
`;

export const RuntimeWarning = styled.button<{ $outdated?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: 0 0 auto;
  padding: 2px 3px;
  border: 0;
  color: ${({ $outdated }) => $outdated ? 'var(--neonRed)' : 'var(--clearneonYellow)'};
  background: transparent;
  font-size: 0.68rem;
  font-family: inherit;
  cursor: help;

  svg {
    width: 16px;
    height: 16px;
  }

  @media (max-width: 600px) {
    padding: 4px 3px;
    font-size: 0.78rem;
    line-height: 1.35;
    text-align: left;
  }
`;

export const RuntimeMessagePanel = styled.div`
  position: absolute;
  z-index: 1200;
  top: calc(100% + 7px);
  right: 0;
  width: min(430px, calc(100vw - 32px));
  max-height: min(230px, 42vh);
  padding: 10px 12px;
  overflow-x: hidden;
  overflow-y: auto;
  box-sizing: border-box;
  border: 1px solid rgba(255, 214, 0, 0.65);
  border-radius: 4px;
  color: var(--white);
  background: rgba(8, 9, 15, 0.98);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.48);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-4px);
  pointer-events: none;
  transition: opacity 0.15s ease, transform 0.15s ease, visibility 0.15s ease;
  scrollbar-width: thin;
  scrollbar-color: var(--clearneonYellow) rgba(255, 255, 255, 0.06);

  @media (max-width: 600px) {
    right: auto;
    left: 0;
    width: min(390px, calc(100vw - 32px));
    max-height: min(210px, 38vh);
    padding: 12px 13px;
  }
`;

export const RuntimeMessageList = styled.ul`
  display: grid;
  gap: 7px;
  margin: 0;
  padding: 0 0 0 16px;
  font-size: 0.72rem;
  line-height: 1.4;
  white-space: normal;

  li::marker {
    color: var(--clearneonYellow);
  }

  @media (max-width: 600px) {
    gap: 9px;
    padding-left: 18px;
    font-size: 0.84rem;
    line-height: 1.5;
  }
`;

export const RuntimeActions = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
`;

export const RuntimeUpdateButton = styled.button`
  padding: 5px 9px;
  border: 1px solid var(--neonGreen);
  border-radius: 4px;
  color: var(--clearneonGreen);
  background: rgba(0, 255, 160, 0.06);
  font-family: 'DO Futuristic', sans-serif;
  font-size: 0.66rem;
  letter-spacing: 0.5px;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: rgba(0, 255, 160, 0.14);
    box-shadow: 0 0 7px rgba(0, 255, 160, 0.32);
  }

  &:disabled {
    opacity: 0.55;
    cursor: wait;
  }

  @media (max-width: 600px) {
    padding: 7px 10px;
    font-size: 0.76rem;
  }
`;
