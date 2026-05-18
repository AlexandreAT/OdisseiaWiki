import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BiBookmark } from 'react-icons/bi';
import { WikiSearchResultsProps } from './types';
import {
  SearchResultsContainer,
  SearchResultsHeader,
  ResultCount,
  NoResultsMessage,
  SearchResultsGrid,
  ResultCard,
  ResultCardImage,
  ResultCardContent,
  ResultCardTitle,
  ResultCardDescription,
  ResultCardPlaceholder,
} from './WikiSearchResults.style';

export const WikiSearchResults: React.FC<WikiSearchResultsProps> = ({ results }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const handleResultClick = (slug: string) => {
    navigate(`/wiki/${slug}`);
  };

  if (results.length === 0) {
    return (
      <SearchResultsContainer>
        <SearchResultsHeader>
          <ResultCount>Nenhum resultado encontrado para "{query}"</ResultCount>
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
          {results.length} resultado{results.length > 1 ? 's' : ''} encontrado{results.length > 1 ? 's' : ''} para "{query}"
        </ResultCount>
      </SearchResultsHeader>

      <SearchResultsGrid>
        {results.map(page => (
          <ResultCard
            key={page.idPage || page.slug}
            onClick={() => handleResultClick(page.slug)}
            type="button"
          >
            {page.coverImage ? (
              <ResultCardImage src={page.coverImage} alt={page.titulo} />
            ) : (
              <ResultCardPlaceholder>
                <BiBookmark />
              </ResultCardPlaceholder>
            )}
            <ResultCardContent>
              <ResultCardTitle>{page.titulo}</ResultCardTitle>
              {page.descricao && <ResultCardDescription>{page.descricao}</ResultCardDescription>}
            </ResultCardContent>
          </ResultCard>
        ))}
      </SearchResultsGrid>
    </SearchResultsContainer>
  );
};
