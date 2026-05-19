import styled from 'styled-components';

interface ThemeProps {
  $isDark?: boolean;
}

export const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const AspectRatioSelector = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const AspectButton = styled.button<{ $isActive: boolean }>`
  flex: 1;
  padding: 8px 12px;
  border: 2px solid ${props => (props.$isActive ? '#00d4ff' : '#333')};
  border-radius: 4px;
  background-color: ${props => (props.$isActive ? 'rgba(0, 212, 255, 0.1)' : 'transparent')};
  color: ${props => (props.$isActive ? '#00d4ff' : '#fff')};
  cursor: pointer;
  font-weight: 500;
  font-size: 12px;
  transition: all 0.2s ease;

  &:hover {
    border-color: #00d4ff;
    color: #00d4ff;
  }

  &:active {
    transform: scale(0.98);
  }
`;

export const GalleryContainer = styled.div<ThemeProps>`
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  background-color: ${props => (props.$isDark ? '#1a1a1a' : '#f5f5f5')};
  border: 1px solid ${props => (props.$isDark ? '#333' : '#ddd')};
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  width: 100%;
`;

export const ImageItem = styled.div<ThemeProps>`
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background-color: ${props => (props.$isDark ? '#2a2a2a' : '#e0e0e0')};
  border: 1px solid ${props => (props.$isDark ? '#444' : '#ccc')};
  display: flex;
  flex-direction: column;
`;

export const ImageThumb = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  flex: 1;
`;

export const DeleteButton = styled.button`
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background-color: #ff4444;
  color: white;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #cc0000;
  }
`;

export const GalleryLabel = styled.label`
  font-size: 12px;
  font-weight: bold;
  opacity: 0.7;
  display: block;
  margin-bottom: 8px;
`;
