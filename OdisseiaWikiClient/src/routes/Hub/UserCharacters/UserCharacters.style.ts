import { IconButton } from '@mui/material';
import { styled } from 'styled-components';

interface Props {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

const accentColor = ({ theme, neon }: Props) => theme === 'dark'
  ? neon === 'on' ? 'var(--clearneonBlue)' : 'var(--neonBlue)'
  : neon === 'on' ? 'var(--clearneonViolet)' : 'var(--neonViolet)';

export const Main = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  max-width: 1320px;
  width: 100%;
  min-width: 0;
  gap: 30px;
  margin-bottom: 20px;
  padding: 0 76px 40px;
  box-sizing: border-box;
  z-index: 1;

  @media (max-width: 1100px) {
    padding-inline: 40px;
  }

  @media (max-width: 768px) {
    gap: 20px;
    padding: 0 16px 32px;
  }

  @media (max-width: 480px) {
    padding-inline: 4px;
  }
`;

export const Title = styled.h2<Props & { $editMode?: boolean }>`
  font-family: 'DO Futuristic', sans-serif;
  font-weight: 100;
  letter-spacing: 3px;
  font-size: 24px;

  ${({ theme, neon }) => theme === 'light'
    ? `color: var(--clearneonYellow) !important; text-shadow: 0 0 5px ${neon === 'on' ? 'var(--deepneonYellow)' : 'var(--clearneonViolet)'};`
    : `color: ${neon === 'on' ? 'var(--neonBlue)' : 'var(--clearneonBlue)'} !important; text-shadow: ${neon === 'on' ? '0 0 5px var(--clearneonBlue)' : '1.5px 1.5px 5px var(--clearneonPink)'};`
  }

  @media (max-width: 768px) {
    ${({ $editMode }) => $editMode && 'margin-top: 14px;'}
  }
`;

export const ListController = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  width: 100%;
  min-width: 0;
  gap: 24px;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
  }
`;

export const ListHeaderTools = styled.div<Props>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
  min-width: 0;
  padding: 2px 0;
  border: 0;
  background: transparent;
  box-sizing: border-box;

  @media (max-width: 768px) {
    justify-content: stretch;
    gap: 7px;
    padding: 0;
  }
`;

export const ToolField = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: var(--clearneonBlue);
  font-size: 0.72rem;
  font-weight: 700;

  > svg {
    width: 18px;
    height: 18px;
    flex: 0 0 auto;
    fill: currentColor;
  }

  @media (max-width: 768px) {
    flex: 1 1 calc(50% - 4px);

    > span {
      display: none;
    }
  }
`;

export const FilterValueField = styled(ToolField)`
  @media (max-width: 768px) {
    flex-basis: 100%;

    > span {
      display: inline;
      flex: 0 0 auto;
    }
  }
`;

export const ToolSelect = styled.select`
  max-width: 100%;
  min-width: 0;
  min-height: 36px;
  padding: 6px 36px 6px 10px;
  border: 1px solid var(--neonBlue);
  border-radius: 3px;
  color: var(--whitesmoke);
  background-color: rgba(0, 12, 24, 0.96);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.25 6 6.25l5-5' fill='none' stroke='%2300d2ff' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-position: right 11px center;
  background-repeat: no-repeat;
  appearance: none;
  -webkit-appearance: none;
  font: inherit;
  cursor: pointer;

  &:focus-visible {
    outline: 1px solid var(--clearneonBlue);
    box-shadow: 0 0 5px var(--neonBlue);
  }

  @media (max-width: 768px) {
    width: 100%;
    font-size: 0.7rem;
  }
`;

const toolbarButtonStyles = `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 36px;
  padding: 7px 10px;
  border-radius: 3px;
  font: inherit;
  font-size: 0.7rem;
  font-weight: 800;
  cursor: pointer;
  transition: color 160ms ease, background 160ms ease, box-shadow 160ms ease;

  svg {
    width: 18px;
    height: 18px;
    fill: currentColor;
  }

  span,
  svg,
  svg path {
    color: inherit;
    fill: currentColor;
  }
`;

export const SelectModeButton = styled.button<{ $active: boolean }>`
  ${toolbarButtonStyles}
  border: 1px solid var(--neonBlue);
  color: ${({ $active }) => $active ? 'var(--black)' : 'var(--clearneonBlue)'};
  background: ${({ $active }) => $active ? 'var(--clearneonBlue)' : 'rgba(0, 15, 28, 0.78)'};

  &:hover,
  &:focus-visible {
    color: var(--black);
    background: var(--clearneonBlue);
    box-shadow: 0 0 7px var(--neonBlue);

    span,
    svg,
    svg path {
      color: var(--black) !important;
      fill: var(--black) !important;
    }
  }

  @media (max-width: 768px) {
    flex: 1 1 calc(65% - 4px);
  }
`;

export const DeleteSelectedButton = styled.button`
  ${toolbarButtonStyles}
  border: 1px solid var(--clearneonRed);
  color: var(--clearneonRed);
  background: rgba(28, 0, 4, 0.72);

  &:not(:disabled):hover,
  &:not(:disabled):focus-visible {
    color: var(--black);
    background: var(--clearneonRed);
    box-shadow: 0 0 7px var(--neonRed);

    span,
    svg,
    svg path {
      color: var(--black) !important;
      fill: var(--black) !important;
    }
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    flex: 1 1 calc(35% - 4px);
  }
`;

export const ButtonDiv = styled.div<Props>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;

  .icon { fill: ${accentColor}; }
`;

export const BackButtonDiv = styled.div<Props>`
  position: absolute;
  top: 64px;
  left: 8px;
  z-index: 250;

  .icon { fill: ${accentColor}; }

  @media (max-width: 1100px) {
    display: none;
  }
`;

export const StyledIconButton = styled(IconButton)<Props>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60px;
  height: 60px;
  border: 2px solid ${accentColor} !important;
  border-radius: 50%;
  transition: all 0.3s ease;

  .icon {
    fill: ${accentColor};
    font-size: 32px;
    transition: all 0.3s ease;
  }

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    padding: 5px;

    .icon { font-size: 22px; }
  }

  @media (hover: hover) {
    &:hover {
      border-color: ${accentColor} !important;
      background-color: ${accentColor} !important;
      box-shadow: 0 0 10px 1px ${accentColor} !important;

      .icon { fill: ${({ theme }) => theme === 'dark' ? 'var(--black)' : 'var(--whitesmoke)'}; }
    }
  }
`;
