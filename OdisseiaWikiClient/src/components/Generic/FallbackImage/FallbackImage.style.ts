import styled from 'styled-components';

export const ImageFrame = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  overflow: hidden;
  box-sizing: border-box;
  background: linear-gradient(135deg, rgba(0, 22, 36, 0.95), rgba(12, 12, 20, 0.95));
  color: var(--clearneonBlue);

  > img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
  }

  > svg {
    width: 42%;
    height: 42%;
    min-width: 24px;
    min-height: 24px;
    opacity: 0.55;
    filter: drop-shadow(0 0 5px currentColor);
  }
`;
