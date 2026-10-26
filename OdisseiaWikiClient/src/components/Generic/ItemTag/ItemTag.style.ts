import styled, { css, keyframes } from 'styled-components';
import type { ItemTagRarity } from '../../../utils/itemTagRarity';

const tagCometTop = keyframes`
  0% { left: -72%; opacity: 0; }
  8% { opacity: 1; }
  92% { opacity: 1; }
  100% { left: 100%; opacity: 0; }
`;
const tagCometBottom = keyframes`
  0% { right: -72%; opacity: 0; }
  8% { opacity: 1; }
  92% { opacity: 1; }
  100% { right: 100%; opacity: 0; }
`;

export const ItemTag = styled.span<{
  $primary?: boolean;
  $rarity?: ItemTagRarity;
  $neon?: boolean;
}>`
  --tag-accent: ${({ $rarity, $primary }) => $rarity === 'unique'
    ? 'var(--clearneonGreen)'
    : $rarity === 'legendary' ? '#ffd52d'
      : $primary ? 'var(--clearneonPurple)' : 'var(--clearneonBlue)'};
  --tag-tail: ${({ $rarity }) => $rarity === 'unique'
    ? 'rgba(42, 255, 163, 0.16)' : 'rgba(255, 213, 45, 0.16)'};
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border: 1px solid ${({ $rarity, $primary }) => $rarity === 'unique'
    ? 'rgba(42, 255, 163, 0.72)'
    : $rarity === 'legendary' ? 'rgba(255, 213, 45, 0.76)'
      : $primary ? 'rgba(204, 74, 255, 0.64)' : 'rgba(68, 205, 255, 0.52)'};
  border-radius: 2px;
  padding: 4px 9px;
  background: ${({ $rarity, $primary }) => $rarity === 'unique'
    ? 'rgba(3, 45, 32, 0.62)'
    : $rarity === 'legendary' ? 'rgba(55, 39, 3, 0.62)'
      : $primary ? 'rgba(48, 8, 62, 0.62)' : 'rgba(0, 19, 38, 0.62)'};
  color: var(--tag-accent) !important;
  font-size: 9px;
  letter-spacing: 0.65px;
  text-transform: uppercase;

  ${({ $rarity, $neon }) => $rarity && $neon && css`
    box-shadow: 0 0 8px color-mix(in srgb, var(--tag-accent) 28%, transparent);
    text-shadow: 0 0 6px color-mix(in srgb, var(--tag-accent) 58%, transparent);
    &::before, &::after {
      content: '';
      position: absolute;
      z-index: 2;
      width: 72%;
      height: 1px;
      pointer-events: none;
      filter: drop-shadow(0 0 3px var(--tag-accent));
    }
    &::before {
      top: -1px;
      left: -72%;
      background: linear-gradient(90deg, transparent, var(--tag-tail) 24%, var(--tag-accent) 100%);
      animation: ${tagCometTop} 1.75s linear infinite;
    }
    &::after {
      right: -72%;
      bottom: -1px;
      background: linear-gradient(270deg, transparent, var(--tag-tail) 24%, var(--tag-accent) 100%);
      animation: ${tagCometBottom} 1.75s linear infinite;
    }
  `}
  :root[data-motion='reduced'] & {
    &::before, &::after { animation: none; opacity: 0; }
  }
`;
