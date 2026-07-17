import styled from 'styled-components';
import { WikiSearchEntityType } from '../../types';
import { FallbackImage } from '../../../../components/Generic/FallbackImage/FallbackImage';

const getGroupColor = (type: WikiSearchEntityType) => ({
  pages: 'var(--clearneonBlue)',
  characters: 'var(--clearneonPink)',
  cities: 'var(--clearneonYellow)',
  races: 'var(--clearneonGreen)',
  items: 'var(--clearneonViolet)',
}[type]);

export const SearchResultsContainer = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 32px 24px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 24px 12px;
  }
`;

export const SearchResultsHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid #333;
  padding-bottom: 16px;
`;

export const ResultCount = styled.p`
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
`;

export const NoResultsMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);

  p {
    margin: 0;
    font-size: 16px;
  }
`;

export const SearchResultGroup = styled.section`
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  min-width: 0;
`;

export const SearchResultGroupTitle = styled.h2<{ $type: WikiSearchEntityType; $neon: boolean }>`
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 12px 0 0;
  padding-bottom: 8px;
  border-bottom: 1px solid ${({ $type }) => getGroupColor($type)};
  color: ${({ $type }) => getGroupColor($type)} !important;
  font-family: 'DO Futuristic', sans-serif;
  font-size: 20px;
  font-weight: 100;
  letter-spacing: 1.5px;
  text-shadow: ${({ $neon, $type }) => $neon ? `0 0 6px ${getGroupColor($type)}` : 'none'};

  span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 22px;
    padding: 0 5px;
    border: 1px solid currentColor;
    border-radius: 999px;
    box-sizing: border-box;
    color: inherit !important;
    font-family: sans-serif;
    font-size: 11px;
    letter-spacing: 0;
  }

  @media (max-width: 768px) {
    font-size: 16px;
    letter-spacing: 1px;
  }
`;

export const SearchResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  width: 100%;
  min-width: 0;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const ResultCard = styled.button<{
  $type: WikiSearchEntityType;
  $neon: boolean;
  $isDark: boolean;
}>`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0;
  border: 2px solid #333;
  border-radius: 8px;
  background-color: ${({ $isDark }) => $isDark ? '#1a1a1a' : '#242532'};
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  text-align: left;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;

  &:hover {
    border-color: ${({ $type }) => getGroupColor($type)};
    box-shadow: ${({ $neon, $type }) => $neon ? `0 0 14px ${getGroupColor($type)}` : '0 8px 18px rgba(0, 0, 0, 0.28)'};
    transform: translateY(-4px);
  }

  &:active {
    transform: translateY(-2px);
  }
`;

export const ResultCardImage = styled(FallbackImage)<{ $type: WikiSearchEntityType }>`
  width: 100%;
  height: 160px;
  background-color: #000;
  color: ${({ $type }) => getGroupColor($type)};
`;

export const ResultCardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  flex: 1;
  min-width: 0;
`;

export const ResultCardTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow-wrap: anywhere;
`;

export const ResultCardDescription = styled.p`
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  overflow-wrap: anywhere;
`;

export const ResultCardPlaceholder = styled.div<{ $type: WikiSearchEntityType }>`
  width: 100%;
  height: 160px;
  background: linear-gradient(135deg, #0a3a3a 0%, #1a1a1a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $type }) => getGroupColor($type)};
  font-size: 32px;
`;
