import styled from 'styled-components';

interface Props {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

const getNeon = (neon: 'on' | 'off') => neon === 'on' ? 'var(--neonBlue)' : 'var(--lightGrey)';
const getClearNeon = (neon: 'on' | 'off') => neon === 'on' ? 'var(--clearneonBlue)' : 'transparent';

export const GalleryController = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

export const GalleryLabel = styled.label<Props>`
  font-size: 0.9em;
  font-weight: 500;
  color: ${({ neon }) => getNeon(neon)};
  ${({ neon }) => neon === 'on' && `text-shadow: 0.5px 0.5px 1px ${getClearNeon(neon)};`}
`;

export const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
`;

export const GalleryImageContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: var(--lightBlack);
  border: 1px solid var(--mediumgrey);
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--neonBlue);
    box-shadow: 0 0 10px rgba(0, 200, 255, 0.3);
  }

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
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid ${({ neon }) => neon === 'on' ? 'var(--neonPink)' : 'var(--lightGrey)'};
  color: ${({ neon }) => neon === 'on' ? 'var(--neonPink)' : 'var(--lightGrey)'};
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 10;

  ${GalleryImageContainer}:hover & {
    opacity: 1;
  }

  &:hover {
    background: ${({ neon }) => neon === 'on' ? 'var(--neonPink)' : 'var(--lightGrey)'};
    color: var(--lightBlack);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }

  .icon {
    width: 100%;
    height: 100%;
  }
`;

export const AddGalleryImageButton = styled.button<Props>`
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  background: var(--lightBlack);
  border: 2px dashed var(--lightGrey);
  color: ${({ theme }) => theme === 'dark' ? 'var(--lightGrey)' : 'var(--deepgrey)'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;

  svg {
    width: 32px;
    height: 32px;
    opacity: 0.6;
  }

  &:hover {
    border-color: ${({ neon }) => neon === 'on' ? 'var(--neonBlue)' : 'var(--mediumgrey)'};
    color: ${({ neon }) => neon === 'on' ? 'var(--neonBlue)' : 'var(--mediumgrey)'};
    ${({ neon }) => neon === 'on' && `
      box-shadow: 0 0 10px ${getClearNeon(neon)};
    `}

    svg {
      opacity: 1;
    }
  }

  &:active {
    transform: scale(0.98);
  }
`;

export const HiddenInput = styled.input`
  display: none;
`;
