import styled from 'styled-components';

interface WikiPageContainerProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const WikiPageContainer = styled.div<WikiPageContainerProps>`
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
`;
