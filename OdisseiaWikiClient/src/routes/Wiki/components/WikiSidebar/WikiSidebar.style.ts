import styled from 'styled-components';
import { SectionItemProps } from './types';

export const SidebarWrapper = styled.aside<{ $expanded: boolean; $headerExpanded: boolean }>`
  display: flex;
  flex-direction: column;
  width: ${props => (props.$expanded ? '180px' : '0px')};
  border-right: ${props => (props.$expanded ? '1px solid #333' : 'none')};
  height: auto;
  min-height: 100%;
  align-self: stretch;
  position: relative;
  left: 0;
  transition: width 0.3s ease-in-out;
  z-index: 10;
  background-color: rgba(0, 8, 18, 0.48);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  box-sizing: border-box;

  @media (max-width: 1100px) {
    width: ${props => (props.$expanded ? '110px' : '0px')};
  }

  @media (max-width: 768px) {
    position: fixed;
    width: ${props => (props.$expanded ? 'min(72vw, 240px)' : '0px')};
    height: ${props => (props.$headerExpanded ? 'calc(100dvh - 115px)' : 'calc(100dvh - 54px)')};
    top: ${props => (props.$headerExpanded ? '115px' : '54px')};
    max-height: none;
    min-height: 0;
    align-self: auto;
    overflow: visible;
    border-right: ${props => (props.$expanded ? '1px solid #333' : 'none')};
    background-color: rgba(0, 8, 18, 0.97);
    box-shadow: ${props => (props.$expanded ? '8px 0 24px rgba(0, 0, 0, 0.45)' : 'none')};
    z-index: 30;
  }

  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 3px;

    &:hover {
      background: #555;
    }
  }
`;

export const SidebarContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  flex: 1;
  overflow-y: auto;
  min-width: 0;
  max-height: 100%;
`;

export const SectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid #333;

  &:last-child {
    border-bottom: none;
  }
`;

export const SectionHeader = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  background-color: transparent;
  border: none;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  min-width: 0;
  box-sizing: border-box;

  span {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  &:hover {
    background-color: rgba(0, 212, 255, 0.05);
    color: #00d4ff;
  }

  svg {
    width: 16px;
    height: 16px;
    transition: transform 0.2s ease;
  }

  &[aria-expanded='true'] svg {
    transform: rotate(180deg);
  }

  @media (max-width: 1100px) {
    padding: 10px 8px;
    font-size: 11px;
  }
`;

export const SectionItems = styled.div<{ $expanded: boolean }>`
  display: ${props => (props.$expanded ? 'flex' : 'none')};
  flex-direction: column;
  gap: 0;
  max-height: ${props => (props.$expanded ? '500px' : '0')};
  overflow: hidden;
  transition: all 0.2s ease;
`;

export const SectionItemContainer = styled.div`
  overflow: hidden;
  width: 100%;
`;

export const SectionItem = styled.button<SectionItemProps>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 16px 10px 18px;
  background-color: transparent;
  border: none;
  border-left: 2px solid ${props => (props.$isActive ? '#00d4ff' : 'transparent')};
  color: ${props => (props.$isActive ? '#00d4ff' : 'rgba(255, 255, 255, 0.7)')};
  font-size: 12px;
  cursor: pointer;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.2s ease;

  &:hover {
    color: #00d4ff;
    background-color: rgba(0, 212, 255, 0.05);
    border-left-color: #00d4ff;
  }

  &:active {
    transform: translateX(2px);
  }

  @media (max-width: 1100px) {
    padding: 8px 7px 8px 10px;
    font-size: 10px;
  }
`;

export const EmptySidebarMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  flex: 1;

  p {
    margin: 0;
  }
`;

export const ToggleSidebarButton = styled.button<{ $isExpanded: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  right: -24px;
  top: 12px;
  width: 24px;
  height: 24px;
  padding: 0;
  background-color: transparent;
  border-right: 1px solid #333;
  border-top: 1px solid #333;
  border-bottom: 1px solid #333;
  border-left: none;
  border-radius: 0;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  z-index: 15;

  svg {
    width: 14px;
    height: 14px;
    transition: transform 0.3s ease;
    transform: ${props => (props.$isExpanded ? 'rotateY(0deg)' : 'rotateY(180deg)')};
  }

  &:hover {
    background-color: rgba(0, 212, 255, 0.05);
    color: #00d4ff;
  }

  &:active {
    transform: scale(0.95);
  }

  @media (max-width: 768px) {
    right: -36px;
    top: 8px;
    width: 36px;
    height: 36px;
    border: 1px solid #333;
    border-radius: 4px;
    background-color: rgba(0, 8, 18, 0.96);
    z-index: 45;
  }
`;

export const SidebarInner = styled.div<{ $headerExpanded: boolean }>`
  position: sticky;
  top: ${props => (props.$headerExpanded ? '157px' : '85px')};
  display: flex;
  flex-direction: column;
  width: 100%;
  height: ${props => (props.$headerExpanded ? 'calc(100vh - 157px)' : 'calc(100vh - 85px)')};
  min-width: 0;
  transition: top 0.3s ease-in-out, height 0.3s ease-in-out;

  @media (max-width: 1100px) {
    top: ${props => (props.$headerExpanded ? '131px' : '66px')};
    height: ${props => (props.$headerExpanded ? 'calc(100vh - 131px)' : 'calc(100vh - 66px)')};
  }

  @media (max-width: 768px) {
    position: relative;
    top: 0;
    height: 100%;
  }
`;
