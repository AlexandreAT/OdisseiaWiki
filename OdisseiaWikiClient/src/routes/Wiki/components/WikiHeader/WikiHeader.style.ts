import styled from 'styled-components';
import { WikiSearchEntityType } from '../../types';

const getGroupColor = (type: WikiSearchEntityType) => ({
  pages: 'var(--clearneonBlue)',
  characters: 'var(--clearneonPink)',
  cities: 'var(--clearneonYellow)',
  races: 'var(--clearneonGreen)',
  items: 'var(--clearneonViolet)',
}[type]);

export const DivController = styled.section`
  position: sticky;
  top: calc(var(--main-header-height, 85px) + 1px);
  z-index: 50;
  width: 100%;
  min-width: 0;
  margin-top: 0;

  @media (min-width: 1101px) {
    top: calc(var(--main-header-height, 85px) + 6px);
  }

  @media (max-width: 1100px) {
    top: calc(var(--main-header-height, 67px) + 1px);
  }

  @media (max-width: 768px) {
    top: var(--main-header-height, 54px);
    margin-top: 0;
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
  overflow: ${({ $isExpanded }) => ($isExpanded ? 'visible' : 'hidden')};
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

export const SearchForm = styled.form`
  position: relative;
  z-index: 2;
  flex: 1;
  width: 100%;
  min-width: 0;
  max-width: 400px;
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

export const AutocompleteDropdown = styled.div<{ $isDark: boolean }>`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 100;
  width: 100%;
  max-height: min(58vh, 430px);
  overflow-y: auto;
  padding: 6px;
  box-sizing: border-box;
  border: 1px solid rgba(0, 212, 255, 0.45);
  border-radius: 6px;
  background: ${({ $isDark }) => $isDark ? 'rgba(0, 8, 18, 0.97)' : 'rgba(20, 22, 32, 0.97)'};
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  @media (max-width: 768px) {
    max-height: 50vh;
    padding: 4px;
  }
`;

export const SuggestionGroup = styled.section`
  display: flex;
  flex-direction: column;
  min-width: 0;

  & + & {
    margin-top: 5px;
    padding-top: 5px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

export const SuggestionGroupTitle = styled.button<{ $type: WikiSearchEntityType; $neon: boolean }>`
  display: block;
  width: 100%;
  margin: 0;
  padding: 5px 8px 4px;
  border: 0;
  border-radius: 3px;
  background: transparent;
  color: ${({ $type }) => getGroupColor($type)} !important;
  font-family: 'DO Futuristic', sans-serif;
  font-size: 11px;
  font-weight: 100;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  text-align: left;
  text-shadow: ${({ $neon, $type }) => $neon ? `0 0 5px ${getGroupColor($type)}` : 'none'};

  &:hover,
  &:focus-visible {
    outline: none;
    background: rgba(255, 255, 255, 0.07);
    text-shadow: ${({ $type }) => `0 0 8px ${getGroupColor($type)}`};
  }
`;

export const SuggestionButton = styled.button`
  width: 100%;
  min-width: 0;
  padding: 7px 8px;
  border: 0;
  border-radius: 3px;
  background: transparent;
  color: var(--whitesmoke);
  font-size: 13px;
  line-height: 1.25;
  text-align: left;
  overflow-wrap: anywhere;

  &:hover,
  &:focus-visible {
    outline: none;
    background: rgba(0, 212, 255, 0.12);
  }

  @media (max-width: 768px) {
    padding: 6px;
    font-size: 12px;
  }
`;

export const SuggestionStatus = styled.p<{ $error?: boolean }>`
  margin: 0;
  padding: 10px;
  color: ${({ $error }) => ($error ? 'var(--clearneonPink)' : 'var(--clearneonYellow)')} !important;
  font-size: 12px;
  line-height: 1.4;
  overflow-wrap: anywhere;
`;
