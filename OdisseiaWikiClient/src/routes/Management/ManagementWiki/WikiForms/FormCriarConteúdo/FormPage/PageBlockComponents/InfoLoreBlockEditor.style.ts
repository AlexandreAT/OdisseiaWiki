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

export const InfoContainer = styled.div<ThemeProps>`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background-color: ${props => (props.$isDark ? '#1a1a1a' : '#f5f5f5')};
`;

export const InfoDisplay = styled.div<ThemeProps>`
  padding: 12px;
  border-radius: 8px;
  background-color: ${props => (props.$isDark ? '#2a2a2a' : '#e8f4f8')};
  border-left: 4px solid #007bff;
`;

export const InfoContent = styled.div`
  display: flex;
  gap: 12px;
`;

export const InfoImage = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 4px;
  object-fit: cover;
`;

export const InfoDetails = styled.div`
  flex: 1;
`;

export const InfoTitle = styled.p`
  margin: 0 0 4px 0;
  font-weight: bold;
`;

export const InfoId = styled.p`
  margin: 0;
  font-size: 12px;
  opacity: 0.7;
`;
