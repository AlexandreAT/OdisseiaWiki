import styled, { keyframes } from 'styled-components';
import { HudFrame } from '../HudFrame/HudFrame';
import { hudModalCloseButton, hudModalHeader, hudModalScrollbar, hudModalSurface } from '../HudFrame/modalAppearance';
import { cyberButtonsFillWidth, cyberButtonActionRow } from '../HighlightButton/HighlightButton.styles';

interface ThemeProps { theme: 'dark' | 'light'; neon: 'on' | 'off'; }

const revealModal = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const ModalOverlay = styled.div<{ $mobileInset?: boolean }>`
  position: fixed; inset: 0;
  width: 100%; height: 100dvh;
  background: rgba(0, 3, 10, 0.78);
  backdrop-filter: blur(3px);
  display: flex; justify-content: center; align-items: center;
  z-index: 10000; padding: 20px; box-sizing: border-box;
  @media (max-width: 767px) {
    padding: ${({ $mobileInset }) => $mobileInset ? 'clamp(22px, 6dvh, 48px) 10px' : '0'};
  }
`;

export const ModalContainer = styled(HudFrame)<{ $width?: string; $mobileInset?: boolean }>`
  ${hudModalSurface}
  width: ${({ $width }) => $width ?? '500px'};
  max-width: 95%; max-height: min(90vh, 90dvh);
  overflow: hidden; display: flex; flex-direction: column;
  animation: ${revealModal} 180ms ease-out both;
  @media (max-width: 767px) {
    width: ${({ $mobileInset }) => $mobileInset ? '100%' : '100vw'};
    max-width: ${({ $mobileInset }) => $mobileInset ? '100%' : '100vw'};
    height: ${({ $mobileInset }) => $mobileInset ? 'auto' : '100dvh'};
    max-height: ${({ $mobileInset }) => $mobileInset ? 'calc(100dvh - clamp(44px, 12dvh, 96px))' : '100dvh'};
    margin: 0;
    input, select, textarea { width: 100%; max-width: 100%; box-sizing: border-box; }
  }
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

export const ModalHeaderContainer = styled.div<ThemeProps>`
  ${hudModalHeader}
  .modal-heading { min-width: 0; }
  .modal-header-actions { display: inline-flex; align-items: center; gap: 7px; }
  .modal-close { ${hudModalCloseButton} }
  .modal-close svg { font-size: 1.5rem; }
`;

export const ModalContentContainer = styled.div`
  position: relative; z-index: 4;
  padding: 16px 20px 24px; margin-right: 8px;
  flex: 1 1 auto; min-height: 0; min-width: 0;
  overflow-y: auto; overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  ${hudModalScrollbar}
  @media (max-width: 767px) { padding: 12px; margin-right: 5px; }
`;

export const ModalFooterContainer = styled.div<ThemeProps>`
  ${cyberButtonActionRow}
  position: relative; z-index: 4; flex: 0 0 auto;
  padding: 16px 20px; display: flex; justify-content: flex-end; gap: 8px;
  border-top: 1px solid rgba(0, 210, 255, 0.32);
  background: rgba(0, 7, 18, 0.94);
  @media (max-width: 600px) {
    flex-direction: column; align-items: stretch;
    ${cyberButtonsFillWidth}
  }
`;
