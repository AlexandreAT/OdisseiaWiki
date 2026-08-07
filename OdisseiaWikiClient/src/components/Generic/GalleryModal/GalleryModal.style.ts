import styled from 'styled-components';
import { FallbackImage } from '../FallbackImage/FallbackImage';
import { ImageDisplayShape } from '../../../utils/imageDisplayShape';

export const GalleryTitle = styled.span`
  color: var(--black) !important;
  font-family: 'Cyberpunk Is Not Dead', sans-serif;
  font-size: 18px;
  font-weight: 100;
  letter-spacing: 3px;
  text-shadow:
    -1px -1px 0 var(--neonBlue),
    -1px 1px 0 var(--neonBlue),
    1px -1px 0 var(--neonBlue),
    1px 1px 0 var(--neonBlue);

  @media (max-width: 600px) {
    font-size: clamp(13px, 4.2vw, 17px);
    letter-spacing: 1.5px;
  }
`;

export const GalleryViewport = styled.div`
  width: 100%;
  min-height: 0;
  box-sizing: border-box;
`;

export const GalleryTrack = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: center;
  gap: 12px;
  width: 100%;
  min-width: 0;

  @media (max-width: 600px) {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    align-items: start;
    gap: 6px;
  }
`;

export const GalleryButton = styled.button<{ $shape: ImageDisplayShape }>`
  width: auto;
  height: 150px;
  flex: 0 0 auto;
  aspect-ratio: ${({ $shape }) => $shape === 'rectangle' ? '16 / 9' : '1'};
  overflow: hidden;
  border: 1px solid rgba(60, 203, 255, 0.42);
  border-radius: ${({ $shape }) => $shape === 'circle' ? '50%' : '4px'};
  padding: 0;
  background: rgba(2, 10, 21, 0.9);
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: var(--clearneonBlue);
    box-shadow: 0 0 12px rgba(0, 204, 255, 0.32);
    outline: none;
  }

  @media (max-width: 600px) {
    grid-column: span ${({ $shape }) => $shape === 'rectangle' ? 4 : 2};
    width: 100%;
    height: auto;
    aspect-ratio: ${({ $shape }) => $shape === 'rectangle' ? '16 / 9' : '1'};
  }
`;

export const GalleryImage = styled(FallbackImage)`
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: var(--clearneonBlue);

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;
