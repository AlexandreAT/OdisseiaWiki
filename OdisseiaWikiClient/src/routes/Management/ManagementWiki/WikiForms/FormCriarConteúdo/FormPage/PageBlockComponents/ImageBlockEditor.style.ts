import styled from 'styled-components';

interface ThemeProps {
  $isDark?: boolean;
}

export const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
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
`;

export const ImagePreview = styled.img`
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  border-radius: 6px;
`;

export const PreviewLabel = styled.p`
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: ${props => (props.color || '#666')};
`;
