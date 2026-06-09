import styled from 'styled-components';

export const PageContainer = styled.div`
  padding: 24px;
  display: flex;
  gap: 24px;
  align-items: flex-start;
`;

export const Avatar = styled.img`
  width: 180px;
  height: 180px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(0,0,0,0.25);
`;

export const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const Title = styled.h1`
  margin: 0;
  font-size: 28px;
`;

export const Meta = styled.div`
  color: var(--muted, #999);
`;

export const Content = styled.div`
  flex: 1 1 0;
`;
