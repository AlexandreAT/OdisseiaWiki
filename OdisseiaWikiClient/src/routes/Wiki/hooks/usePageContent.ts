import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPageBySlug } from '../../../services/pageService';
import { Page } from '../../../models/Pages';
import { WikiContentState } from '../types';

export const usePageContent = () => {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<WikiContentState>({
    page: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!slug) {
      navigate('/wiki/MainPage');
      return;
    }

    const loadPage = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const response = await getPageBySlug(slug);
        console.log("🚀 ~ loadPage ~ slug:", slug)
        
        if (response.sucesso && response.page) {
          setState(prev => ({
            ...prev,
            page: response.page as Page,
            loading: false,
          }));
        } else {
          setState(prev => ({
            ...prev,
            error: response.mensagemErro || 'Página não encontrada',
            loading: false,
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar página:', error);
        setState(prev => ({
          ...prev,
          error: 'Erro ao carregar a página',
          loading: false,
        }));
      }
    };

    loadPage();
  }, [slug, navigate]);

  return state;
};
