import styled from 'styled-components';

export const FeaturedButton = styled.button<{ $featured: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  padding: 0;
  background: transparent;
  color: ${({ $featured }) => $featured ? 'var(--neonYellow)' : 'var(--neonBlue)'};
  cursor: pointer;
  font: inherit;

  svg {
    font-size: 22px;
  }
`;

export const FeaturedLabel = styled.span`
  font-size: 0.9em;
  font-weight: 500;
`;
