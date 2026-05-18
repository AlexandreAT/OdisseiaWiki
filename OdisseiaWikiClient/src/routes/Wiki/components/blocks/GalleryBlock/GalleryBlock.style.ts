import styled from 'styled-components';

export const GalleryBlockContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

export const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
  }
`;

export const GalleryItem = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1 / 1;
  padding: 0;
  border: 2px solid #333;
  border-radius: 8px;
  background-color: #000;
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

export const GalleryItemImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
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

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
`;

export const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 90vw;
  max-height: 90vh;
  background-color: #1a1a1a;
  border: 2px solid #333;
  border-radius: 8px;
  padding: 12px;
`;

export const ModalImage = styled.img`
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 4px;
`;

export const ModalCaption = styled.p`
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
`;

export const ModalCloseButton = styled.button`
  align-self: flex-end;
  padding: 8px 12px;
  background-color: transparent;
  border: 1px solid #dc3545;
  border-radius: 4px;
  color: #dc3545;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(220, 53, 69, 0.1);
  }
`;

export const ModalNavigation = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 8px;
`;

export const ModalNavButton = styled.button<{ disabled?: boolean }>`
  padding: 8px 12px;
  background-color: transparent;
  border: 1px solid ${props => (props.disabled ? '#666' : '#00d4ff')};
  border-radius: 4px;
  color: ${props => (props.disabled ? '#666' : '#00d4ff')};
  font-size: 12px;
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;
  opacity: ${props => (props.disabled ? 0.5 : 1)};

  &:not(:disabled):hover {
    background-color: rgba(0, 212, 255, 0.1);
  }
`;
