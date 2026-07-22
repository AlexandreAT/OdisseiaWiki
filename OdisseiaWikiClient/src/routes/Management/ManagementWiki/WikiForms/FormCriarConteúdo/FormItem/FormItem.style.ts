import styled from 'styled-components';
import { managementEntityToolbarResponsive } from '../../ManagementEntityToolbar.style';
import { handleNumericInputFocus } from '../../../../../../utils/numericInput';

interface Props {
  theme?: 'dark' | 'light';
  neon?: 'on' | 'off';
}

export const FormController = styled.form<Props>`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 30px;
  padding: 30px;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;

  @media (max-width: 1100px) {
    padding: 22px;
    gap: 24px;
  }

  @media (max-width: 768px) {
    padding: 14px;
    gap: 20px;
  }
`;

export const FormHeader = styled.div<Props>`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

export const GridInputsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  width: 100%;
  min-width: 0;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const SectionTitle = styled.h2<Props>`
  font-family: 'DO Futuristic', sans-serif;
  font-weight: 100;
  letter-spacing: 3px;
  font-size: 1.1rem;
  margin: 20px 0 15px 0;
  color: ${({ theme }) =>
    theme === 'dark' ? 'var(--clearWhite)' : 'var(--deepgrey)'};
  border-bottom: 2px solid ${({ theme, neon }) =>
    theme === 'dark'
      ? neon === 'on'
        ? 'var(--clearneonBlue)'
        : 'var(--lightBlack)'
      : neon === 'on'
      ? 'var(--neonViolet)'
      : 'var(--lightGrey)'};
  padding-bottom: 10px;
`;

export const TagSectionHeader = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 10px;
  width: 100%;

  ${SectionTitle} {
    min-width: 0;
  }
`;

export const TagInfoDetails = styled.details<Props>`
  position: relative;
  z-index: 8;
  margin-bottom: 15px;

  &[open] {
    z-index: 12;
  }
`;

export const TagInfoSummary = styled.summary<Props>`
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 1px solid ${({ theme, neon }) => theme === 'dark'
    ? neon === 'on' ? 'var(--clearneonBlue)' : 'var(--grey)'
    : neon === 'on' ? 'var(--neonViolet)' : 'var(--grey)'};
  border-radius: 4px;
  background: ${({ theme }) => theme === 'dark' ? 'rgba(0, 10, 22, 0.82)' : 'var(--clearWhite)'};
  color: ${({ theme, neon }) => theme === 'dark'
    ? neon === 'on' ? 'var(--clearneonBlue)' : 'var(--lightGrey)'
    : neon === 'on' ? 'var(--neonViolet)' : 'var(--deepgrey)'};
  cursor: pointer;
  list-style: none;
  transition: border-color 160ms ease, color 160ms ease, box-shadow 160ms ease;

  &::-webkit-details-marker { display: none; }

  svg,
  svg path {
    width: 18px;
    height: 18px;
    color: currentColor !important;
    fill: currentColor !important;
    stroke: currentColor !important;
  }

  &:hover,
  &:focus-visible {
    border-color: ${({ theme }) => theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--neonViolet)'};
    color: ${({ theme }) => theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--neonViolet)'};
    box-shadow: 0 0 8px rgba(0, 190, 255, 0.18);
    outline: none;
  }
`;

export const TagInfoPopover = styled.div<Props>`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  display: flex;
  width: min(360px, calc(100vw - 48px));
  flex-direction: column;
  gap: 8px;
  border: 1px solid ${({ theme, neon }) => theme === 'dark'
    ? neon === 'on' ? 'var(--clearneonBlue)' : 'var(--grey)'
    : neon === 'on' ? 'var(--neonViolet)' : 'var(--grey)'};
  border-radius: 4px;
  padding: 12px 14px;
  background: ${({ theme }) => theme === 'dark' ? 'rgba(2, 10, 22, 0.98)' : 'rgba(248, 249, 252, 0.98)'};
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.38);
  box-sizing: border-box;

  strong {
    color: ${({ theme }) => theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--neonViolet)'};
    font-family: 'DO Futuristic', sans-serif;
    font-size: 11px;
    font-weight: 100;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme === 'dark' ? 'var(--lightGrey)' : 'var(--deepgrey)'};
    font-size: 11px;
    line-height: 1.55;
  }

  b { color: inherit; }

  p:nth-of-type(1) b { color: var(--clearneonGreen); }
  p:nth-of-type(2) b { color: #d6a900; }

  @media (max-width: 480px) {
    width: min(310px, calc(100vw - 36px));
    padding: 11px 12px;
  }
`;

export const AtributosSection = styled.div<Props>`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: ${({ theme }) =>
    theme === 'dark' ? 'var(--blackTransp)' : 'var(--whitesmoke)'};
  border-radius: 8px;
  border: 1px solid ${({ theme, neon }) =>
    theme === 'dark'
      ? neon === 'on'
        ? 'var(--clearneonBlue)'
        : 'var(--lightBlack)'
      : neon === 'on'
      ? 'var(--neonViolet)'
      : 'var(--lightGrey)'};
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 14px;
  }
`;

export const AtributosGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const ButtonsContainer = styled.div<Props>`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  gap: 15px;
  width: 100%;
  padding-top: 20px;
  border-top: 2px solid ${({ theme, neon }) =>
    theme === 'dark'
      ? neon === 'on'
        ? 'var(--clearneonBlue)'
        : 'var(--lightBlack)'
      : neon === 'on'
      ? 'var(--neonViolet)'
      : 'var(--lightGrey)'};

  @media (max-width: 768px) {
    flex-direction: column-reverse;
  }

  ${managementEntityToolbarResponsive}
`;

export const LabelInfoBox = styled.div<Props>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: ${({ theme }) =>
    theme === 'dark' ? 'var(--blackTransp)' : 'var(--clearWhite)'};
  border-radius: 6px;
  border: 1px solid ${({ theme, neon }) =>
    theme === 'dark'
      ? neon === 'on'
        ? 'var(--clearneonBlue)'
        : 'var(--lightBlack)'
      : neon === 'on'
      ? 'var(--neonViolet)'
      : 'var(--lightGrey)'};
`;

export const LabelStatus = styled.label`
  font-family: 'DO Futuristic', sans-serif;
  font-weight: 100;
  letter-spacing: 2px;
  font-size: 12px;
  text-transform: uppercase;
`;

export const MinimalInput = styled.input.attrs({ type: 'number', onFocus: handleNumericInputFocus })`
  width: 100%;
  height: 36px;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  border-radius: 4px;
  padding: 8px;
  border-bottom: 1px solid currentColor;
  transition: all 0.2s ease;
  appearance: none;
  -moz-appearance: textfield;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &:focus {
    outline: none;
    border-bottom-width: 2px;
  }
`;

export const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
`;

export const RichTextSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
`;

export const ImageSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
`;

export const TagsInputContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: flex-start;
  width: 100%;
  margin-bottom: 5px;
  min-width: 0;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

export const TagsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
  min-height: 40px;
`;

export const TagItem = styled.div<Props>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 20px;
  background: ${({ theme, neon }) =>
    theme === 'dark'
      ? neon === 'on'
        ? 'var(--blackTransp)'
        : 'var(--clearblack)'
      : neon === 'on'
      ? 'var(--whitesmoke)'
      : 'var(--clearWhite)'};
  border: 1px solid ${({ theme, neon }) =>
    theme === 'dark'
      ? neon === 'on'
        ? 'var(--clearneonBlue)'
        : 'var(--lightGrey)'
      : neon === 'on'
      ? 'var(--neonViolet)'
      : 'var(--deepgrey)'};
  font-size: 12px;
  color: ${({ theme }) =>
    theme === 'dark' ? 'var(--clearWhite)' : 'var(--deepgrey)'};
  transition: all 0.2s ease;
`;

export const TagRemoveButton = styled.button`
  background: none;
  border: none;
  color: var(--red);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
`;

export const TagInput = styled.input<Props>`
  width: 100%;
  height: 40px;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background: ${({ theme }) =>
    theme === 'dark' ? 'var(--blackTransp)' : 'var(--clearWhite)'};
  border: 1px solid ${({ theme, neon }) =>
    theme === 'dark'
      ? neon === 'on'
        ? 'var(--clearneonBlue)'
        : 'var(--lightBlack)'
      : neon === 'on'
      ? 'var(--neonViolet)'
      : 'var(--lightGrey)'};
  color: ${({ theme }) =>
    theme === 'dark' ? 'var(--clearWhite)' : 'var(--deepgrey)'};
  font-family: inherit;
  font-size: inherit;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme, neon }) =>
      theme === 'dark'
        ? neon === 'on'
          ? 'var(--clearneonBlue)'
          : 'var(--neonBlue)'
        : neon === 'on'
        ? 'var(--neonViolet)'
        : 'var(--clearneonViolet)'};
    box-shadow: 0 0 8px ${({ theme, neon }) =>
      theme === 'dark'
        ? neon === 'on'
          ? 'rgba(0, 255, 255, 0.2)'
          : 'rgba(0, 0, 0, 0.1)'
        : neon === 'on'
        ? 'rgba(200, 100, 200, 0.2)'
        : 'rgba(0, 0, 0, 0.05)'};
  }

  &::placeholder {
    color: ${({ theme }) =>
      theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)'};
  }
`;

export const FormItemAtributos = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  gap: 15px;
`;
