import styled from 'styled-components';
import { managementEntityToolbarResponsive } from '../../ManagementEntityToolbar.style';

interface ThemeProps {
  $isDark?: boolean;
  $neon?: boolean;
}

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

export const SlugField = styled.div`
  position: relative;
  min-width: 0;

  input {
    padding-right: 45px;
  }
`;

export const SlugInfoButton = styled.button<ThemeProps>`
  position: absolute;
  top: 0;
  right: 0;
  z-index: 3;
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ $neon }) => $neon ? 'var(--clearneonBlue)' : 'var(--lightGrey)'};
  border-radius: 0 7px 0 7px;
  padding: 0;
  background: ${({ $isDark }) => $isDark ? 'rgba(0, 10, 22, 0.94)' : 'rgba(245, 250, 255, 0.96)'};
  color: ${({ $neon }) => $neon ? 'var(--clearneonBlue)' : 'var(--deepgrey)'};
  cursor: pointer;
  transition: 0.2s ease;

  &:hover,
  &:focus-visible,
  &[aria-expanded='true'] {
    border-color: var(--clearneonBlue);
    color: var(--clearneonBlue);
    box-shadow: 0 0 8px rgba(0, 204, 255, 0.32);
    outline: none;
  }
`;

export const SlugInfoPopover = styled.aside<ThemeProps>`
  position: absolute;
  top: 40px;
  right: 0;
  z-index: 40;
  width: min(390px, calc(100vw - 34px));
  box-sizing: border-box;
  border: 1px solid ${({ $neon }) => $neon ? 'var(--clearneonBlue)' : 'var(--lightGrey)'};
  border-radius: 7px;
  padding: 14px 16px;
  background: ${({ $isDark }) => $isDark ? 'rgba(1, 10, 24, 0.98)' : 'rgba(248, 252, 255, 0.99)'};
  color: ${({ $isDark }) => $isDark ? 'var(--whitesmoke)' : 'var(--deepgrey)'};
  box-shadow: ${({ $neon }) => $neon
    ? '0 0 16px rgba(0, 204, 255, 0.22), inset 0 0 18px rgba(0, 104, 170, 0.08)'
    : '0 10px 30px rgba(0, 0, 0, 0.22)'};
  font-size: 12px;
  line-height: 1.55;

  &::before {
    position: absolute;
    top: -5px;
    right: 17px;
    width: 8px;
    height: 8px;
    border-top: 1px solid ${({ $neon }) => $neon ? 'var(--clearneonBlue)' : 'var(--lightGrey)'};
    border-left: 1px solid ${({ $neon }) => $neon ? 'var(--clearneonBlue)' : 'var(--lightGrey)'};
    background: inherit;
    content: '';
    transform: rotate(45deg);
  }

  strong {
    display: block;
    margin-bottom: 7px;
    color: var(--clearneonBlue);
    font-family: 'DO Futuristic', sans-serif;
    font-size: 12px;
    font-weight: 100;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  p { margin: 0 0 8px; }
  ul { margin: 0; padding-left: 18px; }
  li + li { margin-top: 5px; }
  code {
    border: 1px solid rgba(0, 204, 255, 0.24);
    border-radius: 3px;
    padding: 1px 4px;
    color: var(--clearneonBlue);
    background: rgba(0, 119, 180, 0.12);
  }
`;


export const BlocksContainer = styled.div<ThemeProps>`
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
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid ${props => (props.$isDark ? '#333' : '#ddd')};
  flex-wrap: wrap;

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
