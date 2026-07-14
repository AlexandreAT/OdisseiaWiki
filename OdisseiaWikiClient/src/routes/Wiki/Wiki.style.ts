import styled from 'styled-components';

export const WikiPageContainer = styled.div<{
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}>`
  position: relative;
  min-height: 100vh;
  isolation: isolate;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;

  &::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background-image: var(--wiki-background-image);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    filter: blur(12px);
    transform: scale(1.08);
    opacity: 0.35;
  }
`;
