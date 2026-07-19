import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BiBookmark, BiSortAlt2 } from 'react-icons/bi';
import { normalizeImagePath } from '../../utils/imagePathHelper';
import {
  WikiSearchItem,
  WikiSearchSortOption,
  WIKI_SEARCH_GROUP_LABELS,
  WIKI_SEARCH_GROUP_ORDER,
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
} from './WikiSearchResults.style';

export const WikiSearchResults: React.FC<WikiSearchResultsProps> = ({
  results,
  theme,
  neon,
  onResultSelect,
}) => {
  const [searchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState<WikiSearchSortOption>('name');
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

        return (
          <SearchResultGroup key={group}>
            <SearchResultGroupTitle $type={group} $neon={neon === 'on'}>
              {WIKI_SEARCH_GROUP_LABELS[group]}
              <span>{groupResults.length}</span>
            </SearchResultGroupTitle>

            <SearchResultsGrid>
              {groupResults.map((item) => (
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
          </SearchResultGroup>
        );
      })}
    </SearchResultsContainer>
  );
};
