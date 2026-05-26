import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchPages } from '../../../services/pageService';
import { Page } from '../../../models/Pages';
import { WikiSearchState } from '../types';

export const useWikiSearch = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<WikiSearchState>({
    query: '',
    results: [],
    loading: false,
    error: null,
  });

  const query = searchParams.get('q') || '';

  useEffect(() => {
    
    if (!query) {
      setState(prev => ({
        ...prev,
        results: [],
        query: '',
      }));
      return;
    }

    const performSearch = async () => {
      setState(prev => ({ ...prev, loading: true, error: null, query }));

      try {
        const response = await searchPages(query);
        
        if (response.sucesso && response.pages) {
          setState(prev => ({
            ...prev,
            results: response.pages as Page[],
            loading: false,
          }));
        } else {
          setState(prev => ({
            ...prev,
            error: response.mensagemErro || 'Erro ao buscar páginas',
            loading: false,
          }));
        }
      } catch (error) {
        console.error('Erro na busca:', error);
        setState(prev => ({
          ...prev,
          error: 'Erro ao realizar a busca',
          loading: false,
        }));
      }
    };

    performSearch();
  }, [query]);

  const handleSearch = (searchQuery: string) => {
    console.log("🚀 ~ handleSearch ~ searchQuery:", searchQuery);
    if (searchQuery.trim()) {
      const encodedQuery = encodeURIComponent(searchQuery);
      console.log("🚀 ~ handleSearch ~ encoded:", encodedQuery);
      navigate(`/wiki/search?q=${encodedQuery}`);
    } else {
      navigate('/wiki/MainPage');
    }
  };

  return {
    ...state,
    handleSearch,
    isSearching: query.length > 0,
  };
};
