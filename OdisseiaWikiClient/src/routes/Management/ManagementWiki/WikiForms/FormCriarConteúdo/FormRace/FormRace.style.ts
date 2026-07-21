import styled from "styled-components";
import { managementEntityToolbarResponsive } from '../../ManagementEntityToolbar.style';

interface Props {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const FormController = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 20px;
  align-items: center;
  justify-content: center;
  z-index: 100;
  min-width: 0;
  max-width: 100%;
`;

export const FormHeader = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
`;

export const HeaderInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  min-width: 0;
  overflow: hidden;

`;

export const ImageSection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;

  > div {
    width: min(100%, 380px);
  }
`;

export const StatusSection = styled.div<Props>`
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid transparent;
  border-color: ${(props) =>
    props.neon === 'on'
      && (props.theme === 'light'
        ? 'var(--clearneonViolet)'
        : 'var(--clearneonBlue)')};
  background-color: ${(props) =>
    props.theme === 'light' ? 'var(--lightgray)' : 'var(--clearblack)'};

  transition: border-color 0.3s ease, background-color 0.3s ease;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 14px;
    gap: 10px;
  }
`;

export const StatusTitle = styled.h3<Props>`
  font-family: 'DO Futuristic', sans-serif;
  font-size: clamp(0.88rem, 1.35vw, 1.08rem);
  font-weight: 400;
  letter-spacing: 0.16em;
  line-height: 1.35;
  margin: 0;
  text-transform: uppercase;
  color: ${(props) =>
    props.neon === 'on'
      ? props.theme === 'light'
        ? 'var(--clearneonViolet)'
        : 'var(--clearneonBlue)'
      : props.theme === 'light'
        ? 'var(--black)'
        : 'var(--whitesmoke)'};
  text-shadow: ${(props) => props.neon === 'on'
    ? props.theme === 'light'
      ? '0 0 7px var(--neonViolet)'
      : '0 0 7px var(--neonBlue)'
    : 'none'};
`;

export const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 15px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const PassivasSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
`;

export const PassivasList = styled.div<Props>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 10px;
  border-radius: 6px;
  background-color: ${(props) =>
    props.theme === 'light' ? 'var(--clearWhite)' : 'var(--lightBlack)'};

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--gray);
    border-radius: 3px;
  }
`;

export const PassivaItem = styled.div<Props>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  background-color: ${(props) =>
    props.theme === 'light' ? 'var(--lightgray)' : 'var(--deepgray)'};
  color: ${(props) =>
    props.theme === 'light' ? 'var(--black)' : 'var(--whitesmoke)'};
`;

export const PassivaText = styled.span`
  flex: 1;
  font-size: 14px;
`;

export const DeleteButton = styled.button<Props>`
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background-color: var(--error);
  color: var(--white);
  cursor: pointer;
  font-size: 12px;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
`;

export const AddPassivaContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: flex-end;
  min-width: 0;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const TagsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
`;

export const CheckboxSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 0;

  @media (max-width: 480px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

export const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 15px;
  width: 100%;
  justify-content: flex-end;
  margin-top: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
  }

  ${managementEntityToolbarResponsive}
`;

export const ErrorText = styled.span<Props>`
  font-size: 13px;
  color: var(--error);
  margin-top: -8px;
`;

export const ContentSection = styled.section`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  padding: 18px;
  box-sizing: border-box;
  border: 1px solid rgba(104, 139, 160, 0.28);
  border-radius: 7px;
  background: linear-gradient(135deg, rgba(0, 19, 34, 0.34), rgba(2, 7, 15, 0.12));

  @media (max-width: 768px) {
    padding: 13px;
  }
`;

export const SectionHeader = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 0 0 10px 14px;
  border-bottom: 1px solid rgba(0, 205, 255, 0.2);

  &::before {
    content: '';
    position: absolute;
    top: 2px;
    bottom: 10px;
    left: 0;
    width: 2px;
    background: var(--clearneonBlue);
    box-shadow: 0 0 7px var(--neonBlue);
  }
`;

export const SectionHelp = styled.p`
  margin: 0;
  color: var(--lightGrey) !important;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 500;
  letter-spacing: 0.055em;
  line-height: 1.55;
  text-wrap: pretty;
`;

export const SectionError = styled.span`
  color: var(--red);
  font-size: 12px;
`;

export const VariationImageCell = styled.div`
  width: 94px;
  margin: 0 auto;

  > div {
    gap: 0;
  }

  > div > div:first-child {
    width: 88px;
    max-width: 88px;
    border-radius: 4px;
  }

  > div > span:last-child {
    display: none;
  }

  p {
    max-width: 68px;
    font-size: 7px;
    line-height: 1.05;
    overflow-wrap: anywhere;
  }

  svg {
    width: 22px;
    height: 22px;
  }

  @media (max-width: 768px) {
    width: 76px;

    > div > div:first-child {
      width: 72px;
      max-width: 72px;
    }
  }
`;
