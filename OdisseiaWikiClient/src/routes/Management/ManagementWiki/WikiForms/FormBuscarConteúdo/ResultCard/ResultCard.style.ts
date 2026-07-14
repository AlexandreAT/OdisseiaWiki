import styled from "styled-components";

interface StyledCardProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const CardContainer = styled.div<StyledCardProps>`
  display: flex;
  flex-direction: column;
  width: 280px;
  min-height: 320px;
  max-height: 380px;
  border-radius: 8px;
  padding: 16px;
  gap: 12px;
  position: relative;
  overflow: hidden;
  
  background-color: ${({ theme }) => 
    theme === 'light' ? 'var(--clearWhite)' : 'var(--deepgray)'};
  
  border: 2px solid ${({ theme, neon }) =>
    neon === 'on'
      ? theme === 'light'
        ? 'var(--neonViolet)'
        : 'var(--clearneonBlue)'
      : theme === 'light'
        ? 'var(--deepneonViolet)'
        : 'var(--neonBlue)'};

  box-shadow: ${({ theme, neon }) =>
    neon === 'on'
      ? theme === 'light'
        ? '0 0 12px var(--clearneonViolet)'
        : '0 0 12px var(--clearneonPink)'
      : 'none'};

  transition: transform 0.2s ease, box-shadow 0.2s ease;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;

  @media (max-width: 768px) {
    width: 100%;
    min-height: 0;
    max-height: none;
    padding: 10px;
    gap: 8px;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme, neon }) =>
      neon === 'on'
        ? theme === 'light'
          ? '0 4px 20px var(--clearneonViolet)'
          : '0 4px 20px var(--clearneonPink)'
        : '0 4px 12px rgba(0, 0, 0, 0.15)'};
  }
`;

export const CardHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-width: 0;
  flex-wrap: wrap;
`;

export const CardImage = styled.div<{ imageUrl?: string }>`
  width: 100%;
  height: 140px;
  border-radius: 6px;
  background: ${({ imageUrl }) =>
    imageUrl
      ? `url(${imageUrl})`
      : 'linear-gradient(135deg, var(--deepgray) 0%, var(--gray) 100%)'};
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  flex-shrink: 0;

  @media (max-width: 768px) {
    height: 96px;
  }
`;

export const CardTitle = styled.h3<StyledCardProps>`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;

  @media (max-width: 768px) {
    font-size: 15px;
    white-space: normal;
    overflow-wrap: anywhere;
  }
  
  color: ${({ theme, neon }) =>
    neon === 'on'
      ? theme === 'light'
        ? 'var(--clearneonViolet)'
        : 'var(--clearneonBlue)'
      : theme === 'light'
        ? 'var(--black)'
        : 'var(--whitesmoke)'};
`;

export const EntityBadge = styled.span<StyledCardProps>`
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 12px;
  white-space: nowrap;
  
  background-color: ${({ theme, neon }) =>
    neon === 'on'
      ? theme === 'light'
        ? 'var(--clearneonViolet)'
        : 'var(--clearneonBlue)'
      : theme === 'light'
        ? 'var(--neonViolet)'
        : 'var(--neonBlue)'};
  
  color: ${({ theme }) =>
    theme === 'light' ? 'var(--white)' : 'var(--black)'};

  @media (max-width: 768px) {
    padding: 3px 7px;
    font-size: 10px;
    white-space: normal;
  }
`;

export const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  overflow: hidden;
`;

export const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 60px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--gray);
    border-radius: 2px;
  }
`;

export const Tag = styled.span<StyledCardProps>`
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 10px;
  white-space: nowrap;
  
  background-color: ${({ theme }) =>
    theme === 'light' ? 'var(--lightgray)' : 'var(--gray)'};
  
  color: ${({ theme }) =>
    theme === 'light' ? 'var(--black)' : 'var(--whitesmoke)'};
`;

export const VisibilityIndicator = styled.div<StyledCardProps & { visivel: boolean }>`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  
  background-color: ${({ visivel }) =>
    visivel ? 'var(--success)' : 'var(--error)'};
  
  box-shadow: 0 0 6px ${({ visivel }) =>
    visivel ? 'var(--success)' : 'var(--error)'};
`;

export const CardActions = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  margin-top: auto;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 6px;
  }
`;

export const ActionButton = styled.button<StyledCardProps>`
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  
  background-color: ${({ theme, neon }) =>
    neon === 'on'
      ? theme === 'light'
        ? 'var(--clearneonViolet)'
        : 'var(--clearneonBlue)'
      : theme === 'light'
        ? 'var(--neonViolet)'
        : 'var(--neonBlue)'};
  
  color: ${({ theme }) =>
    theme === 'light' ? 'var(--white)' : 'var(--black)'};

  @media (max-width: 768px) {
    padding: 6px 8px;
    font-size: 12px;
  }

  &:hover {
    opacity: 0.8;
    transform: scale(1.02);
  }

  &:active {
    transform: scale(0.98);
  }
`;

export const InfoText = styled.p<StyledCardProps>`
  font-size: 13px;
  margin: 0;
  line-height: 1.4;
  overflow-wrap: anywhere;
  
  color: ${({ theme }) =>
    theme === 'light' ? 'var(--darkgray)' : 'var(--lightgray)'};
`;
