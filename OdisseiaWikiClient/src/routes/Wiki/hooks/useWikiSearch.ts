import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getPages, searchPages } from '../../../services/pageService';
import { getPersonagens } from '../../../services/personagensService';
import { getCidades } from '../../../services/cidadesService';
import { getRacas } from '../../../services/racasService';
import { getItens } from '../../../services/itensService';
import { ServiceRequestOptions } from '../../../services/serviceRequestOptions';
import { getRankedSuggestions } from '../../../utils/searchSuggestions';
import {
  createEmptyWikiSearchGroups,
  WikiSearchEntityType,
  WikiSearchGroups,
  WikiSearchItem,
  WikiSearchState,
  WIKI_SEARCH_GROUP_LABELS,
  WIKI_SEARCH_GROUP_ORDER,
} from '../types';

const SEARCH_REQUEST_TIMEOUT_MS = 10_000;

const getPlainDescription = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmedValue = value.trim();
  if (!trimmedValue || trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) return undefined;
  return trimmedValue;
};

const getStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value !== 'string' || !value.trim()) return [];

  try {
    const parsedValue: unknown = JSON.parse(value);
    if (Array.isArray(parsedValue)) {
      return parsedValue.map(String).map((item) => item.trim()).filter(Boolean);
    }
  } catch {
    // Some legacy responses contain a single plain-text tag instead of JSON.
  }

  return [value.trim()];
};

const rankGroup = (items: WikiSearchItem[], query: string, maximum = Number.POSITIVE_INFINITY) => (
  getRankedSuggestions(
    items,
    query,
    maximum,
    (item) => [item.title, ...(item.searchTerms ?? [])].join(' '),
  )
);

const getFailureMessage = (failedGroups: WikiSearchEntityType[]) => {
  if (failedGroups.length === 0) return null;
  const labels = failedGroups.map((group) => WIKI_SEARCH_GROUP_LABELS[group]).join(', ');
  return `Algumas categorias não puderam ser carregadas: ${labels}.`;
};

const createRequestOptions = (signal: AbortSignal): ServiceRequestOptions => ({
  signal,
  timeout: SEARCH_REQUEST_TIMEOUT_MS,
});

export const useWikiSearch = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const catalogRequestId = useRef(0);
  const searchRequestId = useRef(0);
  const [catalog, setCatalog] = useState<WikiSearchGroups>(createEmptyWikiSearchGroups);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogWarning, setCatalogWarning] = useState<string | null>(null);
  const [catalogFailedGroups, setCatalogFailedGroups] = useState<WikiSearchEntityType[]>([]);
  const [state, setState] = useState<WikiSearchState>({
    query: '',
    results: createEmptyWikiSearchGroups(),
    loading: false,
    error: null,
    warning: null,
  });

  const query = searchParams.get('q') || '';
  const selectedGroupParam = searchParams.get('type');
  const selectedGroup = WIKI_SEARCH_GROUP_ORDER.find((group) => group === selectedGroupParam) ?? null;

  useEffect(() => {
    const controller = new AbortController();
    const currentRequestId = ++catalogRequestId.current;
    let active = true;

    const loadCatalog = async () => {
      setCatalogLoading(true);
      setCatalogError(null);
      setCatalogWarning(null);

      try {
        const requestOptions = createRequestOptions(controller.signal);
        const [pagesResult, charactersResult, citiesResult, racesResult, itemsResult] = await Promise.allSettled([
          getPages(true, requestOptions),
          getPersonagens(true, requestOptions),
          getCidades(true, requestOptions),
          getRacas(true, undefined, requestOptions),
          getItens(requestOptions),
        ]);

        if (!active || currentRequestId !== catalogRequestId.current) return;

        const failedGroups: WikiSearchEntityType[] = [];

        const pages = pagesResult.status === 'fulfilled'
          && pagesResult.value.sucesso !== false
          && Array.isArray(pagesResult.value.pages)
          ? pagesResult.value.pages
          : (failedGroups.push('pages'), []);

        const characters = charactersResult.status === 'fulfilled'
          && Array.isArray(charactersResult.value)
          ? charactersResult.value
          : (failedGroups.push('characters'), []);

        const cities = citiesResult.status === 'fulfilled'
          && citiesResult.value.sucesso !== false
          && Array.isArray(citiesResult.value.cidades)
          ? citiesResult.value.cidades
          : (failedGroups.push('cities'), []);

        const races = racesResult.status === 'fulfilled'
          && racesResult.value.sucesso !== false
          && Array.isArray(racesResult.value.racas)
          ? racesResult.value.racas
          : (failedGroups.push('races'), []);

        const items = itemsResult.status === 'fulfilled'
          && Array.isArray(itemsResult.value)
          ? itemsResult.value.filter((item) => item.visivel !== false)
          : (failedGroups.push('items'), []);

        setCatalog({
          pages: pages.map((page) => ({
            id: String(page.idPage ?? page.slug),
            type: 'pages' as const,
            title: String(page.titulo ?? '').trim(),
            description: getPlainDescription(page.descricao),
            image: page.coverImage,
            createdAt: page.dataCriacao,
            route: `/wiki/${encodeURIComponent(page.slug)}`,
            searchTerms: [],
          })).filter((page) => page.title && page.id),
          characters: characters.map((character) => {
            const tags = getStringList(character.tags);
            return {
              id: String(character.idpersonagem),
              type: 'characters' as const,
              title: String(character.nome ?? '').trim(),
              description: tags.join(', ') || undefined,
              image: character.imagem,
              createdAt: character.dataCriacao,
              route: `/personagem/${character.idpersonagem}`,
              searchTerms: tags,
            };
          }).filter((character) => character.title && character.id),
          cities: cities.map((city) => {
            const tags = getStringList(city.tags);
            return {
              id: String(city.idcidade),
              type: 'cities' as const,
              title: String(city.nome ?? '').trim(),
              description: getPlainDescription(city.descricao) ?? (tags.join(', ') || undefined),
              image: city.imagem,
              createdAt: city.dataCriacao,
              route: `/cidade/${city.idcidade}`,
              searchTerms: tags,
            };
          }).filter((city) => city.title && city.id),
          races: races.map((race) => {
            const tags = getStringList(race.tags);
            return {
              id: String(race.idraca),
              type: 'races' as const,
              title: String(race.nome ?? '').trim(),
              description: tags.join(', ') || undefined,
              image: race.imagem,
              createdAt: race.dataCriacao,
              route: `/raca/${race.idraca}`,
              searchTerms: tags,
            };
          }).filter((race) => race.title && race.id),
          items: items.flatMap((item) => {
            if (!item.iditem) return [];
            const tags = getStringList(item.tags);
            return [{
              id: String(item.iditem),
              type: 'items' as const,
              title: String(item.nome ?? '').trim(),
              description: getPlainDescription(item.descricao) ?? item.tipo,
              image: item.imagem,
              createdAt: item.dataCriacao,
              route: `/item/${item.iditem}`,
              searchTerms: tags,
            }];
          }).filter((item) => item.title),
        });

        setCatalogFailedGroups(failedGroups);
        setCatalogWarning(failedGroups.length < WIKI_SEARCH_GROUP_ORDER.length
          ? getFailureMessage(failedGroups)
          : null);
        setCatalogError(failedGroups.length === WIKI_SEARCH_GROUP_ORDER.length
          ? 'Não foi possível carregar as entidades da Wiki.'
          : null);
      } catch {
        if (!active || currentRequestId !== catalogRequestId.current) return;
        setCatalog(createEmptyWikiSearchGroups());
        setCatalogFailedGroups([...WIKI_SEARCH_GROUP_ORDER]);
        setCatalogWarning(null);
        setCatalogError('Não foi possível carregar as entidades da Wiki.');
      } finally {
        if (active && currentRequestId === catalogRequestId.current) {
          setCatalogLoading(false);
        }
      }
    };

    loadCatalog();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!query && !selectedGroup) {
      searchRequestId.current += 1;
      setState({
        query: '',
        results: createEmptyWikiSearchGroups(),
        loading: false,
        error: null,
        warning: null,
      });
      return;
    }

    if (catalogLoading) {
      setState((previous) => ({
        ...previous,
        query,
        loading: true,
        error: null,
        warning: null,
      }));
      return;
    }

    if (selectedGroup) {
      searchRequestId.current += 1;
      const results = createEmptyWikiSearchGroups();
      results[selectedGroup] = rankGroup(catalog[selectedGroup], '');
      const groupFailed = catalogFailedGroups.includes(selectedGroup);

      setState({
        query: '',
        results,
        loading: false,
        error: groupFailed
          ? `Não foi possível carregar ${WIKI_SEARCH_GROUP_LABELS[selectedGroup].toLowerCase()}.`
          : null,
        warning: null,
      });
      return;
    }

    const controller = new AbortController();
    const currentRequestId = ++searchRequestId.current;
    let active = true;

    const performSearch = async () => {
      setState((previous) => ({
        ...previous,
        query,
        loading: true,
        error: null,
        warning: null,
      }));

      const nextResults: WikiSearchGroups = {
        pages: rankGroup(catalog.pages, query),
        characters: rankGroup(catalog.characters, query),
        cities: rankGroup(catalog.cities, query),
        races: rankGroup(catalog.races, query),
        items: rankGroup(catalog.items, query),
      };
      let pageSearchSucceeded = false;
      let pageSearchFailed = false;

      try {
        const response = await searchPages(query, createRequestOptions(controller.signal));
        if (!response.sucesso || !Array.isArray(response.pages)) {
          throw new Error(response.mensagemErro || 'Resposta inválida na busca de páginas.');
        }

        nextResults.pages = rankGroup(response.pages.map((page) => {
          const id = String(page.idPage ?? page.slug);
          const catalogPage = catalog.pages.find((item) => item.id === id);

          return {
            id,
            type: 'pages' as const,
            title: String(page.titulo ?? '').trim(),
            description: getPlainDescription(page.descricao),
            image: page.coverImage,
            createdAt: catalogPage?.createdAt,
            route: `/wiki/${encodeURIComponent(page.slug)}`,
            searchTerms: [],
          };
        }).filter((page) => page.title && page.id), query);
        pageSearchSucceeded = true;
      } catch {
        pageSearchFailed = true;
      } finally {
        if (active && currentRequestId === searchRequestId.current) {
          const unavailableGroups = catalogFailedGroups.filter((group) => (
            group !== 'pages' || !pageSearchSucceeded
          ));
          const availableGroups = WIKI_SEARCH_GROUP_ORDER.filter((group) => (
            !unavailableGroups.includes(group)
            || (group === 'pages' && pageSearchSucceeded)
          ));
          const warningParts: string[] = [];
          const failureMessage = getFailureMessage(unavailableGroups);

          if (failureMessage) warningParts.push(failureMessage);
          if (pageSearchFailed && !catalogFailedGroups.includes('pages')) {
            warningParts.push('A busca de páginas falhou; os resultados locais foram mantidos.');
          }

          setState({
            query,
            results: nextResults,
            loading: false,
            error: availableGroups.length === 0
              ? 'Não foi possível concluir a busca. Tente novamente.'
              : null,
            warning: warningParts.length > 0 ? warningParts.join(' ') : null,
          });
        }
      }
    };

    performSearch();

    return () => {
      active = false;
      controller.abort();
    };
  }, [catalog, catalogFailedGroups, catalogLoading, query, selectedGroup]);

  const getSuggestionGroups = useCallback((searchQuery: string): WikiSearchGroups => {
    const groups = createEmptyWikiSearchGroups();
    WIKI_SEARCH_GROUP_ORDER.forEach((group) => {
      groups[group] = rankGroup(catalog[group], searchQuery, 3);
    });
    return groups;
  }, [catalog]);

  const handleSearch = useCallback((searchQuery: string) => {
    const normalizedQuery = searchQuery.trim();
    navigate(normalizedQuery ? `/wiki/search?q=${encodeURIComponent(normalizedQuery)}` : '/wiki/MainPage');
  }, [navigate]);

  const handleGroupSelect = useCallback((group: WikiSearchEntityType) => {
    navigate(`/wiki/search?type=${encodeURIComponent(group)}`);
  }, [navigate]);

  const handleResultSelect = useCallback((item: WikiSearchItem) => {
    const isUnimplementedEntity = ['cities', 'races', 'items'].includes(item.type);

    navigate(item.route, isUnimplementedEntity ? {
      state: {
        errorTitle: 'Página ainda não disponível',
        errorDescription: `A página dinâmica de ${item.title} ainda está em desenvolvimento.`,
      },
    } : undefined);
  }, [navigate]);

  return {
    ...state,
    catalogLoading,
    catalogError,
    catalogWarning,
    getSuggestionGroups,
    handleSearch,
    handleGroupSelect,
    handleResultSelect,
    isSearching: query.length > 0 || selectedGroup !== null,
  };
};
