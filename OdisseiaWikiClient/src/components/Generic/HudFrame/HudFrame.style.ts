import styled, { css, keyframes } from 'styled-components';
import HudCorner from '../../../assets/svg/HudCorner.svg';

const drawHorizontal = keyframes`
  from { transform: scaleX(0); opacity: 0; }
  to { transform: scaleX(1); opacity: 1; }
`;

const drawVertical = keyframes`
  from { transform: scaleY(0); opacity: 0; }
  to { transform: scaleY(1); opacity: 1; }
`;

const revealCorner = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const Frame = styled.section<{ $neon: boolean; $color: string }>`
  position: relative;
  isolation: isolate;
  min-width: 0;
  border: ${({ $neon, $color }) => $neon
    ? '2px solid transparent'
    : `1px solid color-mix(in srgb, ${$color} 58%, transparent)`};
  background: linear-gradient(145deg, rgba(2, 16, 31, 0.94), rgba(1, 7, 17, 0.92));
  box-shadow: ${({ $neon, $color }) => $neon
    ? `inset 0 0 24px color-mix(in srgb, ${$color} 12%, transparent), 0 0 9px color-mix(in srgb, ${$color} 30%, transparent)`
    : 'inset 0 0 28px rgba(0, 178, 255, 0.035)'};
  clip-path: ${({ $neon }) => $neon
    ? 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)'
    : 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'};
`;

export const Corner = styled.span<{
  $position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  $neon: boolean;
  $color: string;
}>`
  position: absolute;
  z-index: 3;
  width: 50px;
  height: 50px;
  pointer-events: none;
  background: ${({ $color }) => $color};
  opacity: ${({ $neon, $position }) => ($neon || $position === 'top-right' || $position === 'bottom-left' ? 1 : 0)};
  filter: ${({ $neon, $color }) => $neon ? `drop-shadow(0 0 6px ${$color})` : 'none'};
  -webkit-mask: url("${HudCorner}") center / contain no-repeat;
  mask: url("${HudCorner}") center / contain no-repeat;

  ${({ $position, $neon }) => {
    const newlyVisible = $position === 'top-left' || $position === 'bottom-right';
    const reveal = $neon && newlyVisible
      ? css`animation: ${revealCorner} 140ms ease-out 430ms both;`
      : '';

    if ($position === 'top-left') return css`top: 1px; left: 1px; transform: scaleY(-1); ${reveal}`;
    if ($position === 'top-right') return css`top: 1px; right: 1px; transform: scale(-1);`;
    if ($position === 'bottom-right') return css`right: 1px; bottom: 1px; transform: scaleX(-1); ${reveal}`;
    return css`bottom: 1px; left: 1px;`;
  }}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const AnimatedLine = styled.span<{
  $position: 'top' | 'right' | 'bottom' | 'left';
  $neon: boolean;
  $color: string;
}>`
  position: absolute;
  z-index: 2;
  pointer-events: none;
  background: ${({ $color }) => $color};
  box-shadow: ${({ $neon, $color }) => $neon ? `0 0 6px ${$color}` : 'none'};
  opacity: ${({ $neon }) => ($neon ? 1 : 0)};

  ${({ $position, $neon }) => {
    if ($position === 'top') return css`
      top: 1px; left: 48px; right: 48px; height: 2px;
      transform-origin: left;
      animation: ${$neon ? drawHorizontal : 'none'} 500ms ease-out both;
    `;
    if ($position === 'bottom') return css`
      bottom: 1px; left: 48px; right: 48px; height: 2px;
      transform-origin: right;
      animation: ${$neon ? drawHorizontal : 'none'} 500ms ease-out both;
    `;
    if ($position === 'left') return css`
      left: 1px; top: 48px; bottom: 48px; width: 2px;
      transform-origin: top;
      animation: ${$neon ? drawVertical : 'none'} 500ms ease-out 250ms both;
    `;
    return css`
      right: 1px; top: 48px; bottom: 48px; width: 2px;
      transform-origin: bottom;
      animation: ${$neon ? drawVertical : 'none'} 500ms ease-out 250ms both;
    `;
  }}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transform: none;
  }
`;
