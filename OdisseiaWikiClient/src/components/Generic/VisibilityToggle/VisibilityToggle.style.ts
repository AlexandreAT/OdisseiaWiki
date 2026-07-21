import styled from 'styled-components';

export const VisibilityButton = styled.button<{ $visible: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  padding: 5px 8px;
  border: 1px solid ${({ $visible }) => $visible ? 'rgba(0, 217, 255, 0.5)' : 'transparent'};
  border-radius: 5px;
  background: ${({ $visible }) => $visible ? 'rgba(0, 217, 255, 0.08)' : 'transparent'};
  color: ${({ $visible }) => $visible ? 'var(--clearneonBlue)' : 'var(--lightGrey)'};
  cursor: pointer;
  font: inherit;
  white-space: nowrap;
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover,
  &:focus-visible {
    border-color: var(--clearneonBlue);
    background: rgba(0, 217, 255, 0.12);
    color: var(--clearneonBlue);
    box-shadow: 0 0 7px rgba(0, 217, 255, 0.18);
    outline: none;
  }

  svg {
    flex: 0 0 auto;
    font-size: 22px;
    color: currentColor !important;
    fill: currentColor !important;
    filter: ${({ $visible }) => $visible ? 'drop-shadow(0 0 4px var(--neonBlue))' : 'none'};
    transition: color 0.2s ease, filter 0.2s ease;
  }

  &:hover svg,
  &:focus-visible svg {
    filter: drop-shadow(0 0 4px rgba(0, 217, 255, 0.55));
  }
`;

export const VisibilityLabel = styled.span<{ $visible: boolean }>`
  font-size: 0.9em;
  font-weight: 500;
  white-space: nowrap;
  color: ${({ $visible }) => $visible ? 'var(--clearneonBlue)' : 'var(--lightGrey)'};
  text-shadow: ${({ $visible }) => $visible ? '0 0 5px var(--neonBlue)' : 'none'};
  transition: color 0.2s ease, text-shadow 0.2s ease;

  ${VisibilityButton}:hover &,
  ${VisibilityButton}:focus-visible & {
    color: var(--clearneonBlue);
    text-shadow: 0 0 5px rgba(0, 217, 255, 0.55);
  }
`;
