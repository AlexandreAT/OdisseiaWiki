import styled from 'styled-components';

interface ThemeProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const EditHeader = styled.div<ThemeProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: ${props => props.theme === 'dark' ? '#1a1a1a' : '#f5f5f5'};
  border: 1px solid ${props => props.neon === 'on' ? '#00ff00' : '#333'};
  border-radius: 8px;
  margin-bottom: 20px;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  gap: 12px;

  h2 {
    margin: 0;
    color: ${props => props.theme === 'dark' ? '#fff' : '#000'};
    font-size: 20px;
    overflow-wrap: anywhere;
  }

  @media (max-width: 768px) {
    align-items: stretch;
    flex-direction: column;
    padding: 14px;
  }
`;

export const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  font-size: 18px;
`;

export const ActionButtonsContainer = styled.div<ThemeProps>`
  display: flex;
  gap: 10px;
  margin-top: 20px;
  padding: 20px;
  background: ${props => props.theme === 'dark' ? '#1a1a1a' : '#f5f5f5'};
  border: 1px solid ${props => props.neon === 'on' ? '#00ff00' : '#333'};
  border-radius: 8px;
  border-top: none;
  justify-content: flex-end;
  flex-wrap: wrap;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 14px;

    > * {
      flex: 1 1 160px;
      max-width: 100%;
    }
  }
`;
