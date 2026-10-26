import styled from 'styled-components';

export const HudDisclosure = styled.div`
  min-width: 0;
  display: grid;
  gap: 6px;
`;

export const HudDisclosureToolbar = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  min-width: 0;
  gap: 10px;
  padding: 3px 1px;
  > span {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-family: 'DO Futuristic', sans-serif;
    font-size: 1rem;
    color: var(--clearneonBlue);
    line-height: 1.45;
    padding: 3px 0;
    > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
    img { width: 24px; height: 24px; flex: none; object-fit: cover; border-radius: 50%; }
  }
`;

export const HudDisclosureToggle = styled.button<{ $neon: boolean }>`
  display: inline-grid;
  place-items: center;
  flex: none;
  width: 36px;
  height: 28px;
  padding: 0;
  margin: 0;
  border: 1px solid transparent;
  border-radius: 5px;
  background: transparent;
  color: var(--clearneonBlue);
  cursor: pointer;
  transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
  svg { width: 19px; height: 19px; transition: transform 220ms ease; }
  &[aria-expanded='true'] svg { transform: rotate(180deg); }
  &:hover { border-color: rgba(77, 238, 234, .35); background: rgba(77, 238, 234, .05);
    box-shadow: ${({ $neon }) => $neon ? '0 0 8px rgba(77, 238, 234, .14)' : 'none'}; }
  &:focus-visible { outline: 2px solid var(--clearneonBlue); outline-offset: 2px; }
  @media (max-width: 600px) { width: 40px; height: 32px; }
  :root[data-motion='reduced'] & { &, svg { transition: none; } }
`;

export const HudDisclosureBody = styled.div<{ $open: boolean }>`
  display: grid;
  grid-template-rows: ${({ $open }) => $open ? '1fr' : '0fr'};
  opacity: ${({ $open }) => $open ? 1 : 0};
  visibility: ${({ $open }) => $open ? 'visible' : 'hidden'};
  transition: grid-template-rows 220ms ease, opacity 180ms ease,
    visibility 0s ${({ $open }) => $open ? '0s' : '220ms'};
  :root[data-motion='reduced'] & { transition: none; }
`;

export const HudDisclosureInner = styled.div`
  min-height: 0;
  overflow: hidden;
`;
