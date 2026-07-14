import styled from 'styled-components';

export const DivController = styled.section`
  position: sticky;
  top: 84px;
  z-index: 20;
  width: 100%;
  min-width: 0;

  @media (max-width: 1100px) {
    top: 66px;
  }

  @media (max-width: 768px) {
    top: 54px;
  }
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
  background-color: rgba(0, 8, 18, 0.58);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: ${props =>
    props.$isExpanded
      ? '1px solid #333'
      : 'none'};
  position: relative;
  box-sizing: border-box;
  z-index: 5;
  transition:
    max-height 0.3s ease-in-out,
    padding 0.3s ease-in-out;

  form {
    flex: 1;
    width: 100%;
    min-width: 0;
    max-width: 400px;
  }

  @media (max-width: 1100px) {
    gap: 12px;
    padding: ${props => props.$isExpanded ? '12px 18px' : '0 18px'};
  }

  @media (max-width: 768px) {
    gap: 8px;
    padding: ${props => props.$isExpanded ? '10px 12px' : '0 12px'};
  }
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
  min-width: 0;
  box-sizing: border-box;

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
  min-width: 0;
  width: 100%;

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

  position: absolute;

  top: 100%;

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

  @media (max-width: 768px) {
    right: 8px;
  }
`;
