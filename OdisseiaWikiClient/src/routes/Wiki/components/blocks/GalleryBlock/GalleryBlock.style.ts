import styled from 'styled-components';

export const GalleryBlockContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  align-items: center;
`;

export const GalleryItem = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 100%;
  aspect-ratio: 1 / 1;
  padding: 0;
  border: 2px solid #333;
  border-radius: 8px;
  background-color: var(--blackTransp);
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    border-color: #00d4ff;
    box-shadow: 0 0 12px rgba(0, 212, 255, 0.2);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.98);
  }
`;

export const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 18px;
  width: 80%;
  max-width: 1100px;
  padding: 14px;
  border-radius: 8px;

  &:has(> ${GalleryItem}:hover) {
    background-color: #0006;
  }

  transition: background-color 0.3s ease;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
  }
`;

/* ── Carousel ── */

export const CarouselWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 1100px;
`;

export const CarouselViewport = styled.div`
  display: flex;
  gap: 18px;
  overflow: hidden;
  scroll-behavior: smooth;
  width: 100%;
  padding: 14px 4px;
  border-radius: 8px;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }

  &:has(> ${GalleryItem}:hover) {
    background-color: #0006;
  }

  transition: background-color 0.3s ease;

  > ${GalleryItem} {
    width: 200px;
    min-width: 200px;
    aspect-ratio: 1 / 1;

    @media (max-width: 768px) {
      width: 150px;
      min-width: 150px;
    }
  }

  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

export const CarouselArrow = styled.button<{ $direction: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${({ $direction }) => ($direction === 'left' ? 'left: -12px;' : 'right: -12px;')}
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background-color: var(--black-blue);
  color: #000;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
  opacity: 0.85;

  &:hover {
    opacity: 1;
    transform: translateY(-50%) scale(1.1);
  }

  &:active {
    transform: translateY(-50%) scale(0.95);
  }

  &:disabled {
    opacity: 0.25;
    cursor: default;
    transform: translateY(-50%) scale(1);
  }
`;

export const GalleryItemImage = styled.img`
  width: 100%;
  object-fit: contain;
`;

export const GalleryItemPlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0a3a3a 0%, #1a1a1a 100%);
  color: rgba(255, 255, 255, 0.3);
  font-size: 32px;
`;

export const GalleryCaption = styled.p`
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
  text-align: center;
`;

export const ErrorMessage = styled.div`
  padding: 12px;
  background-color: rgba(220, 53, 69, 0.1);
  border-left: 4px solid #dc3545;
  border-radius: 4px;
  color: #dc3545;
  font-size: 12px;

  p {
    margin: 0;
  }
`;