import { useState, useCallback, useEffect } from 'react';
import { globalSearch, SearchResultItem } from '../../../../../services/infoLoreService';
import { excluirItem } from '../../../../../services/itensService';
import { deleteCidade } from '../../../../../services/cidadesService';
import { deleteRaca } from '../../../../../services/racasService';
import { deletePersonagem } from '../../../../../services/personagensService';
import { GroupedResults, SearchFormErrors, EntityType } from './types';
import toast from 'react-hot-toast';

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<SearchResultItem | null>(null);

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

  const handleDelete = useCallback((item: SearchResultItem) => {
    const itemId = String(item.idString ?? item.id ?? '');
    if (!itemId) {
      toast.error(`Não foi possível identificar o ${item.tipoEntidade?.toLowerCase()} para exclusão.`);
      return;
    }
    setItemToDelete(item);
    setOpenConfirmDelete(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    const item = itemToDelete;
    const itemId = String(item.idString ?? item.id ?? '');

    setOpenConfirmDelete(false);
    setIsDeleting(true);
    try {
      let success = false;

      switch (item.tipoEntidade) {
        case 'Item':
          success = await excluirItem(itemId);
          if (success) {
            setResults(prev => ({
              ...prev,
              itens: prev.itens.filter(i => (i.idString ?? i.id) !== itemId)
            }));
          }
          break;
        case 'Cidade':
          success = await deleteCidade(Number(itemId));
          if (success) {
            setResults(prev => ({
              ...prev,
              cidades: prev.cidades.filter(c => (c.idString ?? c.id) !== itemId)
            }));
          }
          break;
        case 'Raca':
          success = await deleteRaca(Number(itemId));
          if (success) {
            setResults(prev => ({
              ...prev,
              racas: prev.racas.filter(r => (r.idString ?? r.id) !== itemId)
            }));
          }
          break;
        case 'Personagem':
          success = await deletePersonagem(itemId);
          if (success) {
            setResults(prev => ({
              ...prev,
              personagens: prev.personagens.filter(p => (p.idString ?? p.id) !== itemId)
            }));
          }
          break;
        default:
          toast.error(`Exclusão não disponível para ${item.tipoEntidade}.`);
          setIsDeleting(false);
          return;
      }

      if (success) {
        toast.success(`${item.tipoEntidade} excluído com sucesso`);
        setTotalResultados(prev => Math.max(0, prev - 1));
      } else {
        toast.error(`Erro ao excluir ${item.tipoEntidade?.toLowerCase()}`);
      }
    } catch (error: any) {
      console.error(`Erro ao excluir ${item.tipoEntidade}:`, error);
      toast.error(`Erro ao excluir ${item.tipoEntidade?.toLowerCase()}`);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  }, [itemToDelete]);

  const handleCancelDelete = useCallback(() => {
    setOpenConfirmDelete(false);
    setItemToDelete(null);
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
    isDeleting,
    openConfirmDelete,
    setOpenConfirmDelete,
    itemToDelete,
    handleConfirmDelete,
    handleCancelDelete,
  };
};
