import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import backgroundAnimation from '../../assets/backgroundLinesScifiAnimation.mp4';
import { LoadingIndicator } from '../../components/Generic/LoadingIndicator/LoadingIndicator';
import { getRankedSuggestions } from '../../utils/searchSuggestions';
import {
  isWikiGraphIdentifiedNode,
  isWikiGraphVisibleNode,
  WikiGraphEntityType,
  WikiGraphIdentifiedNode,
  WikiGraphLayoutMode,
  WikiGraphVisibleNode,
} from '../../models/WikiGraph';
import { WikiHeader } from '../Wiki/components/WikiHeader';
import { useWikiSearch } from '../Wiki/hooks';
import { GraphCanvas, GraphCanvasHandle } from './components/GraphCanvas/GraphCanvas';
import { GraphStatsPanel } from './components/GraphStatsPanel/GraphStatsPanel';
import { GraphToolbar } from './components/GraphToolbar/GraphToolbar';
import { useWikiGraph } from './useWikiGraph';
import {
  AssistiveInstructions,
  GraphBackground,
  GraphBody,
  GraphPageRoot,
  GraphStage,
  GraphState,
} from './WikiGraphPage.style';

interface RootState {
  themesReducer: {
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
  };
}

const SEARCH_DEBOUNCE_MS = 220;

const WikiGraphPage = () => {
  const navigate = useNavigate();
  const { neon } = useSelector((state: RootState) => state.themesReducer);
  const [headerExpanded, setHeaderExpanded] = useState(true);
  const [activeTypes, setActiveTypes] = useState<Set<WikiGraphEntityType>>(() => new Set());
  const [layoutMode, setLayoutMode] = useState<WikiGraphLayoutMode>('free');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const graphCanvasRef = useRef<GraphCanvasHandle>(null);
  const searchBlurTimerRef = useRef<number | null>(null);
  const { graph, loading, error, retry } = useWikiGraph();
  const {
    catalogLoading,
    catalogError,
    catalogWarning,
    getSuggestionGroups,
    handleSearch,
    handleGroupSelect,
    handleResultSelect,
  } = useWikiSearch();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => () => {
    if (searchBlurTimerRef.current !== null) window.clearTimeout(searchBlurTimerRef.current);
  }, []);

  const identifiedNodes = useMemo(
    () => graph?.nodes.filter(isWikiGraphIdentifiedNode) ?? [],
    [graph],
  );

  const searchResults = useMemo(() => getRankedSuggestions(
    identifiedNodes,
    debouncedQuery,
    8,
    (node) => node.title,
  ), [debouncedQuery, identifiedNodes]);

  const centralNode = useMemo<WikiGraphVisibleNode | null>(() => {
    if (!graph?.centralNodeId) return null;
    const node = graph.nodes.find((candidate) => candidate.graphId === graph.centralNodeId);
    return node && isWikiGraphVisibleNode(node) ? node : null;
  }, [graph]);

  const toggleType = useCallback((type: WikiGraphEntityType) => {
    setActiveTypes((current) => {
      const next = new Set(current);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const selectSearchResult = useCallback((node: WikiGraphIdentifiedNode) => {
    setQuery(node.title);
    setSearchOpen(false);
    graphCanvasRef.current?.focusNode(node.graphId);
  }, []);

  const navigateToNode = useCallback((route: string) => navigate(route), [navigate]);

  return (
    <GraphPageRoot>
      <GraphBackground aria-hidden="true">
        <video autoPlay muted loop playsInline preload="metadata">
          <source src={backgroundAnimation} type="video/mp4" />
        </video>
      </GraphBackground>

      <WikiHeader
        onSearch={handleSearch}
        getSuggestionGroups={getSuggestionGroups}
        onSuggestionSelect={handleResultSelect}
        onGroupSelect={handleGroupSelect}
        suggestionsLoading={catalogLoading}
        suggestionsError={catalogError}
        suggestionsWarning={catalogWarning}
        onToggle={setHeaderExpanded}
        isExpanded={headerExpanded}
      />

      <GraphBody>
        <GraphToolbar
          activeTypes={activeTypes}
          query={query}
          results={searchResults}
          searchPending={query.trim() !== debouncedQuery}
          searchOpen={searchOpen}
          neon={neon === 'on'}
          layoutMode={layoutMode}
          onToggleType={toggleType}
          onQueryChange={setQuery}
          onSearchFocus={() => {
            if (searchBlurTimerRef.current !== null) {
              window.clearTimeout(searchBlurTimerRef.current);
              searchBlurTimerRef.current = null;
            }
            setSearchOpen(true);
          }}
          onSearchBlur={() => {
            if (searchBlurTimerRef.current !== null) window.clearTimeout(searchBlurTimerRef.current);
            searchBlurTimerRef.current = window.setTimeout(() => setSearchOpen(false), 120);
          }}
          onSearchDismiss={() => setSearchOpen(false)}
          onSelectResult={selectSearchResult}
          onLayoutModeChange={setLayoutMode}
          onCentralize={() => graphCanvasRef.current?.centralize()}
        />

        <GraphStage>
          <AssistiveInstructions>
            Use a roda do mouse ou o gesto de pinça para aproximar. Arraste o fundo para navegar e
            selecione uma entidade visível para abrir sua página.
          </AssistiveInstructions>

          {loading && (
            <GraphState aria-live="polite">
              <LoadingIndicator label="Carregando conexões" />
            </GraphState>
          )}

          {!loading && error && (
            <GraphState role="alert">
              <div>
                <p>{error}</p>
                <button type="button" onClick={retry}>Tentar novamente</button>
              </div>
            </GraphState>
          )}

          {!loading && !error && graph && graph.nodes.length === 0 && (
            <GraphState>
              <p>Ainda não existem entidades conectadas para montar a Teia de Conexões.</p>
            </GraphState>
          )}

          {!loading && !error && graph && graph.nodes.length > 0 && (
            <>
              <GraphCanvas
                ref={graphCanvasRef}
                graph={graph}
                activeTypes={activeTypes}
                neon={neon === 'on'}
                layoutMode={layoutMode}
                onNavigate={navigateToNode}
              />
              <GraphStatsPanel
                stats={graph.stats}
                centralNode={centralNode}
                neon={neon === 'on'}
              />
            </>
          )}
        </GraphStage>
      </GraphBody>
    </GraphPageRoot>
  );
};

export default WikiGraphPage;
