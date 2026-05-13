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

export const RelationContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const EntityDisplay = styled.div<ThemeProps>`
  padding: 12px;
  border-radius: 8px;
  background-color: ${props => (props.$isDark ? '#1a1a1a' : '#f5f5f5')};
  border-left: 4px solid #28a745;
`;

export const EntityContent = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

export const EntityImage = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 4px;
  object-fit: cover;
`;

export const EntityDetails = styled.div`
  flex: 1;
`;

export const EntityName = styled.p`
  margin: 0 0 4px 0;
  font-weight: bold;
`;

export const EntityType = styled.p`
  margin: 0;
  font-size: 12px;
  opacity: 0.7;
`;
