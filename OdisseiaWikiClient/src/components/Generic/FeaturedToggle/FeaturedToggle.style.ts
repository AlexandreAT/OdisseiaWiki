import styled from 'styled-components';

export const FeaturedButton = styled.button<{ $featured: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid ${({ $featured }) => $featured ? 'rgba(255, 219, 61, 0.5)' : 'transparent'};
  border-radius: 5px;
  padding: 5px 8px;
  background: ${({ $featured }) => $featured ? 'rgba(255, 219, 61, 0.08)' : 'transparent'};
  color: ${({ $featured }) => $featured ? 'var(--clearneonYellow)' : 'var(--neonYellow)'};
  cursor: pointer;
  font: inherit;
  white-space: nowrap;
  flex: 0 0 auto;
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover,
  &:focus-visible {
    border-color: var(--clearneonYellow);
    background: rgba(255, 219, 61, 0.12);
    color: var(--clearneonYellow);
    box-shadow: 0 0 7px rgba(255, 219, 61, 0.18);
    outline: none;
  }

  svg {
    font-size: 22px;
    flex: 0 0 auto;
    color: ${({ $featured }) => $featured ? 'var(--clearneonYellow)' : 'var(--neonYellow)'} !important;
    fill: currentColor !important;
    filter: ${({ $featured }) => $featured
      ? 'drop-shadow(0 0 4px var(--neonYellow))'
      : 'none'};
    transition: color 0.2s ease, filter 0.2s ease;
  }

  &:hover svg,
  &:focus-visible svg {
    color: var(--clearneonYellow) !important;
    filter: drop-shadow(0 0 4px rgba(255, 219, 61, 0.55));
  }
`;

export const FeaturedLabel = styled.span<{ $featured: boolean }>`
  font-size: 0.9em;
  font-weight: 500;
  white-space: nowrap;
  color: ${({ $featured }) => $featured ? 'var(--clearneonYellow)' : 'var(--lightGrey)'};
  text-shadow: ${({ $featured }) => $featured
    ? '0 0 5px var(--neonYellow)'
    : 'none'};
  transition: color 0.2s ease, text-shadow 0.2s ease;

  ${FeaturedButton}:hover &,
  ${FeaturedButton}:focus-visible & {
    color: var(--clearneonYellow);
    text-shadow: 0 0 5px rgba(255, 219, 61, 0.55);
  }
`;
