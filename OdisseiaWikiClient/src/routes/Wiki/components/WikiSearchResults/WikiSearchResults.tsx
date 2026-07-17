import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { BiBookmark } from 'react-icons/bi';
import { normalizeImagePath } from '../../utils/imagePathHelper';
import { WIKI_SEARCH_GROUP_LABELS, WIKI_SEARCH_GROUP_ORDER } from '../../types';
import { WikiSearchResultsProps } from './types';
import {
  SearchResultsContainer,
  SearchResultsHeader,
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
  const query = searchParams.get('q') || '';
  const selectedGroupParam = searchParams.get('type');
  const selectedGroup = WIKI_SEARCH_GROUP_ORDER.find((group) => group === selectedGroupParam) ?? null;
  const totalResults = WIKI_SEARCH_GROUP_ORDER.reduce(
    (total, group) => total + results[group].length,
    0,
  );

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
      </SearchResultsHeader>

      {WIKI_SEARCH_GROUP_ORDER.map((group) => {
        const groupResults = results[group];
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
                  <ResultCardContent>
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
