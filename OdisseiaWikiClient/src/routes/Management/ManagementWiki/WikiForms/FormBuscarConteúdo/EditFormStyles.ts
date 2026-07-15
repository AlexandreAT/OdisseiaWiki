import styled from 'styled-components';

interface ThemeProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const EditHeader = styled.div<ThemeProps>`
  display: flex;
  width: 100%;
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
    font-family: 'Cyberpunk Is Not Dead', sans-serif;
    font-weight: 100;
    letter-spacing: 2px;
    overflow-wrap: anywhere;
  }

  @media (max-width: 768px) {
    min-height: 42px;
    align-items: center;
    flex-direction: row;
    padding: 4px 6px;
    gap: 6px;
    margin-bottom: 12px;

    h2 {
      flex: 1 1 auto;
      min-width: 0;
      max-width: 100%;
      font-size: clamp(10px, 3vw, 12px);
      line-height: 1.15;
      letter-spacing: 0.15px;
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
      text-align: left;
    }

    > div {
      flex: 0 0 74px;
      width: 74px !important;
      height: 36px !important;
    }

    > div > div,
    > div > button {
      width: 64px !important;
      height: 30px !important;
    }

    > div > button {
      padding-inline: 4px;
      font-size: 9px;
    }
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
