import { useState, useCallback, useEffect } from 'react';
import { globalSearch, SearchResultItem } from '../../../../../services/infoLoreService';
import { GroupedResults, SearchFormErrors, EntityType } from './types';

export const useFormBuscarConteúdo = () => {
  const [termo, setTermo] = useState('');
  const [results, setResults] = useState<GroupedResults>({
    cidades: [],
    personagens: [],
    itens: [],
    infoLores: [],
    racas: [],
  });
  const [totalResultados, setTotalResultados] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errors, setErrors] = useState<SearchFormErrors>({});
  const [selectedFilter, setSelectedFilter] = useState<EntityType | 'Todos'>('Todos');

  // Função de busca
  const handleSearch = useCallback(async () => {
    const trimmedTermo = termo.trim();
    
    if (trimmedTermo.length < 2) {
      setErrors({ termo: 'Digite pelo menos 2 caracteres para buscar' });
      return;
    }

    setErrors({});
    setIsSearching(true);

    try {
      const response = await globalSearch(trimmedTermo);
      
      setResults({
        cidades: response.cidades || [],
        personagens: response.personagens || [],
        itens: response.itens || [],
        infoLores: response.infoLores || [],
        racas: response.racas || [],
      });
      setTotalResultados(response.totalResultados || 0);
      setHasSearched(true);
    } catch (error) {
      console.error('Erro ao buscar:', error);
      setErrors({ termo: 'Erro ao realizar busca. Tente novamente.' });
      setResults({
        cidades: [],
        personagens: [],
        itens: [],
        infoLores: [],
        racas: [],
      });
      setTotalResultados(0);
    } finally {
      setIsSearching(false);
    }
  }, [termo]);

  // Debounce para busca automática
  useEffect(() => {
    if (termo.trim().length === 0) {
      setResults({
        cidades: [],
        personagens: [],
        itens: [],
        infoLores: [],
        racas: [],
      });
      setTotalResultados(0);
      setHasSearched(false);
      return;
    }

    if (termo.trim().length < 2) {
      return;
    }

    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [termo, handleSearch]);

  const getFilteredResults = useCallback((): SearchResultItem[] => {
    if (selectedFilter === 'Todos') {
      return [
        ...results.cidades,
        ...results.personagens,
        ...results.itens,
        ...results.infoLores,
        ...results.racas,
      ];
    }

    switch (selectedFilter) {
      case 'Cidade':
        return results.cidades;
      case 'Personagem':
        return results.personagens;
      case 'Item':
        return results.itens;
      case 'InfoLore':
        return results.infoLores;
      case 'Raca':
        return results.racas;
      default:
        return [];
    }
  }, [results, selectedFilter]);

  const getResultCountByType = useCallback((type: EntityType): number => {
    switch (type) {
      case 'Cidade':
        return results.cidades.length;
      case 'Personagem':
        return results.personagens.length;
      case 'Item':
        return results.itens.length;
      case 'InfoLore':
        return results.infoLores.length;
      case 'Raca':
        return results.racas.length;
      default:
        return 0;
    }
  }, [results]);

  const handleEdit = useCallback((item: SearchResultItem) => {
    // TODO: Implementar navegação para edição
    console.log('Editar:', item);
  }, []);

  const handleDelete = useCallback(async (item: SearchResultItem) => {
    // TODO: Implementar exclusão
    console.log('Deletar:', item);
  }, []);

  const resetSearch = useCallback(() => {
    setTermo('');
    setResults({
      cidades: [],
      personagens: [],
      itens: [],
      infoLores: [],
      racas: [],
    });
    setTotalResultados(0);
    setHasSearched(false);
    setErrors({});
    setSelectedFilter('Todos');
  }, []);

  return {
    termo,
    setTermo,
    results,
    totalResultados,
    isSearching,
    hasSearched,
    errors,
    selectedFilter,
    setSelectedFilter,
    handleSearch,
    getFilteredResults,
    getResultCountByType,
    handleEdit,
    handleDelete,
    resetSearch,
  };
};
