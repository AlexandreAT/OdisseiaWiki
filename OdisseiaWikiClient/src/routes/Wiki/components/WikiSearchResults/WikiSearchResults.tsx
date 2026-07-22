import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BiBookmark, BiChevronLeft, BiChevronRight, BiSortAlt2 } from 'react-icons/bi';
import { normalizeImagePath } from '../../utils/imagePathHelper';
import {
  WikiSearchItem,
  WikiSearchEntityType,
  WikiSearchSortOption,
  WIKI_SEARCH_GROUP_LABELS,
  WIKI_SEARCH_GROUP_ORDER,
  WIKI_SEARCH_PAGE_SIZES,
} from '../../types';
import { WikiSearchResultsProps } from './types';
import {
  SearchResultsContainer,
  SearchResultsHeader,
  SortControl,
  SortLabel,
  SortSelect,
  ResultCount,
  NoResultsMessage,
  SearchResultGroup,
  SearchResultGroupTitle,
  SearchResultsGrid,
  ResultCard,
  ResultCardImage,
  ResultCardContent,
  ResultCardTitle,
  ResultCardDescription,
  SearchResultFooter,
  PaginationButton,
  PaginationStatus,
} from './WikiSearchResults.style';

const createInitialPages = (): Record<WikiSearchEntityType, number> => ({
  pages: 1,
  characters: 1,
  cities: 1,
  races: 1,
  items: 1,
});

export const WikiSearchResults: React.FC<WikiSearchResultsProps> = ({
  results,
  theme,
  neon,
  onResultSelect,
}) => {
  const [searchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState<WikiSearchSortOption>('name');
  const [currentPages, setCurrentPages] = useState(createInitialPages);
  const query = searchParams.get('q') || '';
  const selectedGroupParam = searchParams.get('type');
  const selectedGroup = WIKI_SEARCH_GROUP_ORDER.find((group) => group === selectedGroupParam) ?? null;
  const totalResults = WIKI_SEARCH_GROUP_ORDER.reduce(
    (total, group) => total + results[group].length,
    0,
  );
  const sortedResults = useMemo(() => {
    const compareByName = (a: WikiSearchItem, b: WikiSearchItem) => (
      a.title.localeCompare(b.title, 'pt-BR', { numeric: true, sensitivity: 'base' })
    );
    const compareByDate = (a: WikiSearchItem, b: WikiSearchItem) => {
      const firstDate = a.createdAt ? Date.parse(a.createdAt) : Number.NaN;
      const secondDate = b.createdAt ? Date.parse(b.createdAt) : Number.NaN;
      const firstIsValid = Number.isFinite(firstDate);
      const secondIsValid = Number.isFinite(secondDate);

      if (firstIsValid && secondIsValid && firstDate !== secondDate) return secondDate - firstDate;
      if (firstIsValid !== secondIsValid) return firstIsValid ? -1 : 1;
      return compareByName(a, b);
    };

    return WIKI_SEARCH_GROUP_ORDER.reduce((groups, group) => {
      groups[group] = [...results[group]].sort(sortBy === 'createdAt' ? compareByDate : compareByName);
      return groups;
    }, {
      pages: [],
      characters: [],
      cities: [],
      races: [],
      items: [],
    } as typeof results);
  }, [results, sortBy]);

  useEffect(() => {
    setCurrentPages(createInitialPages());
  }, [query, results, selectedGroup, sortBy]);

  const changePage = (group: WikiSearchEntityType, page: number) => {
    setCurrentPages((current) => ({ ...current, [group]: page }));
    requestAnimationFrame(() => {
      document.getElementById(`wiki-results-${group}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  if (totalResults === 0) {
    return (
      <SearchResultsContainer>
        <SearchResultsHeader>
          <ResultCount>
            {selectedGroup
              ? `Nenhum registro encontrado em ${WIKI_SEARCH_GROUP_LABELS[selectedGroup]}`
              : `Nenhuma entidade encontrada para "${query}"`}
          </ResultCount>
        </SearchResultsHeader>
        <NoResultsMessage>
          <p>Tente ajustar seus termos de busca</p>
        </NoResultsMessage>
      </SearchResultsContainer>
    );
  }

  return (
    <SearchResultsContainer>
      <SearchResultsHeader>
        <ResultCount>
          {selectedGroup
            ? `${totalResults} registro${totalResults > 1 ? 's' : ''} em ${WIKI_SEARCH_GROUP_LABELS[selectedGroup]}`
            : `${totalResults} resultado${totalResults > 1 ? 's' : ''} encontrado${totalResults > 1 ? 's' : ''} para "${query}"`}
        </ResultCount>
        <SortControl>
          <SortLabel htmlFor="wiki-results-sort">
            <BiSortAlt2 aria-hidden="true" />
            Ordenar por
          </SortLabel>
          <SortSelect
            id="wiki-results-sort"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as WikiSearchSortOption)}
          >
            <option value="name">Nome (A–Z)</option>
            <option value="createdAt">Data de criação (recentes)</option>
          </SortSelect>
        </SortControl>
      </SearchResultsHeader>

      {WIKI_SEARCH_GROUP_ORDER.map((group) => {
        const groupResults = sortedResults[group];
        if (groupResults.length === 0) return null;
        const pageSize = WIKI_SEARCH_PAGE_SIZES[group];
        const totalPages = Math.ceil(groupResults.length / pageSize);
        const currentPage = Math.min(currentPages[group], totalPages);
        const pageStart = (currentPage - 1) * pageSize;
        const visibleResults = groupResults.slice(pageStart, pageStart + pageSize);

        return (
          <SearchResultGroup key={group} id={`wiki-results-${group}`}>
            <SearchResultGroupTitle $type={group} $neon={neon === 'on'}>
              {WIKI_SEARCH_GROUP_LABELS[group]}
              <span>{groupResults.length}</span>
            </SearchResultGroupTitle>

            <SearchResultsGrid $type={group}>
              {visibleResults.map((item) => (
                <ResultCard
                  key={`${item.type}-${item.id}`}
                  type="button"
                  $type={group}
                  $neon={neon === 'on'}
                  $isDark={theme === 'dark'}
                  onClick={() => onResultSelect(item)}
                >
                  <ResultCardImage
                    $type={group}
                    src={normalizeImagePath(item.image)}
                    alt={`Imagem de ${item.title}`}
                    fallbackIcon={<BiBookmark />}
                  />
                  <ResultCardContent $type={group}>
                    <ResultCardTitle>{item.title}</ResultCardTitle>
                    {item.description && <ResultCardDescription>{item.description}</ResultCardDescription>}
                  </ResultCardContent>
                </ResultCard>
              ))}
            </SearchResultsGrid>

            {totalPages > 1 && (
              <SearchResultFooter $type={group}>
                <PaginationButton
                  type="button"
                  $type={group}
                  $neon={neon === 'on'}
                  disabled={currentPage === 1}
                  onClick={() => changePage(group, currentPage - 1)}
                  aria-label={`Página anterior de ${WIKI_SEARCH_GROUP_LABELS[group]}`}
                  title="Página anterior"
                >
                  <BiChevronLeft aria-hidden="true" />
                </PaginationButton>
                <PaginationStatus>
                  Página {currentPage} de {totalPages}
                </PaginationStatus>
                <PaginationButton
                  type="button"
                  $type={group}
                  $neon={neon === 'on'}
                  disabled={currentPage === totalPages}
                  onClick={() => changePage(group, currentPage + 1)}
                  aria-label={`Próxima página de ${WIKI_SEARCH_GROUP_LABELS[group]}`}
                  title="Próxima página"
                >
                  <BiChevronRight aria-hidden="true" />
                </PaginationButton>
              </SearchResultFooter>
            )}
          </SearchResultGroup>
        );
      })}
    </SearchResultsContainer>
  );
};
