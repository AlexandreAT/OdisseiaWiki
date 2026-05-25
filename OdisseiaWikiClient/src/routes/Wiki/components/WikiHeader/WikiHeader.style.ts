import styled from 'styled-components';

export const DivController = styled.section`
  position: relative;
  z-index: 1;
`

export const WikiHeaderWrapper = styled.div<{ $isExpanded: boolean }>`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: ${props =>
    props.$isExpanded
      ? '16px 24px'
      : '0px 24px'};
  max-height: ${props =>
    props.$isExpanded
      ? '100px'
      : '0px'};
  overflow: hidden;
  background-color: #1a1a1a;
  border-bottom: ${props =>
    props.$isExpanded
      ? '1px solid #333'
      : 'none'};
  position: fixed;
  top: 94px;
  z-index: 5;
  transition:
    max-height 0.3s ease-in-out,
    padding 0.3s ease-in-out;
`;

export const HomeButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 2px solid #00d4ff;
  border-radius: 4px;
  background-color: transparent;
  color: #00d4ff;
  cursor: pointer;
  font-size: 20px;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(0, 212, 255, 0.1);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

export const SearchInputWrapper = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 400px;
  background-color: transparent;
  border: 2px solid #333;
  border-radius: 4px;
  padding: 8px 12px;
  transition: all 0.2s ease;

  &:focus-within {
    border-color: #00d4ff;
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.2);
  }
`;

export const SearchInput = styled.input`
  flex: 1;
  background-color: transparent;
  border: none;
  color: #fff;
  font-size: 14px;
  outline: none;
  padding: 0;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

export const SearchIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 16px;
  margin-right: 8px;
`;
export const ToggleHeaderButton = styled.button<{ $isExpanded: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;

  position: fixed;

  top: ${props =>
    props.$isExpanded
      ? '165px'
      : '94px'};

  right: 14px;

  width: 24px;
  height: 24px;

  padding: 0;

  background-color: var(--clearblack);

  border-bottom: 1px solid #333;
  border-left: 1px solid #333;
  border-right: 1px solid #333;
  border-top: none;

  color: #fff;

  cursor: pointer;

  z-index: 5;

  transition:
    top 0.3s ease-in-out,
    background-color 0.2s ease;

  svg {
    width: 14px;
    height: 14px;

    transition: transform 0.3s ease;

    transform: ${props =>
      props.$isExpanded
        ? 'rotate(0deg)'
        : 'rotate(180deg)'};
  }

  &:hover {
    background-color: rgba(0, 212, 255, 0.05);
    color: #00d4ff;
  }
`;