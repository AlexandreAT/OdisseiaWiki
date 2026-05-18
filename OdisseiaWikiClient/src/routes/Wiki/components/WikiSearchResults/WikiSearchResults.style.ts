import styled from 'styled-components';

export const SearchResultsContainer = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 32px 24px;
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

export const SearchResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const ResultCard = styled.button`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0;
  border: 2px solid #333;
  border-radius: 8px;
  background-color: #1a1a1a;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  text-align: left;

  &:hover {
    border-color: #00d4ff;
    box-shadow: 0 0 16px rgba(0, 212, 255, 0.2);
    transform: translateY(-4px);
  }

  &:active {
    transform: translateY(-2px);
  }
`;

export const ResultCardImage = styled.img`
  width: 100%;
  height: 160px;
  object-fit: cover;
  background-color: #000;
`;

export const ResultCardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  flex: 1;
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
`;

export const ResultCardPlaceholder = styled.div`
  width: 100%;
  height: 160px;
  background: linear-gradient(135deg, #0a3a3a 0%, #1a1a1a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.3);
  font-size: 32px;
`;
