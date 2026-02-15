import React from 'react';
import { InputText } from '../../../../../components/Generic/InputText/InputText';
import { ResultCard } from './ResultCard/ResultCard';
import { useFormBuscarConteúdo } from './useFormBuscarConteúdo';
import { EntityType } from './types';
import {
  Main,
  SearchHeader,
  SearchInputContainer,
  FilterContainer,
  FilterButton,
  ResultsInfo,
  ResultsText,
  ResultsGrid,
  EmptyState,
  EmptyStateIcon,
  EmptyStateText,
  LoadingContainer,
  LoadingSpinner,
  ErrorText,
} from './FormBuscarConteúdo.style';

interface FormBuscarConteúdoProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

const FILTER_OPTIONS: Array<{ key: EntityType | 'Todos'; label: string }> = [
  { key: 'Todos', label: 'Todos' },
  { key: 'Cidade', label: 'Cidades' },
  { key: 'Personagem', label: 'Personagens' },
  { key: 'Item', label: 'Itens' },
  { key: 'InfoLore', label: 'Lore' },
  { key: 'Raca', label: 'Raças' },
];

export const FormBuscarConteúdo: React.FC<FormBuscarConteúdoProps> = ({ theme, neon }) => {
  const {
    termo,
    setTermo,
    totalResultados,
    isSearching,
    hasSearched,
    errors,
    selectedFilter,
    setSelectedFilter,
    getFilteredResults,
    getResultCountByType,
    handleEdit,
    handleDelete,
  } = useFormBuscarConteúdo();

  const filteredResults = getFilteredResults();

  const renderFilterLabel = (filter: typeof FILTER_OPTIONS[0]) => {
    if (filter.key === 'Todos') {
      return `${filter.label} (${totalResultados})`;
    }
    const count = getResultCountByType(filter.key as EntityType);
    return `${filter.label} (${count})`;
  };

  const renderContent = () => {
    if (isSearching) {
      return (
        <LoadingContainer>
          <LoadingSpinner theme={theme} neon={neon} />
        </LoadingContainer>
      );
    }

    if (!hasSearched) {
      return (
        <EmptyState theme={theme} neon={neon}>
          <EmptyStateIcon theme={theme} neon={neon}>
            🔍
          </EmptyStateIcon>
          <EmptyStateText>
            Digite um termo para buscar em cidades, personagens, itens, lore e raças
          </EmptyStateText>
        </EmptyState>
      );
    }

    if (filteredResults.length === 0) {
      return (
        <EmptyState theme={theme} neon={neon}>
          <EmptyStateIcon theme={theme} neon={neon}>
            📭
          </EmptyStateIcon>
          <EmptyStateText>
            Nenhum resultado encontrado para "{termo}"
          </EmptyStateText>
          {selectedFilter !== 'Todos' && (
            <EmptyStateText>
              Tente mudar o filtro ou buscar outro termo
            </EmptyStateText>
          )}
        </EmptyState>
      );
    }

    return (
      <ResultsGrid>
        {filteredResults.map((item, index) => (
          <ResultCard
            key={`${item.tipoEntidade}-${item.id || item.idString}-${index}`}
            theme={theme}
            neon={neon}
            item={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </ResultsGrid>
    );
  };

  return (
    <Main>
      <SearchHeader>
        <SearchInputContainer>
          <InputText
            theme={theme}
            neon={neon}
            label="Buscar conteúdo"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            width="100%"
            error={!!errors.termo}
          />
        </SearchInputContainer>
        {errors.termo && (
          <ErrorText theme={theme} neon={neon}>
            {errors.termo}
          </ErrorText>
        )}

        {hasSearched && (
          <>
            <FilterContainer>
              {FILTER_OPTIONS.map((filter) => (
                <FilterButton
                  key={filter.key}
                  theme={theme}
                  neon={neon}
                  active={selectedFilter === filter.key}
                  onClick={() => setSelectedFilter(filter.key)}
                >
                  {renderFilterLabel(filter)}
                </FilterButton>
              ))}
            </FilterContainer>

            <ResultsInfo theme={theme} neon={neon}>
              <ResultsText>
                {filteredResults.length} resultado(s) encontrado(s)
                {selectedFilter !== 'Todos' && ` em ${selectedFilter}`}
              </ResultsText>
            </ResultsInfo>
          </>
        )}
      </SearchHeader>

      {renderContent()}
    </Main>
  );
};
