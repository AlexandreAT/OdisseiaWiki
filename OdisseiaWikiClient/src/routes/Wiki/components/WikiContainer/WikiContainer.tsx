import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { WikiContainerProps } from './types';
import {
  WikiContainerWrapper,
  WikiContentArea,
  WikiMainSection,
  ErrorContainer,
  LoadingContainer,
  SearchWarning,
} from './WikiContainer.style';
import { WikiHeader } from '../WikiHeader';
import { WikiSidebar } from '../WikiSidebar';
import { WikiContent } from '../WikiContent';
import { WikiSearchResults } from '../WikiSearchResults';
import { usePageContent, useWikiSearch } from '../../hooks';
import { WikiSearchLoading } from '../WikiSearchLoading';

export const WikiContainer: React.FC<WikiContainerProps> = () => {
  const { theme, neon } = useSelector((state: any) => state.themesReducer);
  const [searchParams] = useSearchParams();
  const [sidebarExpanded, setSidebarExpanded] = useState(() => (
    typeof window === 'undefined' || window.innerWidth > 768
  ));
  const [headerExpanded, setHeaderExpanded] = useState(true);
  
  const isDark = theme === 'dark';
  const isSearching = searchParams.has('q') || searchParams.has('type');
  
  const { page, loading: pageLoading, error: pageError } = usePageContent();
  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    warning: searchWarning,
    catalogLoading,
    catalogError,
    catalogWarning,
    getSuggestionGroups,
    handleSearch,
    handleGroupSelect,
    handleResultSelect,
  } = useWikiSearch();

  const handleSidebarToggle = (expanded: boolean) => {
    setSidebarExpanded(expanded);
  };

  const handleHeaderToggle = (expanded: boolean) => {
    setHeaderExpanded(expanded);
  };

  useEffect(() => {
    const collapseMobileSidebar = () => {
      if (window.innerWidth <= 768) setSidebarExpanded(false);
    };

    window.addEventListener('resize', collapseMobileSidebar);
    return () => window.removeEventListener('resize', collapseMobileSidebar);
  }, []);

  return (
    <WikiContainerWrapper $isDark={isDark}>
      <WikiHeader
        onSearch={handleSearch}
        getSuggestionGroups={getSuggestionGroups}
        onSuggestionSelect={handleResultSelect}
        onGroupSelect={handleGroupSelect}
        suggestionsLoading={catalogLoading}
        suggestionsError={catalogError}
        suggestionsWarning={catalogWarning}
        onToggle={handleHeaderToggle}
        isExpanded={headerExpanded}
      />
      
      <WikiContentArea $isDark={isDark}>
        {!isSearching && <WikiSidebar page={page} onToggle={handleSidebarToggle} headerExpanded={headerExpanded} sidebarExpanded={sidebarExpanded} />}
        
        <WikiMainSection $isDark={isDark} $sidebarExpanded={!isSearching && sidebarExpanded} $headerExpanded={headerExpanded}>
          {isSearching ? (
            <>
              {searchLoading && (
                <LoadingContainer $isDark={isDark}>
                  <WikiSearchLoading />
                </LoadingContainer>
              )}
              {!searchLoading && searchError && (
                <ErrorContainer $isDark={isDark}>
                  <p>{searchError}</p>
                </ErrorContainer>
              )}
              {!searchLoading && !searchError && (
                <>
                  {searchWarning && <SearchWarning role="status">{searchWarning}</SearchWarning>}
                  <WikiSearchResults
                    results={searchResults}
                    theme={theme}
                    neon={neon}
                    onResultSelect={handleResultSelect}
                  />
                </>
              )}
            </>
          ) : (
            <>
              {pageLoading && (
                <LoadingContainer $isDark={isDark}>
                  <WikiSearchLoading label="Carregando página" />
                </LoadingContainer>
              )}
              {pageError && (
                <ErrorContainer $isDark={isDark}>
                  <p>Erro: {pageError}</p>
                </ErrorContainer>
              )}
              {!pageLoading && !pageError && page && (
                <WikiContent page={page} headerExpanded={headerExpanded} />
              )}
            </>
          )}
        </WikiMainSection>
      </WikiContentArea>
    </WikiContainerWrapper>
  );
};
