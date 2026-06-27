import styled from 'styled-components';
import HorizontalRectangleLines from '../../../assets/svg/HorizontalRectangleLines.svg';
import HorizontalRectangleLinesFill from '../../../assets/svg/HorizontalRectangleLinesFill.svg';

export const HorizontalRectangleHudWrapper = styled.div`
  position: relative;
  width: 100%;
  height: auto;
  display: flex;
  flex-direction: column;
`;

export const HorizontalRectangleBackground = styled.div`
  position: absolute;
  inset: 6px;
  background: rgba(0, 0, 10, 0.65);
  -webkit-mask-image: url(${HorizontalRectangleLinesFill});
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: 100% 100%;
  -webkit-mask-position: center;
  mask-image: url(${HorizontalRectangleLinesFill});
  mask-repeat: no-repeat;
  mask-size: 100% 100%;
  mask-position: center;
  z-index: 1;
  pointer-events: none;
`;

export const HorizontalRectangleContent = styled.div`
  position: absolute;
  inset: 6px;
  display: flex;
  z-index: 2;
`;

export const HorizontalRectangleBorder = styled.div<{ $neon?: boolean }>`
  position: absolute;
  inset: 0;
  background: ${({ $neon }) => $neon ? 'var(--clearneonBlue)' : 'var(--neonBlue)'};
  -webkit-mask-image: url(${HorizontalRectangleLines});
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: 100% 100%;
  -webkit-mask-position: center;
  mask-image: url(${HorizontalRectangleLines});
  mask-repeat: no-repeat;
  mask-size: 100% 100%;
  mask-position: center;
  z-index: 3;
  pointer-events: none;
  filter: ${({ $neon }) => $neon
    ? 'drop-shadow(0 0 2px var(--clearneonBlue)) drop-shadow(0 0 4px var(--clearneonBlue)) drop-shadow(0 0 8px var(--clearneonBlue)) drop-shadow(0 0 16px var(--clearneonBlue))'
    : 'none'};
  transition: filter 0.3s ease, background 0.3s ease;
`;
