import React from 'react';
import toast from 'react-hot-toast';
import { InputText } from '../../../../../components/Generic/InputText/InputText';
import { ConfirmDialog } from '../../../../../components/Generic/ConfirmDialog/ConfirmDialog';
import { SearchResultItem } from '../../../../../services/infoLoreService';
import { ResultCard } from './ResultCard/ResultCard';
import { useFormBuscarConteúdo } from './useFormBuscarConteúdo';
import { NpcCharacterEdit } from './NpcCharacterEdit';
import { ItemEdit } from './ItemEdit';
import { CityEdit } from './CityEdit';
import { RaceEdit } from './RaceEdit';
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
  const [editingCharacterId, setEditingCharacterId] = React.useState<string | null>(null);
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);
  const [editingCityId, setEditingCityId] = React.useState<number | null>(null);
  const [editingRaceId, setEditingRaceId] = React.useState<number | null>(null);

  const {
    termo,
    setTermo,
    totalResultados,
    isSearching,
    hasSearched,
    errors,
    selectedFilter,
    setSelectedFilter,
    handleSearch,
    getFilteredResults,
    getResultCountByType,
    handleDelete,
    openConfirmDelete,
    setOpenConfirmDelete,
    itemToDelete,
    handleConfirmDelete,
    handleCancelDelete,
    isDeleting,
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

  const handleEdit = React.useCallback((item: SearchResultItem) => {
    if (item.tipoEntidade === 'Personagem') {
      const identifier = String(item.idString ?? item.id ?? '');
      if (!identifier) {
        toast.error('Não foi possível identificar o personagem para edição.');
        return;
      }
      setEditingCharacterId(identifier);
    } else if (item.tipoEntidade === 'Item') {
      const identifier = String(item.idString ?? item.id ?? '');
      if (!identifier) {
        toast.error('Não foi possível identificar o item para edição.');
        return;
      }
      setEditingItemId(identifier);
    } else if (item.tipoEntidade === 'Cidade') {
      const cityId = Number(item.idString ?? item.id ?? 0);
      if (!cityId || cityId === 0) {
        toast.error('Não foi possível identificar a cidade para edição.');
        return;
      }
      setEditingCityId(cityId);
    } else if (item.tipoEntidade === 'Raca') {
      const raceId = Number(item.idString ?? item.id ?? 0);
      if (!raceId || raceId === 0) {
        toast.error('Não foi possível identificar a raça para edição.');
        return;
      }
      setEditingRaceId(raceId);
    } else {
      toast('Edição não disponível para este tipo de conteúdo.');
    }
  }, []);

  if (editingCharacterId) {
    return (
      <NpcCharacterEdit
        theme={theme}
        neon={neon}
        characterId={editingCharacterId}
        onBack={() => setEditingCharacterId(null)}
        onSave={handleSearch}
      />
    );
  }

  if (editingItemId) {
    return (
      <ItemEdit
        theme={theme}
        neon={neon}
        itemId={editingItemId}
        onBack={() => setEditingItemId(null)}
        onSave={handleSearch}
      />
    );
  }

  if (editingCityId !== null) {
    return (
      <CityEdit
        theme={theme}
        neon={neon}
        cityId={editingCityId}
        onBack={() => setEditingCityId(null)}
        onSave={handleSearch}
      />
    );
  }

  if (editingRaceId !== null) {
    return (
      <RaceEdit
        theme={theme}
        neon={neon}
        raceId={editingRaceId}
        onBack={() => setEditingRaceId(null)}
        onSave={handleSearch}
      />
    );
  }

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
      
      <ConfirmDialog
        open={openConfirmDelete}
        title="Excluir Item"
        message={`Tem certeza que deseja excluir o ${itemToDelete?.tipoEntidade?.toLowerCase()} "${itemToDelete?.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={isDeleting}
      />
    </Main>
  );
};
