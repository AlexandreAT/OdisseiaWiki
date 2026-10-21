import styled from 'styled-components';

export const GameAdminPowerMedia = styled.div`
  width: min(100%, 180px);
  aspect-ratio: 1;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border: 1px solid rgba(0, 187, 255, .4);
    border-radius: 8px;
  }
`;

export const GameAdminPowerCopy = styled.div`
  display: grid;
  gap: 8px;
  p { margin: 0; color: var(--whitesmoke); white-space: pre-wrap; overflow-wrap: anywhere; }
  small { color: #b6c7d3; }
`;

export const GameAdminPowerDescription = styled.div`
  min-width: 0;
  > * { width: 100%; }
`;
