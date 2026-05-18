import styled from 'styled-components';

export const WikiPageHeaderSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 32px 40px;
  border-bottom: 1px solid #333;
  background: linear-gradient(135deg, #1a1a1a 0%, #0a3a3a 100%);
`;

export const PageCoverImage = styled.img`
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 16px;
`;

export const PageTitle = styled.h1`
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
`;

export const PageDescription = styled.p`
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
`;

export const PageMeta = styled.div`
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  opacity: 0.7;
`;

export const WikiBlocksSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
`;

export const WikiBlockWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 32px 24px;
  border-bottom: 1px solid #333;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: rgba(0, 212, 255, 0.02);
  }
`;
