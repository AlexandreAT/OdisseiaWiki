import styled from 'styled-components';

export const FeaturedButton = styled.button<{ $featured: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  padding: 0;
  background: transparent;
  color: ${({ $featured }) => $featured ? 'var(--clearneonYellow)' : 'var(--neonYellow)'};
  cursor: pointer;
  font: inherit;
  white-space: nowrap;
  flex: 0 0 auto;

  svg {
    font-size: 22px;
    flex: 0 0 auto;
    color: ${({ $featured }) => $featured ? 'var(--clearneonYellow)' : 'var(--neonYellow)'} !important;
    fill: currentColor !important;
    filter: ${({ $featured }) => $featured
      ? 'drop-shadow(0 0 4px var(--neonYellow))'
      : 'none'};
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
`;
