import styled from 'styled-components';

export const GalleryBlockContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  align-items: center;
  min-width: 0;
  max-width: 100%;
`;

export const GalleryItem = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  flex: 0 0 auto;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  align-self: start;
  box-sizing: border-box;
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
  min-width: 0;
  box-sizing: border-box;

  @media (max-width: 1100px) {
    width: 90%;
  }

  &:has(> ${GalleryItem}:hover) {
    background-color: #0006;
  }

  transition: background-color 0.3s ease;

  @media (max-width: 768px) {
    width: 100%;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  @media (max-width: 480px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

/* ── Carousel ── */

export const CarouselWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 1100px;
  min-width: 0;
`;

export const CarouselViewport = styled.div`
  display: flex;
  gap: 18px;
  overflow: hidden;
  scroll-behavior: smooth;
  width: 100%;
  padding: 14px 48px;
  border-radius: 8px;
  cursor: grab;
  touch-action: pan-y;
  user-select: none;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;

  &:active {
    cursor: grabbing;
  }

  scroll-behavior: auto;

  > ${GalleryItem} {
    width: 200px;
    min-width: 200px;

    @media (max-width: 768px) {
      width: 150px;
      min-width: 150px;
    }
  }

  @media (max-width: 768px) {
    padding-inline: 40px;
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
  z-index: 1;
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
  display: block;
  width: 100%;
  max-width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: contain;
  pointer-events: none;
`;

export const GalleryItemPlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: linear-gradient(135deg, #0a3a3a 0%, #1a1a1a 100%);
  color: rgba(255, 255, 255, 0.3);
  font-size: 32px;
  pointer-events: none;
`;

export const GalleryCaption = styled.p`
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  margin: 0;
  padding: 6px 8px 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
  text-align: center;
  white-space: normal;
  overflow-wrap: anywhere;
  pointer-events: none;
  align-self: stretch;
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
