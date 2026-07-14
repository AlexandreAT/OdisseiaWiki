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
} from './WikiContainer.style';
import { WikiHeader } from '../WikiHeader';
import { WikiSidebar } from '../WikiSidebar';
import { WikiContent } from '../WikiContent';
import { WikiSearchResults } from '../WikiSearchResults';
import { usePageContent, useWikiSearch } from '../../hooks';

export const WikiContainer: React.FC<WikiContainerProps> = () => {
  const { theme } = useSelector((state: any) => state.themesReducer);
  const [searchParams] = useSearchParams();
  const [sidebarExpanded, setSidebarExpanded] = useState(() => (
    typeof window === 'undefined' || window.innerWidth > 768
  ));
  const [headerExpanded, setHeaderExpanded] = useState(true);
  
  const isDark = theme === 'dark';
  const isSearching = searchParams.has('q');
  
  const { page, loading: pageLoading, error: pageError } = usePageContent();
  const { results: searchResults, loading: searchLoading, error: searchError, handleSearch } = useWikiSearch();

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
      <WikiHeader onSearch={handleSearch} onToggle={handleHeaderToggle} isExpanded={headerExpanded} />
      
      <WikiContentArea $isDark={isDark}>
        {!isSearching && <WikiSidebar page={page} onToggle={handleSidebarToggle} headerExpanded={headerExpanded} sidebarExpanded={sidebarExpanded} />}
        
        <WikiMainSection $isDark={isDark} $sidebarExpanded={!isSearching && sidebarExpanded} $headerExpanded={headerExpanded}>
          {isSearching ? (
            <>
              {searchLoading && (
                <LoadingContainer $isDark={isDark}>
                  <p>Buscando páginas...</p>
                </LoadingContainer>
              )}
              {searchError && (
                <ErrorContainer $isDark={isDark}>
                  <p>Erro: {searchError}</p>
                </ErrorContainer>
              )}
              {!searchLoading && !searchError && (
                <WikiSearchResults results={searchResults} />
              )}
            </>
          ) : (
            <>
              {pageLoading && (
                <LoadingContainer $isDark={isDark}>
                  <p>Carregando página...</p>
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
