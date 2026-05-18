import styled from 'styled-components';

export const RelationBlockContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

export const RelationBlockHeader = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 12px;
  border-bottom: 2px solid #333;

  h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #00d4ff;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

export const RelationItemsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
`;

export const RelationCard = styled.button`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0;
  border: 2px solid #333;
  border-radius: 8px;
  background-color: #0a0a0a;
  cursor: not-allowed; // Relações não são clicáveis nesta versão
  overflow: hidden;
  transition: all 0.3s ease;
  text-align: left;
  opacity: 0.8;

  @media (hover: hover) {
    &:hover {
      border-color: rgba(0, 212, 255, 0.3);
      background-color: rgba(0, 212, 255, 0.02);
    }
  }
`;

export const RelationCardImage = styled.img`
  width: 100%;
  height: 150px;
  object-fit: cover;
  background-color: #000;
`;

export const RelationCardPlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 150px;
  background: linear-gradient(135deg, #0a3a3a 0%, #1a1a1a 100%);
  color: rgba(0, 212, 255, 0.2);
  font-size: 32px;
`;

export const RelationCardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
`;

export const RelationCardTitle = styled.h5`
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
`;

export const RelationCardType = styled.span`
  font-size: 11px;
  color: #00d4ff;
  font-weight: 500;
  text-transform: uppercase;
  opacity: 0.8;
`;

export const ErrorMessage = styled.div`
  padding: 12px;
  background-color: rgba(220, 53, 69, 0.1);
  border-left: 4px solid #dc3545;
  border-radius: 4px;
  color: #dc3545;
  font-size: 12px;

  p {
    margin: 0;
  }
`;

export const TypeIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(0, 212, 255, 0.1);
  color: #00d4ff;
  font-size: 14px;
`;

export const TypeLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #00d4ff;
  text-transform: capitalize;
`;
