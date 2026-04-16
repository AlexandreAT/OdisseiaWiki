import styled from 'styled-components';

interface Props {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

interface ImageItemProps extends Props {
  isCircle: boolean;
  shape?: string;
}

interface ShapeButtonProps extends Props {
  isSelected: boolean;
  isHovered: boolean;
}

export const GalleryContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

export const GalleryLabel = styled.label<Props>`
  font-size: 0.9em;
  font-weight: 500;
  color: ${({ neon }) => (neon === 'on' ? 'var(--neonBlue)' : 'var(--lightGrey)')};
  ${({ neon }) =>
    neon === 'on' && `text-shadow: 0.5px 0.5px 1px var(--clearneonBlue);`}
`;

export const ImagesGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  width: 100%;
  align-items: flex-start;
`;

export const ImageItem = styled.div<ImageItemProps>`
  position: relative;
  height: 150px;
  border-radius: ${({ isCircle, shape }) => {
    if (isCircle) return '50%';
    if (shape === 'rectangle') return '0';
    return '8px';
  }};
  overflow: hidden;
  background: transparent;
  border: none;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover {
    border-color: transparent;
    box-shadow: 0 0 10px rgba(0, 200, 255, 0.3);
  }

  img {
    height: 100%;
    width: auto;
    object-fit: contain;
    object-position: center;
  }
`;

export const RectangleImageItem = styled(ImageItem)`
  width: 267px;
`;

export const AddButton = styled.button`
  width: 150px;
  height: 150px;
  border-radius: 8px;
  background: var(--lightBlack);
  border: 2px dashed var(--lightGrey);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--lightGrey);
  font-size: 14px;
  padding: 0;
  flex-shrink: 0;

  svg {
    width: 32px;
    height: 32px;
    opacity: 0.6;
  }

  &:hover {
    border-color: var(--mediumgrey);
    color: var(--mediumgrey);

    svg {
      opacity: 1;
    }
  }

  &:active {
    transform: scale(0.98);
  }
`;

export const ShapeSelectorOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

export const ShapeSelectorModal = styled.div<Props>`
  background: ${({ theme }) =>
    theme === 'dark' ? 'var(--clearblack)' : 'var(--clearWhite)'};
  border: 2px solid ${({ neon }) =>
    neon === 'on' ? 'var(--clearneonBlue)' : 'var(--lightGrey)'};
  border-radius: 12px;
  padding: 30px;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  gap: 15px;
  min-width: 300px;
`;

export const ShapeSelectorTitle = styled.h3<Props>`
  margin: 0;
  font-family: "'DO Futuristic', sans-serif";
  font-size: 1.1rem;
  color: ${({ neon }) =>
    neon === 'on' ? 'var(--neonBlue)' : 'var(--mediumgrey)'};
  letter-spacing: 1px;
`;

export const ShapeButton = styled.button<ShapeButtonProps>`
  padding: 12px 16px;
  border-radius: 6px;
  border: ${({ isSelected }) =>
    isSelected ? '2px solid var(--neonBlue)' : '1px solid var(--lightGrey)'};
  background: ${({ isSelected, isHovered }) => {
    if (isSelected) return 'var(--blackTransp)';
    if (isHovered) return 'rgba(0, 200, 255, 0.1)';
    return 'transparent';
  }};
  color: ${({ isSelected, isHovered, theme }) => {
    if (isSelected || isHovered) return 'var(--neonBlue)';
    return theme === 'dark' ? 'var(--lightGrey)' : 'var(--deepgrey)';
  }};
  cursor: pointer;
  font-size: 0.95em;
  transition: all 0.2s ease;
  font-weight: 600;
  box-shadow: ${({ isHovered }) =>
    isHovered ? '0 0 8px rgba(0, 200, 255, 0.3)' : 'none'};

  &:active {
    transform: scale(0.98);
  }
`;

export const ErrorMessage = styled.div`
  color: var(--neonPink);
  font-size: 0.85em;
  margin-top: 8px;
`;

export const HiddenInput = styled.input`
  display: none;
`;
