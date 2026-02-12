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

export const MainImageContainer = styled.div<{ hasImage: boolean }>`
  width: 100%;
  height: 300px;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--lightBlack);
  border: 2px dashed ${({ hasImage }) => 
    hasImage ? 'transparent' : 'var(--lightGrey)'};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--neonBlue);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }
`;

export const ImagePlaceholder = styled.div<Props>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: ${({ theme }) => 
    theme === 'dark' ? 'var(--lightGrey)' : 'var(--deepgrey)'};

  svg {
    width: 48px;
    height: 48px;
    opacity: 0.5;
  }

  p {
    font-size: 14px;
    text-align: center;
    margin: 0;
  }
`;

export const GallerySection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

export const SectionTitle = styled.h3<Props>`
  font-family: 'DO Futuristic', sans-serif;
  font-weight: 100;
  letter-spacing: 3px;
  font-size: 1rem;
  color: ${({ theme }) =>
    theme === 'dark' ? 'var(--clearWhite)' : 'var(--deepgrey)'};
  margin: 0;
`;

export const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  width: 100%;
`;

export const GalleryImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--lightBlack);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }
`;

export const RemoveImageButton = styled.button<Props>`
  position: absolute;
  top: 5px;
  right: 5px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: ${({ theme }) => 
    theme === 'dark' ? 'var(--clearblack)' : 'var(--clearWhite)'};
  color: var(--red);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  opacity: 0.8;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
`;

export const AddGalleryImageButton = styled.button<Props>`
  width: 100%;
  height: 120px;
  border-radius: 8px;
  border: 2px dashed ${({ theme, neon }) =>
    theme === 'dark'
      ? neon === 'on'
        ? 'var(--clearneonBlue)'
        : 'var(--lightGrey)'
      : neon === 'on'
        ? 'var(--neonViolet)'
        : 'var(--deepgrey)'};
  background: transparent;
  color: ${({ theme }) =>
    theme === 'dark' ? 'var(--lightGrey)' : 'var(--deepgrey)'};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  font-size: 14px;

  &:hover {
    border-color: ${({ theme, neon }) =>
      theme === 'dark'
        ? neon === 'on'
          ? 'var(--neonBlue)'
          : 'var(--clearWhite)'
        : neon === 'on'
          ? 'var(--deepneonViolet)'
          : 'var(--black)'};
    color: ${({ theme }) =>
      theme === 'dark' ? 'var(--clearWhite)' : 'var(--black)'};
  }

  svg {
    width: 32px;
    height: 32px;
  }
`;

export const DescriptionSection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

export const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 20px;
  width: 100%;
  margin-top: 20px;
`;

export const HiddenInput = styled.input`
  display: none;
`;

export const ErrorText = styled.span`
  color: var(--red);
  font-size: 12px;
  margin-top: -10px;
`;

export const TagsSection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

export const CheckboxSection = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const PontosInteresseSection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

export const PontosInteresseInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
`;

export const InfoLoresList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--mediumgrey);
  border-radius: 8px;
  background: var(--lightBlack);
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--lightBlack);
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--mediumgrey);
    border-radius: 4px;
  }
`;

export const InfoLoreItem = styled.button<Props>`
  width: 100%;
  padding: 12px 16px;
  text-align: left;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme === 'dark' ? 'var(--clearWhite)' : 'var(--deepgrey)'};
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid var(--mediumgrey);
  font-size: 14px;

  &:hover:not(:disabled) {
    background: ${({ theme, neon }) =>
      theme === 'dark'
        ? neon === 'on'
          ? 'rgba(0, 200, 255, 0.1)'
          : 'var(--mediumgrey)'
        : neon === 'on'
          ? 'rgba(138, 43, 226, 0.1)'
          : 'var(--whitesmoke)'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:last-child {
    border-bottom: none;
  }
`;
