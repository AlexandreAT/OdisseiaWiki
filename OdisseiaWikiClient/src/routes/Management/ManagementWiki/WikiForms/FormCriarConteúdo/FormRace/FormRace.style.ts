import styled from "styled-components";

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
`;

export const FormHeader = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
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
  width: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 15px;

  @media (max-width: 768px) {
    width: 100%;
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
`;

export const StatusTitle = styled.h3<Props>`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: ${(props) =>
    props.neon === 'on'
      ? props.theme === 'light'
        ? 'var(--clearneonViolet)'
        : 'var(--clearneonBlue)'
      : props.theme === 'light'
        ? 'var(--black)'
        : 'var(--whitesmoke)'};
`;

export const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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
  width: 100%;
  padding: 10px 0;
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
`;

export const ErrorText = styled.span<Props>`
  font-size: 13px;
  color: var(--error);
  margin-top: -8px;
`;
