import styled from 'styled-components';
import { FallbackImage } from '../../../../../../../components/Generic/FallbackImage/FallbackImage';

interface ThemeProps {
  $isDark?: boolean;
}

export const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  max-width: 100%;
`;

export const RelationContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const ReferenceInfo = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 28px;
  color: var(--whitesmoke);
  font-family: 'DO Futuristic', sans-serif;
  font-size: 12px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
`;

export const ReferenceInfoButton = styled.button<{ $neon: boolean }>`
  display: inline-flex;
  width: 25px;
  height: 25px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid ${({ $neon }) => $neon ? 'var(--clearneonBlue)' : 'var(--lightGrey)'};
  border-radius: 5px;
  background: transparent;
  color: ${({ $neon }) => $neon ? 'var(--clearneonBlue)' : 'var(--lightGrey)'};
  cursor: pointer;
  transition: 0.2s ease;

  &:hover,
  &:focus-visible,
  &[aria-expanded='true'] {
    border-color: var(--clearneonBlue);
    color: var(--clearneonBlue);
    box-shadow: ${({ $neon }) => $neon ? '0 0 8px rgba(0, 204, 255, 0.3)' : 'none'};
    outline: none;
  }
`;

export const ReferenceInfoPopover = styled.aside<ThemeProps & { $neon: boolean }>`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 20;
  width: min(520px, calc(100vw - 40px));
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid ${({ $neon }) => $neon ? 'var(--clearneonBlue)' : 'var(--lightGrey)'};
  border-radius: 7px;
  background: ${({ $isDark }) => $isDark ? 'rgba(1, 10, 24, 0.98)' : 'rgba(248, 252, 255, 0.99)'};
  color: ${({ $isDark }) => $isDark ? 'var(--whitesmoke)' : 'var(--deepgrey)'};
  box-shadow: ${({ $neon }) => $neon ? '0 0 14px rgba(0, 204, 255, 0.2)' : '0 8px 24px rgba(0, 0, 0, 0.22)'};
  font-family: inherit;
  font-size: 12px;
  font-weight: 400;
  letter-spacing: normal;
  line-height: 1.5;
  text-transform: none;
`;

export const AddReferenceRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  border: 1px dashed rgba(255, 255, 255, 0.15);
  min-width: 0;

  > * {
    min-width: 0;
    max-width: 100%;
  }
`;

export const EntityDisplay = styled.div<ThemeProps>`
  padding: 12px;
  border-radius: 8px;
  background-color: ${props => (props.$isDark ? '#1a1a1a' : '#f5f5f5')};
  border-left: 4px solid #28a745;
`;

export const EntityContent = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;

  @media (max-width: 480px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

export const EntityImage = styled(FallbackImage)<{ $entityType?: string }>`
  height: 80px;
  width: auto;
  flex-shrink: 0;
  /* Shape and aspect based on entity type */
  border-radius: ${props => (props.$entityType === 'Personagem' ? '50%' : '6px')};
  aspect-ratio: ${props => (props.$entityType === 'Raca' || props.$entityType === 'Item' || props.$entityType === 'Personagem' ? '1 / 1' : '16 / 9')};
`;

export const EntityDetails = styled.div`
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
`;

export const EntityName = styled.p`
  margin: 0 0 4px 0;
  font-weight: bold;
`;

export const EntityType = styled.p`
  margin: 0;
  font-size: 12px;
  opacity: 0.7;
`;

export const ReferenceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

export const ReferenceTypeHeader = styled.div`
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.7;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 8px;
`;

export const ReferenceItem = styled.div<ThemeProps>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  margin-bottom: 8px;
  border-radius: 8px;
  background-color: ${props => (props.$isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)')};
  border: 1px solid ${props => (props.$isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')};
`;

export const ReferenceHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 4px;
  min-width: 0;
  flex-wrap: wrap;
`;

export const ReferenceOrderButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const OrderButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: inherit;
  border-radius: 6px;
  padding: 4px 6px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.4);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

export const RemoveButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid rgba(220, 53, 69, 0.5);
  color: #dc3545;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(220, 53, 69, 0.1);
    border-color: #dc3545;
  }
`;

export const EmptyMessage = styled.div<ThemeProps>`
  padding: 12px;
  border-radius: 8px;
  border: 1px dashed ${props => (props.$isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)')};
  font-size: 13px;
  opacity: 0.7;
  text-align: center;
`;
