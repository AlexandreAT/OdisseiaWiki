import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import { WikiContainerProps } from './types';
import {
  WikiContainerWrapper,
  WikiContentArea,
  WikiMainSection,
  ErrorContainer,
  LoadingContainer,
  SearchWarning,
  EmptyWikiState,
} from './WikiContainer.style';
import { WikiHeader } from '../WikiHeader';
import { WikiSidebar } from '../WikiSidebar';
import { WikiContent } from '../WikiContent';
import { WikiSearchResults } from '../WikiSearchResults';
import { usePageContent, useWikiSearch } from '../../hooks';
import { WikiSearchLoading } from '../WikiSearchLoading';
import { useApiAvailabilityStatus } from '../../../../hooks/useApiAvailabilityStatus';
import { getMesaWikiIdFromPath } from '../../../../services/wikiContext';

interface RootState {
  themesReducer: {
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
  };
}

export const WikiContainer: React.FC<WikiContainerProps> = () => {
  const { theme, neon } = useSelector((state: RootState) => state.themesReducer);
  const [searchParams] = useSearchParams();
  const { slug } = useParams<{ slug?: string }>();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [headerExpanded, setHeaderExpanded] = useState(true);
  const apiAvailabilityStatus = useApiAvailabilityStatus();
  
  const isDark = theme === 'dark';
  const isSearching = searchParams.has('q') || searchParams.has('type');
  const isMesaWikiRoot = getMesaWikiIdFromPath() !== null && !slug && !isSearching;
  
  const { page, loading: pageLoading, error: pageError } = usePageContent();
  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    warning: searchWarning,
    catalogLoading,
    catalogError,
    catalogWarning,
    catalog,
    getSuggestionGroups,
    handleSearch,
    handleGroupSelect,
    handleResultSelect,
    isMesaWiki,
    pesquisarSomenteMesa,
    setPesquisarSomenteMesa,
  } = useWikiSearch();
  const hasPublishedMesaContent = Object.values(catalog).some((entries) => entries.length > 0);

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
        showMesaScopeFilter={isMesaWiki}
        pesquisarSomenteMesa={pesquisarSomenteMesa}
        onPesquisarSomenteMesaChange={setPesquisarSomenteMesa}
        onToggle={handleHeaderToggle}
        isExpanded={headerExpanded}
      />
      
      <WikiContentArea $isDark={isDark}>
        {!isSearching && !isMesaWikiRoot && <WikiSidebar page={page} onToggle={handleSidebarToggle} headerExpanded={headerExpanded} sidebarExpanded={sidebarExpanded} />}
        
        <WikiMainSection $isDark={isDark} $sidebarExpanded={!isSearching && sidebarExpanded} $headerExpanded={headerExpanded}>
          {isMesaWikiRoot ? (
            <>
              {catalogLoading && apiAvailabilityStatus === 'idle' && (
                <LoadingContainer $isDark={isDark}>
                  <WikiSearchLoading label="Carregando Wiki da Mesa" />
                </LoadingContainer>
              )}
              {!catalogLoading && catalogError && (
                <ErrorContainer $isDark={isDark}>
                  <p>{catalogError}</p>
                </ErrorContainer>
              )}
              {!catalogLoading && !catalogError && (
                <EmptyWikiState $isDark={isDark}>
                  <h2>{hasPublishedMesaContent ? 'Wiki da Mesa' : 'Esta Mesa ainda não possui conteúdo publicado.'}</h2>
                  <p>{hasPublishedMesaContent
                    ? 'Use a busca para explorar os conteúdos disponíveis nesta campanha.'
                    : 'Quando o mestre publicar conteúdos para a campanha, eles aparecerão aqui.'}
                  </p>
                </EmptyWikiState>
              )}
            </>
          ) : isSearching ? (
            <>
              {searchLoading && apiAvailabilityStatus === 'idle' && (
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
              {pageLoading && apiAvailabilityStatus === 'idle' && (
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
