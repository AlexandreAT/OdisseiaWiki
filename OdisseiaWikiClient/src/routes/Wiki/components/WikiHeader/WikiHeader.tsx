import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { BiHome, BiSearch, BiChevronUp, BiNetworkChart } from 'react-icons/bi';
import { WikiHeaderProps } from './types';
import {
  WikiHeaderWrapper,
  HomeButton,
  SearchInputWrapper,
  SearchInput,
  SearchIcon,
  ToggleHeaderButton,
  DivController,
  SearchForm,
  AutocompleteDropdown,
  SuggestionGroup,
  SuggestionGroupTitle,
  SuggestionButton,
  SuggestionStatus,
  ConnectionsButton,
  ConnectionsLabel,
  MesaScopeFilter,
  MesaScopeDescription,
  MesaScopeLabel,
  MesaScopeSwitch,
} from './WikiHeader.style';
import { WIKI_SEARCH_GROUP_LABELS, WIKI_SEARCH_GROUP_ORDER, WikiSearchItem } from '../../types';
import { WikiSearchLoading } from '../WikiSearchLoading';
import { getMesaWikiRoute } from '../../../../services/wikiContext';
import { ContentVisibilityNotice } from '../../../../components/Generic/ContentVisibilityNotice/ContentVisibilityNotice';

interface WikiHeaderInternalProps extends WikiHeaderProps {
  onToggle?: (expanded: boolean) => void;
  isExpanded?: boolean;
}

export const WikiHeader: React.FC<WikiHeaderInternalProps> = ({
  onSearch,
  getSuggestionGroups,
  onSuggestionSelect,
  onGroupSelect,
  suggestionsLoading = false,
  suggestionsError = null,
  suggestionsWarning = null,
  showMesaScopeFilter = false,
  pesquisarSomenteMesa = true,
  onPesquisarSomenteMesaChange,
  onToggle,
  isExpanded = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, neon } = useSelector((state: any) => state.themesReducer);
  const [searchValue, setSearchValue] = useState('');
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const suggestionGroups = useMemo(
    () => getSuggestionGroups(searchValue),
    [getSuggestionGroups, searchValue],
  );
  const hasSuggestions = WIKI_SEARCH_GROUP_ORDER.some((group) => suggestionGroups[group].length > 0);
  const canShowDropdown = showMesaScopeFilter
    || suggestionsLoading
    || Boolean(suggestionsError)
    || Boolean(suggestionsWarning)
    || hasSuggestions;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!formRef.current?.contains(event.target as Node)) setSuggestionsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHomeClick = () => {
    navigate(getMesaWikiRoute('/wiki'));
    setSearchValue('');
    setSuggestionsOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue);
      setSearchValue('');
      setSuggestionsOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    setSuggestionsOpen(true);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e as any);
    } else if (e.key === 'Escape') {
      setSearchValue('');
      setSuggestionsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (item: WikiSearchItem) => {
    setSearchValue('');
    setSuggestionsOpen(false);
    onSuggestionSelect(item);
  };

  const handleGroupClick = (group: WikiSearchItem['type']) => {
    setSearchValue('');
    setSuggestionsOpen(false);
    onGroupSelect(group);
  };

  const handleToggleHeader = () => {
    const newState = !isExpanded;
    if (onToggle) {
      onToggle(newState);
    }
  };

  return (
    <DivController data-wiki-header>
        <WikiHeaderWrapper $isExpanded={isExpanded}>
        <HomeButton
            onClick={handleHomeClick}
            title="Voltar para página inicial da Wiki"
        >
            <BiHome />
        </HomeButton>

        <SearchForm ref={formRef} onSubmit={handleSearchSubmit}>
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
                onFocus={() => setSuggestionsOpen(true)}
            />
            </SearchInputWrapper>

            {suggestionsOpen && canShowDropdown && (
              <AutocompleteDropdown $isDark={theme === 'dark'}>
                {showMesaScopeFilter && (
                  <MesaScopeFilter>
                    <MesaScopeLabel htmlFor="wiki-search-mesa-scope">
                      <span>Pesquisar apenas nesta Mesa</span>
                      <MesaScopeDescription>
                        Desative para incluir a Wiki geral.
                      </MesaScopeDescription>
                    </MesaScopeLabel>
                    <MesaScopeSwitch
                      id="wiki-search-mesa-scope"
                      checked={pesquisarSomenteMesa}
                      onChange={(event) => onPesquisarSomenteMesaChange?.(event.target.checked)}
                      aria-label="Pesquisar apenas nesta Mesa"
                    />
                  </MesaScopeFilter>
                )}
                {suggestionsLoading && <WikiSearchLoading compact />}
                {!suggestionsLoading && suggestionsError && (
                  <SuggestionStatus $error>{suggestionsError}</SuggestionStatus>
                )}
                {!suggestionsLoading && suggestionsWarning && (
                  <SuggestionStatus>{suggestionsWarning}</SuggestionStatus>
                )}
                {!suggestionsLoading && WIKI_SEARCH_GROUP_ORDER.map((group) => {
                  const items = suggestionGroups[group];
                  if (items.length === 0) return null;

                  return (
                    <SuggestionGroup key={group}>
                      <SuggestionGroupTitle
                        type="button"
                        $type={group}
                        $neon={neon === 'on'}
                        onClick={() => handleGroupClick(group)}
                        title={`Ver todos em ${WIKI_SEARCH_GROUP_LABELS[group]}`}
                      >
                        {WIKI_SEARCH_GROUP_LABELS[group]}
                      </SuggestionGroupTitle>
                      {items.map((item) => (
                        <SuggestionButton
                          key={`${item.type}-${item.id}`}
                          type="button"
                          onClick={() => handleSuggestionClick(item)}
                        >
                          {item.title}
                          <ContentVisibilityNotice visible={item.visivel} />
                        </SuggestionButton>
                      ))}
                    </SuggestionGroup>
                  );
                })}
              </AutocompleteDropdown>
            )}
        </SearchForm>

        <ConnectionsButton
          type="button"
          $active={location.pathname === getMesaWikiRoute('/wiki/conexoes')}
          $neon={neon === 'on'}
          onClick={() => navigate(getMesaWikiRoute('/wiki/conexoes'))}
          title="Abrir a Teia de Conexões"
          aria-label="Abrir a Teia de Conexões"
          aria-current={location.pathname === getMesaWikiRoute('/wiki/conexoes') ? 'page' : undefined}
        >
          <BiNetworkChart aria-hidden="true" />
          <ConnectionsLabel>Teia de conexões</ConnectionsLabel>
        </ConnectionsButton>
        </WikiHeaderWrapper>

        <ToggleHeaderButton
        onClick={handleToggleHeader}
        title={isExpanded ? 'Esconder header' : 'Mostrar header'}
        $isExpanded={isExpanded}
        >
        <BiChevronUp />
        </ToggleHeaderButton>
    </DivController>
    );
};
