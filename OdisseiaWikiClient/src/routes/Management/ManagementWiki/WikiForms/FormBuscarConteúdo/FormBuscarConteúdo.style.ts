import styled from "styled-components";

interface StyledProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const Main = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 20px;
  padding: 20px;
`;

export const SearchHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

export const SearchInputContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: flex-end;
  width: 100%;
`;

export const FilterContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

export const FilterButton = styled.button<StyledProps & { active: boolean }>`
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  border: 2px solid;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  
  background-color: ${({ active, theme, neon }) =>
    active
      ? neon === 'on'
        ? theme === 'light'
          ? 'var(--clearneonViolet)'
          : 'var(--clearneonBlue)'
        : theme === 'light'
          ? 'var(--neonViolet)'
          : 'var(--neonBlue)'
      : 'transparent'};
  
  border-color: ${({ theme, neon }) =>
    neon === 'on'
      ? theme === 'light'
        ? 'var(--clearneonViolet)'
        : 'var(--clearneonBlue)'
      : theme === 'light'
        ? 'var(--neonViolet)'
        : 'var(--neonBlue)'};
  
  color: ${({ active, theme }) =>
    active
      ? theme === 'light'
        ? 'var(--white)'
        : 'var(--black)'
      : theme === 'light'
        ? 'var(--black)'
        : 'var(--whitesmoke)'};

  &:hover {
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
  }
`;

export const ResultsInfo = styled.div<StyledProps>`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 6px;
  
  background-color: ${({ theme }) =>
    theme === 'light' ? 'var(--lightgray)' : 'var(--deepgray)'};
  
  color: ${({ theme }) =>
    theme === 'light' ? 'var(--black)' : 'var(--whitesmoke)'};
`;

export const ResultsText = styled.span`
  font-size: 14px;
  font-weight: 500;
`;

export const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  width: 100%;
  justify-items: center;
`;

export const EmptyState = styled.div<StyledProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
  width: 100%;
  
  color: ${({ theme }) =>
    theme === 'light' ? 'var(--darkgray)' : 'var(--lightgray)'};
`;

export const EmptyStateIcon = styled.div<StyledProps>`
  font-size: 48px;
  opacity: 0.5;
  
  color: ${({ theme, neon }) =>
    neon === 'on'
      ? theme === 'light'
        ? 'var(--clearneonViolet)'
        : 'var(--clearneonBlue)'
      : theme === 'light'
        ? 'var(--neonViolet)'
        : 'var(--neonBlue)'};
`;

export const EmptyStateText = styled.p`
  font-size: 16px;
  margin: 0;
  text-align: center;
`;

export const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  width: 100%;
`;

export const LoadingSpinner = styled.div<StyledProps>`
  width: 40px;
  height: 40px;
  border: 4px solid ${({ theme }) =>
    theme === 'light' ? 'var(--lightgray)' : 'var(--gray)'};
  border-top-color: ${({ theme, neon }) =>
    neon === 'on'
      ? theme === 'light'
        ? 'var(--clearneonViolet)'
        : 'var(--clearneonBlue)'
      : theme === 'light'
        ? 'var(--neonViolet)'
        : 'var(--neonBlue)'};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const ErrorText = styled.span<StyledProps>`
  font-size: 13px;
  margin-top: -8px;
  
  color: var(--error);
`;
