import styled, { css, keyframes } from 'styled-components';
import { cyberButtonActionRow } from '../../../../../../components/Generic/HighlightButton/HighlightButton.styles';
import { managementEntityToolbarResponsive } from '../../ManagementEntityToolbar.style';

interface ThemeProps {
  $isDark?: boolean;
  $neon?: boolean;
}

const validationPulse = keyframes`
  0%, 100% { border-color: var(--clearneonRed); }
  50% { border-color: var(--clearneonBlue); }
`;

export const FormPageContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
`;

export const SectionHeader = styled.div<ThemeProps>`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid ${props => (props.$isDark ? '#333' : '#ddd')};
  margin-bottom: 12px;
`;

export const SectionTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
`;

export const GridInputs = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const FullWidthInput = styled.div`
  margin-top: 12px;
  grid-column: 1 / -1;
  min-width: 0;
`;

export const PageVisibilityControls = styled(FullWidthInput)`
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    gap: 12px 16px;
  }
`;



export const BlocksContainer = styled.div<ThemeProps & { $error?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid ${({ $neon, $isDark }) => $neon ? 'rgba(0, 204, 255, 0.4)' : ($isDark ? '#364554' : '#a7b7c4')};
  background: ${({ $isDark }) => $isDark
    ? 'linear-gradient(145deg, rgba(1, 8, 20, 0.94), rgba(5, 18, 34, 0.82))'
    : 'linear-gradient(145deg, rgba(248, 252, 255, 0.96), rgba(224, 239, 248, 0.84))'};
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;

  ${({ $error }) => $error && css`
    border: 2px solid var(--clearneonRed);
    box-shadow: 0 0 10px 2px var(--neonRed), 0 0 20px 1px var(--neonBlue);
    animation: ${validationPulse} 0.8s ease-in-out 2;
  `}

  @media (max-width: 768px) {
    padding: 10px;
  }
`;

export const BlockItem = styled.div<{ $isDragging?: boolean; $isDark?: boolean; $neon?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid ${({ $isDragging, $neon, $isDark }) => $isDragging
    ? 'var(--clearneonBlue)'
    : $neon ? 'rgba(0, 204, 255, 0.34)' : ($isDark ? '#3b4b58' : '#a8b9c6')};
  background: ${({ $isDark }) => $isDark
    ? 'linear-gradient(135deg, rgba(4, 14, 29, 0.96), rgba(8, 24, 40, 0.88))'
    : 'linear-gradient(135deg, rgba(253, 254, 255, 0.98), rgba(230, 242, 249, 0.9))'};
  box-shadow: ${({ $isDragging }) => $isDragging ? '0 0 18px rgba(0, 204, 255, 0.34)' : 'none'};
  opacity: ${({ $isDragging }) => $isDragging ? 0.82 : 1};
  transition: border-color 0.25s ease, box-shadow 0.25s ease, opacity 0.2s ease;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;

  @media (max-width: 480px) {
    padding: 10px;
  }

  &:hover {
    border-color: var(--clearneonBlue);
    box-shadow: ${({ $neon }) => $neon ? '0 0 11px rgba(0, 204, 255, 0.17)' : '0 3px 10px rgba(0, 0, 0, 0.12)'};
  }
`;

export const BlockHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  flex-wrap: wrap;
`;

export const BlockTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;

  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }

  span {
    font-size: 12px;
    opacity: 0.6;
  }
`;

export const BlockActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
`;

export const BlocksValidationMessage = styled.span`
  display: block;
  margin-top: 7px;
  padding-left: 8px;
  border-left: 2px solid var(--clearneonRed);
  color: var(--clearneonRed) !important;
  font-size: 12px;
  font-weight: 700;
  text-shadow: 0 0 5px var(--neonRed);
`;

export const IconButton = styled.button<{ danger?: boolean; $neon?: boolean; $isDark?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid ${({ danger, $neon, $isDark }) => danger
    ? 'rgba(255, 49, 105, 0.7)'
    : $neon ? 'rgba(0, 204, 255, 0.6)' : ($isDark ? '#617181' : '#718693')};
  border-radius: 4px;
  background: ${({ danger, $isDark }) => danger
    ? 'rgba(255, 49, 105, 0.08)'
    : $isDark ? 'rgba(0, 21, 38, 0.82)' : 'rgba(228, 241, 248, 0.92)'};
  color: ${({ danger, $neon, $isDark }) => danger
    ? 'var(--neonPink)'
    : $neon ? 'var(--clearneonBlue)' : ($isDark ? 'var(--lightGrey)' : 'var(--deepgrey)')};
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ danger }) => danger ? 'var(--neonPink)' : 'var(--clearneonBlue)'};
    background: ${({ danger }) => danger ? 'rgba(255, 49, 105, 0.17)' : 'rgba(0, 204, 255, 0.13)'};
    color: ${({ danger }) => danger ? 'var(--clearneonPink)' : 'var(--clearneonBlue)'};
    box-shadow: ${({ danger, $neon }) => $neon
      ? danger ? '0 0 8px rgba(255, 49, 105, 0.32)' : '0 0 8px rgba(0, 204, 255, 0.28)'
      : 'none'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const DragHandle = styled(IconButton)<{ $dragging?: boolean }>`
  cursor: ${({ $dragging }) => $dragging ? 'grabbing' : 'grab'};
  touch-action: none;
  user-select: none;

  &:active { cursor: grabbing; }
`;

export const DragPreview = styled.div<{ $isDark?: boolean; $neon?: boolean }>`
  position: fixed;
  z-index: 2200;
  display: flex;
  align-items: center;
  gap: 9px;
  width: min(260px, calc(100vw - 32px));
  padding: 10px 14px;
  border: 1px solid ${({ $neon, $isDark }) => $neon
    ? 'var(--clearneonBlue)'
    : ($isDark ? '#617181' : '#718693')};
  border-radius: 6px;
  background: ${({ $isDark }) => $isDark
    ? 'rgba(1, 12, 27, 0.94)'
    : 'rgba(239, 248, 252, 0.96)'};
  color: ${({ $isDark }) => $isDark ? 'var(--whitesmoke)' : 'var(--deepgrey)'};
  box-shadow: ${({ $neon }) => $neon
    ? '0 0 14px rgba(0, 204, 255, 0.3)'
    : '0 8px 22px rgba(0, 0, 0, 0.24)'};
  font-family: 'DO Futuristic', sans-serif;
  font-size: 12px;
  letter-spacing: 0.5px;
  opacity: 0.92;
  pointer-events: none;
  transform: translate(14px, 14px);

  svg {
    flex: 0 0 auto;
    color: var(--clearneonBlue);
    font-size: 18px;
  }
`;

export const BlockContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
`;

export const AddBlockContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 18px;
`;

export const BlockTypeSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  width: 100%;
  min-width: 0;

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const BlockTypeButton = styled.button<{ active?: boolean; $neon?: boolean; $isDark?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border: 1px solid ${({ active, $neon, $isDark }) => active || $neon
    ? 'rgba(0, 204, 255, 0.65)'
    : ($isDark ? '#506170' : '#8ca1ae')};
  border-radius: 8px;
  background: ${({ active, $isDark }) => active
    ? 'rgba(0, 204, 255, 0.15)'
    : $isDark ? 'rgba(2, 15, 31, 0.92)' : 'rgba(239, 248, 252, 0.95)'};
  color: ${({ active, $neon, $isDark }) => active || $neon
    ? 'var(--clearneonBlue)'
    : ($isDark ? 'var(--lightGrey)' : 'var(--deepgrey)')};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--clearneonBlue);
    background: rgba(0, 204, 255, 0.15);
    color: var(--clearneonBlue);
    box-shadow: ${({ $neon }) => $neon ? '0 0 10px rgba(0, 204, 255, 0.23)' : 'none'};
  }

  svg {
    width: 18px;
    height: 18px;
    flex: 0 0 auto;
    color: currentColor;
  }
`;

export const ActionButtonsContainer = styled.div<ThemeProps>`
  ${cyberButtonActionRow}
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid ${props => (props.$isDark ? '#333' : '#ddd')};
  flex-wrap: nowrap;

  @media (max-width: 768px) {
    > * {
      flex: 1 1 160px;
      max-width: 100%;
    }
  }

  ${managementEntityToolbarResponsive}
`;

export const EmptyBlocksMessage = styled.div`
  text-align: center;
  padding: 32px;
  opacity: 0.6;
  font-size: 14px;

  p {
    margin: 0;
  }
`;
