import styled from 'styled-components';
import { FallbackImage } from '../../../../../components/Generic/FallbackImage/FallbackImage';

export const RelationBlockContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  align-items: center;
  margin-top: 15px;
  min-width: 0;
  max-width: 100%;
`;

export const RelationTypeGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 75%;
  min-width: 0;
  max-width: 100%;

  @media (max-width: 1100px) {
    width: 88%;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

export const RelationTypeGroupHeader = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

export const RelationBlockHeader = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 12px;
  border-bottom: 2px solid #333;

  h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #00d4ff;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

export const RelationItemsGrid = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
  width: 100%;
  overflow-x: auto;
  padding: 3px;
  -webkit-overflow-scrolling: touch;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;

  /* Make children not wrap so it behaves like a horizontal carousel */
  white-space: nowrap;
  & > * {
    white-space: normal;
    flex: 0 0 auto;
  }
`;

/* Carousel variants (used when there are many items) */
export const CarouselWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
`;

export const CarouselViewport = styled.div`
  display: flex;
  gap: 12px;
  overflow: hidden;
  scroll-behavior: smooth;
  width: 100%;
  padding: 8px 4px;
  border-radius: 8px;
  cursor: grab;
  min-width: 0;
  max-width: 100%;

  &:active {
    cursor: grabbing;
  }

  > button {
    min-width: 200px;
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
  ${({ $direction }) => ($direction === 'left' ? 'left: -8px;' : 'right: -8px;')}
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
  font-size: 18px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
  opacity: 0.85;

  &:hover {
    opacity: 1;
    transform: translateY(-50%) scale(1.05);
  }

  &:disabled {
    opacity: 0.25;
    cursor: default;
    transform: translateY(-50%) scale(1);
  }
`;

export const RelationCard = styled.button`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 8px;
  min-width: 160px;
  max-width: 320px;
  flex: 0 0 auto;
  border: 2px solid #333;
  border-radius: 8px;
  background-color: #0a0a0a;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.22s ease;
  text-align: left;
  box-sizing: border-box;

  @media (max-width: 480px) {
    min-width: min(160px, calc(100vw - 40px));
    max-width: calc(100vw - 40px);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.8;
  }

  @media (hover: hover) {
    &:hover:not(:disabled) {
      border-color: rgba(0, 212, 255, 0.6);
      background-color: rgba(0, 212, 255, 0.03);
      transform: scale(1.02);
    }
  }
`;

export const RelationCardImage = styled(FallbackImage)<{ $entityType?: string }>`
  height: 80px;
  width: auto;
  background-color: #000;
  flex-shrink: 0;
  /* Shapes by entity type */
  border-radius: ${props => (props.$entityType === 'Personagem' ? '50%' : '6px')};
  aspect-ratio: ${props => (props.$entityType === 'Raca' || props.$entityType === 'Item' || props.$entityType === 'Personagem' ? '1 / 1' : '16 / 9')};
`;

export const RelationCardPlaceholder = styled.div<{ $entityType?: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  width: auto;
  min-width: 80px;
  background: linear-gradient(135deg, #0a3a3a 0%, #1a1a1a 100%);
  color: rgba(0, 212, 255, 0.4);
  font-size: 28px;
  flex-shrink: 0;
  border-radius: ${props => (props.$entityType === 'Personagem' ? '50%' : '6px')};
  aspect-ratio: ${props => (props.$entityType === 'Raca' || props.$entityType === 'Item' || props.$entityType === 'Personagem' ? '1 / 1' : '16 / 9')};
`;

export const RelationCardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0;
  flex: 1 1 auto;
  min-width: 0; /* allow truncation inside flex */
`;

export const RelationCardTitle = styled.h5`
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  overflow-wrap: anywhere;
`;

export const RelationCardType = styled.span`
  font-size: 11px;
  color: #00d4ff;
  font-weight: 500;
  text-transform: uppercase;
  opacity: 0.8;
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

export const TypeIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(0, 212, 255, 0.1);
  color: #00d4ff;
  font-size: 14px;
`;

export const TypeLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #00d4ff;
  text-transform: capitalize;
`;
