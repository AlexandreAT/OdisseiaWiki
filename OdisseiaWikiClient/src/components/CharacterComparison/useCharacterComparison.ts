import React from 'react';
import {
  getCharacterForComparison,
  searchCharactersForComparison,
} from '../../services/personagemComparacaoService';
import { CharacterComparisonModalProps } from './CharacterComparison.types';

type HookArgs = Pick<CharacterComparisonModalProps, 'open' | 'current' | 'source' | 'sourceId' | 'tableId'>;

export const useCharacterComparison = ({ open, current, source, sourceId, tableId }: HookArgs) => {
  const [currentCharacter, setCurrentCharacter] = React.useState(current ?? null);
  const [candidate, setCandidate] = React.useState<typeof currentCharacter>(null);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<NonNullable<typeof currentCharacter>[]>([]);
  const [loadingCurrent, setLoadingCurrent] = React.useState(false);
  const [searching, setSearching] = React.useState(false);
  const [error, setError] = React.useState('');
  const searchRequestRef = React.useRef(0);

  React.useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    setCurrentCharacter(current ?? null);
    setCandidate(null);
    setQuery('');
    setResults([]);
    setError('');
  }, [current, open]);

  React.useEffect(() => {
    if (!open || current || !sourceId) return;
    const controller = new AbortController();
    setLoadingCurrent(true);
    getCharacterForComparison(source, sourceId, controller.signal)
      .then(setCurrentCharacter)
      .catch((requestError) => {
        if (requestError?.name !== 'CanceledError') {
          setError('Não foi possível carregar o personagem atual.');
        }
      })
      .finally(() => setLoadingCurrent(false));
    return () => controller.abort();
  }, [current, open, source, sourceId]);

  React.useEffect(() => {
    const term = query.trim();
    const selectedCandidateName = candidate?.nome.trim().toLocaleLowerCase('pt-BR');
    if (!open || term.length < 2 || term.toLocaleLowerCase('pt-BR') === selectedCandidateName) {
      setResults([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;
    const timer = window.setTimeout(() => {
      setSearching(true);
      setError('');
      searchCharactersForComparison({ source, sourceId, tableId, term, signal: controller.signal })
        .then((characters) => {
          if (searchRequestRef.current === requestId) setResults(characters);
        })
        .catch((requestError) => {
          if (requestError?.name !== 'CanceledError' && searchRequestRef.current === requestId) {
            setResults([]);
            setError('Não foi possível pesquisar personagens para comparação.');
          }
        })
        .finally(() => {
          if (searchRequestRef.current === requestId) setSearching(false);
        });
    }, 280);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [candidate, open, query, source, sourceId, tableId]);

  const selectCandidate = React.useCallback((selected: NonNullable<typeof currentCharacter>) => {
    setCandidate(selected);
    setQuery(selected.nome);
    setResults([]);
  }, []);

  return {
    currentCharacter,
    candidate,
    query,
    results,
    loadingCurrent,
    searching,
    error,
    setQuery,
    selectCandidate,
  };
};
