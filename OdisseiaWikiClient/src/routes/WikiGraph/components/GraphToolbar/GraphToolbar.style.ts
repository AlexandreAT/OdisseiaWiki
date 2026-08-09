import styled from 'styled-components';

export const ToolbarWrapper = styled.section<{ $neon: boolean }>`
  position: relative;
  z-index: 18;
  display: grid;
  grid-template-columns: auto minmax(260px, 1fr) auto;
  gap: 14px;
  align-items: center;
  width: min(1700px, calc(100% - 36px));
  margin: 0 auto;
  padding: 12px 14px;
  box-sizing: border-box;
  border: 1px solid rgba(71, 219, 255, 0.54);
  border-radius: 4px;
  background: rgba(0, 8, 18, 0.9);
  box-shadow: ${({ $neon }) => $neon
    ? 'inset 0 0 18px rgba(0, 212, 255, 0.08), 0 0 9px rgba(0, 212, 255, 0.2)'
    : 'inset 0 0 18px rgba(0, 212, 255, 0.025)'};
  backdrop-filter: blur(11px);
  -webkit-backdrop-filter: blur(11px);

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 54px;
    height: 2px;
    background: var(--clearneonBlue);
    box-shadow: ${({ $neon }) => $neon ? '0 0 7px var(--clearneonBlue)' : 'none'};
  }

  &::before { top: -1px; left: 14px; }
  &::after { right: 14px; bottom: -1px; }

  @media (max-width: 1100px) {
    grid-template-columns: minmax(0, 1fr) auto;
    width: min(100% - 24px, 1700px);
  }

  @media (max-width: 768px) {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
    width: calc(100% - 16px);
    padding: 9px;
  }
`;

export const FocusFilters = styled.div`
  display: flex;
  gap: 8px;
  min-width: 0;

  @media (max-width: 1100px) {
    grid-column: 1 / -1;
    overflow-x: auto;
    padding-bottom: 3px;
    scrollbar-width: thin;
    touch-action: pan-x;
  }
`;

export const FocusButton = styled.button<{ $active: boolean; $color: string; $neon: boolean }>`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 8px 14px;
  border: 1px solid ${({ $active, $color }) => $active ? $color : 'rgba(255, 255, 255, 0.19)'};
  border-radius: 3px;
  background: ${({ $active, $color }) => $active
    ? `color-mix(in srgb, ${$color} 12%, rgba(0, 8, 18, 0.96))`
    : 'rgba(0, 5, 13, 0.68)'};
  color: ${({ $active, $color }) => $active ? $color : 'rgba(245, 245, 245, 0.82)'};
  font-family: 'Orbitron', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  text-shadow: ${({ $active, $neon, $color }) => $active && $neon ? `0 0 6px ${$color}` : 'none'};
  transition: border-color 160ms ease, color 160ms ease, background 160ms ease;

  svg {
    color: ${({ $color }) => $color} !important;
    fill: ${({ $color }) => $color} !important;
    font-size: 18px;
    filter: ${({ $neon, $color }) => $neon ? `drop-shadow(0 0 4px ${$color})` : 'none'};
  }

  &:hover,
  &:focus-visible {
    outline: none;
    border-color: ${({ $color }) => $color};
    color: ${({ $color }) => $color};
  }

  @media (max-width: 768px) {
    min-height: 36px;
    padding: 6px 10px;
    font-size: 9px;
    svg { font-size: 15px; }
  }
`;

export const SearchArea = styled.div`
  position: relative;
  min-width: 0;
`;

export const SearchBox = styled.div`
  display: flex;
  align-items: center;
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  background: rgba(0, 4, 12, 0.82);
  color: rgba(245, 245, 245, 0.62);

  &:focus-within {
    border-color: var(--clearneonBlue);
    box-shadow: 0 0 6px rgba(0, 212, 255, 0.16);
  }

  svg { flex: 0 0 auto; font-size: 18px; }

  input {
    width: 100%;
    min-width: 0;
    padding: 9px 10px;
    border: 0;
    outline: none;
    background: transparent;
    color: var(--whitesmoke);
    font-size: 13px;

    &::placeholder { color: rgba(245, 245, 245, 0.45); }
  }

  @media (max-width: 768px) {
    min-height: 38px;
    padding: 0 8px;
    input { padding: 8px; font-size: 12px; }
  }
`;

export const SearchResults = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 30;
  max-height: min(44vh, 330px);
  overflow-y: auto;
  padding: 5px;
  border: 1px solid rgba(71, 219, 255, 0.48);
  border-radius: 4px;
  background: rgba(0, 7, 17, 0.98);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.52);
`;

export const SearchResultButton = styled.button<{ $color: string }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border: 0;
  border-left: 2px solid ${({ $color }) => $color};
  background: transparent;
  color: var(--whitesmoke);
  text-align: left;

  & + & { margin-top: 3px; }

  span:first-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span:last-child {
    color: ${({ $color }) => $color};
    font-family: 'DO Futuristic', sans-serif;
    font-size: 9px;
    letter-spacing: 0.6px;
    text-transform: uppercase;

    small {
      display: block;
      margin-top: 2px;
      color: var(--clearneonYellow);
      font-family: sans-serif;
      font-size: 8px;
      letter-spacing: 0.3px;
    }
  }

  &:hover,
  &:focus-visible,
  &[aria-selected='true'] {
    outline: none;
    background: rgba(71, 219, 255, 0.1);
  }
`;

export const EmptySearch = styled.p`
  margin: 0;
  padding: 10px;
  color: rgba(245, 245, 245, 0.65);
  font-size: 12px;
  text-align: center;
`;

export const ToolbarActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

export const OrganizationControl = styled.div`
  position: relative;
`;

export const OrganizationButton = styled.button<{ $active: boolean; $neon: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 8px 14px;
  border: 1px solid ${({ $active }) => $active
    ? 'var(--clearneonBlue)'
    : 'rgba(71, 219, 255, 0.52)'};
  border-radius: 3px;
  background: ${({ $active }) => $active ? 'rgba(0, 212, 255, 0.1)' : 'rgba(0, 6, 16, 0.84)'};
  color: ${({ $active }) => $active ? 'var(--clearneonBlue)' : 'var(--whitesmoke)'};
  font-family: 'Orbitron', sans-serif;
  font-size: 10px;
  letter-spacing: 0.7px;
  text-transform: uppercase;

  svg {
    color: var(--clearneonBlue) !important;
    fill: var(--clearneonBlue) !important;
    font-size: 18px;
    filter: ${({ $neon }) => $neon ? 'drop-shadow(0 0 5px var(--clearneonBlue))' : 'none'};
  }

  &:hover,
  &:focus-visible {
    outline: none;
    border-color: var(--clearneonBlue);
    color: var(--clearneonBlue);
    background: rgba(0, 212, 255, 0.1);
  }

  @media (max-width: 768px) {
    width: 38px;
    min-height: 38px;
    padding: 0;
    span { display: none; }
  }
`;

export const OrganizationMenu = styled.div`
  position: absolute;
  top: calc(100% + 7px);
  right: 0;
  z-index: 32;
  display: grid;
  gap: 4px;
  width: 250px;
  padding: 5px;
  border: 1px solid rgba(71, 219, 255, 0.58);
  border-radius: 4px;
  background: rgba(0, 7, 17, 0.98);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.58);

  @media (max-width: 768px) {
    position: fixed;
    top: auto;
    right: 8px;
    bottom: 12px;
    width: min(280px, calc(100vw - 16px));
  }
`;

export const OrganizationOption = styled.button<{ $active: boolean }>`
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 9px;
  align-items: center;
  width: 100%;
  padding: 9px 10px;
  border: 1px solid ${({ $active }) => $active
    ? 'rgba(71, 219, 255, 0.62)'
    : 'transparent'};
  border-radius: 3px;
  background: ${({ $active }) => $active ? 'rgba(0, 212, 255, 0.1)' : 'transparent'};
  color: var(--whitesmoke);
  text-align: left;

  > svg {
    color: var(--clearneonBlue) !important;
    fill: var(--clearneonBlue) !important;
    font-size: 19px;
  }
  > span { display: grid; gap: 2px; }
  strong {
    color: ${({ $active }) => $active ? 'var(--clearneonBlue)' : 'var(--whitesmoke)'};
    font-family: 'Orbitron', sans-serif;
    font-size: 10px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  small { color: rgba(245, 245, 245, 0.62); font-size: 10px; }

  &:hover,
  &:focus-visible {
    outline: none;
    border-color: var(--clearneonBlue);
    background: rgba(0, 212, 255, 0.1);
  }
`;

export const CentralizeButton = styled.button<{ $neon: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 8px 14px;
  border: 1px solid rgba(71, 219, 255, 0.52);
  border-radius: 3px;
  background: rgba(0, 6, 16, 0.84);
  color: var(--whitesmoke);
  font-family: 'Orbitron', sans-serif;
  font-size: 10px;
  letter-spacing: 0.7px;
  text-transform: uppercase;

  svg {
    color: var(--clearneonBlue) !important;
    fill: var(--clearneonBlue) !important;
    font-size: 18px;
    filter: ${({ $neon }) => $neon ? 'drop-shadow(0 0 6px var(--clearneonBlue))' : 'none'};
  }

  &:hover,
  &:focus-visible {
    outline: none;
    border-color: var(--clearneonBlue);
    color: var(--clearneonBlue);
    background: rgba(0, 212, 255, 0.1);
  }

  @media (max-width: 768px) {
    width: 38px;
    min-height: 38px;
    padding: 0;
    span { display: none; }
  }
`;
