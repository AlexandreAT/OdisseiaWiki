import styled from 'styled-components';
import { WikiLayoutProps } from './types';

export const WikiContainerWrapper = styled.div<WikiLayoutProps>`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: visible;
  min-width: 0;
  max-width: 100%;
`;

export const WikiContentArea = styled.div<WikiLayoutProps>`
  display: flex;
  flex: 1;
  width: 100%;
  min-height: 0;
  overflow: visible;
  min-width: 0;
  max-width: 100%;
`;

export const WikiMainSection = styled.div<
  WikiLayoutProps & { $sidebarExpanded: boolean; $headerExpanded: boolean }
>`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: visible;
  margin-left: 0;
  padding-top: 0;
  transition: margin-left 0.3s ease-in-out, padding-top 0.3s ease-in-out;
  max-width: 100%;

  @media (max-width: 1100px) {
    margin-left: 0;
  }

  @media (max-width: 768px) {
    width: 100%;
    margin-left: 0;
    padding-top: 0;
  }
`;

export const ErrorContainer = styled.div<WikiLayoutProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 32px;
  text-align: center;
  color: #dc3545;

  p {
    margin: 0;
    font-size: 16px;
  }
`;

export const LoadingContainer = styled.div<WikiLayoutProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 32px;

  p {
    margin: 0;
    font-size: 16px;
    opacity: 0.7;
  }
`;
