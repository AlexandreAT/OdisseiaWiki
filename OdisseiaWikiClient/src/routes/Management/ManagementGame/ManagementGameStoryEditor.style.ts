import styled, { css } from 'styled-components';
import { GameAdminActions } from './ManagementGame.style';
import { Offers } from './ManagementGameVendorOffers/ManagementGameVendorOffers.style';

export const StoryEditorBody = styled(Offers)<{ $compact: boolean }>`
  > details { border: 1px solid color-mix(in srgb, var(--clearneonBlue) 25%, transparent); padding: 14px; min-width: 0; }
  summary { cursor: pointer; color: var(--clearneonBlue); font: 500 .85rem 'Orbitron', sans-serif; line-height: 1.6; overflow-wrap: anywhere; }
  summary:focus-visible { outline: 2px solid var(--clearneonBlue); outline-offset: 4px; }
  details[open] > summary { margin-bottom: 18px; }
  details details { border-top: 1px solid color-mix(in srgb, var(--clearneonBlue) 18%, transparent); padding-top: 16px; }
  ${({ $compact }) => $compact && css`
    justify-items: center;
    text-align: center;
    padding-block: 8px;
    > h4 { justify-content: center; margin: 0; }
    > p { max-width: 44ch; }
  `}
  @media (max-width: 480px) { > details { padding: 12px 8px; } }
`;

export const StoryEditorActions = styled(GameAdminActions)`
  width: 100%;
  justify-content: center;
`;
