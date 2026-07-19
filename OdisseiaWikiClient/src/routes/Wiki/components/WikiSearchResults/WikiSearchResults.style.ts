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
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid #333;
  padding-bottom: 16px;

  @media (max-width: 560px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

export const ResultCount = styled.p`
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
`;

export const SortControl = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-width: 0;

  @media (max-width: 560px) {
    justify-content: space-between;
    width: 100%;
  }
`;

export const SortLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  white-space: nowrap;

  svg {
    width: 17px;
    height: 17px;
    color: var(--clearneonBlue);
  }
`;

export const SortSelect = styled.select`
  min-width: 158px;
  height: 34px;
  padding: 0 34px 0 11px;
  border: 1px solid #3b4650;
  border-radius: 4px;
  background-color: rgba(7, 16, 24, 0.92);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.25 6 6.25l5-5' fill='none' stroke='%2300d2ff' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-position: right 11px center;
  background-repeat: no-repeat;
  color: #fff;
  font: inherit;
  font-size: 12px;
  appearance: none;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--clearneonBlue);
    outline-offset: 2px;
  }

  @media (max-width: 560px) {
    flex: 1;
    min-width: 0;
    max-width: 210px;
  }
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

  ${({ $type }) => $type === 'characters' && `
    min-height: 142px;
    flex-direction: row;
    align-items: center;
    gap: 16px;
    padding: 18px;
    overflow: visible;
    background-image: radial-gradient(circle at 62px 50%, rgba(255, 0, 204, 0.12), transparent 42%);
  `}

  &:hover {
    border-color: ${({ $type }) => getGroupColor($type)};
    box-shadow: ${({ $neon, $type }) => $neon ? `0 0 14px ${getGroupColor($type)}` : '0 8px 18px rgba(0, 0, 0, 0.28)'};
    transform: translateY(-4px);
  }

  &:active {
    transform: translateY(-2px);
  }

  @media (max-width: 480px) {
    ${({ $type }) => $type === 'characters' && `
      min-height: 122px;
      gap: 13px;
      padding: 14px;
    `}
  }
`;

export const ResultCardImage = styled(FallbackImage)<{ $type: WikiSearchEntityType }>`
  width: ${({ $type }) => $type === 'characters' ? '104px' : '100%'};
  height: ${({ $type }) => $type === 'characters' ? '104px' : $type === 'races' || $type === 'items' ? 'auto' : '160px'};
  aspect-ratio: ${({ $type }) => $type === 'characters' || $type === 'races' || $type === 'items' ? '1 / 1' : 'auto'};
  flex: ${({ $type }) => $type === 'characters' ? '0 0 104px' : '0 0 auto'};
  border: ${({ $type }) => $type === 'characters' ? `2px solid ${getGroupColor($type)}` : '0'};
  border-radius: ${({ $type }) => $type === 'characters' ? '50%' : '0'};
  background-color: #000;
  color: ${({ $type }) => getGroupColor($type)};
  box-shadow: ${({ $type }) => $type === 'characters' ? `0 0 18px ${getGroupColor($type)}` : 'none'};

  @media (max-width: 480px) {
    width: ${({ $type }) => $type === 'characters' ? '84px' : '100%'};
    height: ${({ $type }) => $type === 'characters' ? '84px' : $type === 'races' || $type === 'items' ? 'auto' : '150px'};
    flex-basis: ${({ $type }) => $type === 'characters' ? '84px' : 'auto'};
  }
`;

export const ResultCardContent = styled.div<{ $type: WikiSearchEntityType }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: ${({ $type }) => $type === 'characters' ? '0' : '12px'};
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
