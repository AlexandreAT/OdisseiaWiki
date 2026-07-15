import styled from 'styled-components';

interface ThemeProps {
  $isDark?: boolean;
}

export const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  max-width: 100%;
`;

export const SectionLabel = styled.label`
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 8px;
  display: block;
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

export const PositionSelector = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const PositionButton = styled.button<{ $isActive: boolean }>`
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

export const RichTextSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
`;

export const PreviewContainer = styled.div<ThemeProps>`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  background-color: ${props => (props.$isDark ? '#1a1a1a' : '#f5f5f5')};
  border: 1px solid ${props => (props.$isDark ? '#333' : '#ddd')};
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    width: min(36vw, 130px);
    max-width: 130px;
    height: auto;
    max-height: 150px;
    align-self: center;
    padding: 8px;
    gap: 6px;
    overflow: hidden;
  }
`;

export const ImagePreview = styled.img`
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  border-radius: 6px;

  @media (max-width: 768px) {
    width: 100%;
    max-width: 100%;
    height: auto;
    max-height: 118px;
    align-self: center;
    object-fit: cover;
  }
`;

export const PreviewLabel = styled.p`
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: ${props => (props.color || '#666')};
`;
