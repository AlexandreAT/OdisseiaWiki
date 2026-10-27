import styled from 'styled-components';
import { GameEyebrow, GameSectionTitle } from '../GameShared.style';
import { RunOverlayDialog, RunPanel } from './GameRunShell.style';

export const InventoryThemeDialog = styled(RunOverlayDialog)`
  .MuiDialog-paper { scrollbar-color: var(--inventory-accent) rgba(2, 13, 26, .7); }
`;

export const InventoryThemePanel = styled(RunPanel)`
  background:
    radial-gradient(ellipse at top right, color-mix(in srgb, var(--inventory-accent) 9%, transparent), transparent 65%),
    linear-gradient(145deg, rgba(2, 16, 31, .94), rgba(1, 7, 17, .92));
  ${GameEyebrow}, ${GameSectionTitle} { color: var(--inventory-accent); }
`;
