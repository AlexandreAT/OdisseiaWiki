import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiHome, BiSearch, BiChevronUp } from 'react-icons/bi';
import { WikiHeaderProps } from './types';
import {
  WikiHeaderWrapper,
  HomeButton,
  SearchInputWrapper,
  SearchInput,
  SearchIcon,
  ToggleHeaderButton,
} from './WikiHeader.style';

interface WikiHeaderInternalProps extends WikiHeaderProps {
  onToggle?: (expanded: boolean) => void;
  isExpanded?: boolean;
}

export const WikiHeader: React.FC<WikiHeaderInternalProps> = ({ onSearch, onToggle, isExpanded = true }) => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleHomeClick = () => {
    navigate('/wiki/MainPage');
    setSearchValue('');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue);
      setSearchValue('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e as any);
    } else if (e.key === 'Escape') {
      setSearchValue('');
      inputRef.current?.blur();
    }
  };

  const handleToggleHeader = () => {
    const newState = !isExpanded;
    if (onToggle) {
      onToggle(newState);
    }
  };

  return (
    <>
        <WikiHeaderWrapper $isExpanded={isExpanded}>
        <HomeButton
            onClick={handleHomeClick}
            title="Voltar para página inicial da Wiki"
        >
            <BiHome />
        </HomeButton>

        <form onSubmit={handleSearchSubmit} style={{ flex: 1, maxWidth: '400px' }}>
            <SearchInputWrapper>
            <SearchIcon>
                <BiSearch />
            </SearchIcon>

            <SearchInput
                ref={inputRef}
                type="text"
                placeholder="Buscar páginas..."
                value={searchValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
            />
            </SearchInputWrapper>
        </form>
        </WikiHeaderWrapper>

        <ToggleHeaderButton
        onClick={handleToggleHeader}
        title={isExpanded ? 'Esconder header' : 'Mostrar header'}
        $isExpanded={isExpanded}
        >
        <BiChevronUp />
        </ToggleHeaderButton>
    </>
    );
};
