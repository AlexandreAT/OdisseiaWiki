import React from 'react';
import {
  getCharacterForComparison,
  searchCharactersForComparison,
} from '../../services/personagemComparacaoService';
import {
  CharacterComparisonData,
  CharacterComparisonModalProps,
} from './CharacterComparison.types';

type HookArgs = Pick<CharacterComparisonModalProps, 'open' | 'current' | 'source' | 'sourceId' | 'variantId' | 'tableId'>;

export const useCharacterComparison = ({ open, current, source, sourceId, variantId, tableId }: HookArgs) => {
  const currentIdentity = current
    ? `${current.origem}:${current.id ?? current.nome}:${current.idVariante ?? ''}`
    : `${source}:${sourceId ?? ''}:${variantId ?? ''}`;
  const [currentCharacter, setCurrentCharacter] = React.useState(current ?? null);
  const [candidate, setCandidate] = React.useState<CharacterComparisonData | null>(null);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<CharacterComparisonData[]>([]);
  const [loadingCurrent, setLoadingCurrent] = React.useState(false);
  const [loadingCandidate, setLoadingCandidate] = React.useState(false);
  const [selectedCandidateName, setSelectedCandidateName] = React.useState('');
  const [searching, setSearching] = React.useState(false);
  const [error, setError] = React.useState('');
  const searchRequestRef = React.useRef(0);
  const candidateRequestRef = React.useRef(0);
  const currentRef = React.useRef(current);

  React.useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  React.useEffect(() => {
    currentRef.current = current;
    if (!open) return;
    if (current) setCurrentCharacter(current);
  }, [current, open]);

  React.useEffect(() => {
    if (!open) return;
    candidateRequestRef.current += 1;
    setCurrentCharacter(currentRef.current ?? null);
    setCandidate(null);
    setQuery('');
    setResults([]);
    setSelectedCandidateName('');
    setLoadingCandidate(false);
    setError('');
  }, [currentIdentity, open]);

  React.useEffect(() => {
    if (!open || current || !sourceId) return;
    const controller = new AbortController();
    setLoadingCurrent(true);
    getCharacterForComparison(source, sourceId, variantId, controller.signal)
      .then(setCurrentCharacter)
      .catch((requestError) => {
        if (requestError?.name !== 'CanceledError') {
          setError('Não foi possível carregar o personagem atual.');
        }
      })
      .finally(() => setLoadingCurrent(false));
    return () => controller.abort();
  }, [current, open, source, sourceId, variantId]);

  React.useEffect(() => {
    const term = query.trim();
    const selectedName = selectedCandidateName.trim().toLocaleLowerCase('pt-BR');
    if (!open || term.length < 2 || term.toLocaleLowerCase('pt-BR') === selectedName) {
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
      searchCharactersForComparison({
        source,
        sourceId,
        currentVariantId: currentCharacter?.idVariante ?? current?.idVariante ?? variantId,
        tableId,
        term,
        signal: controller.signal,
      })
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
  }, [current?.idVariante, currentCharacter?.idVariante, open, query, selectedCandidateName, source, sourceId, tableId, variantId]);

  const selectCandidate = React.useCallback(async (selected: CharacterComparisonData) => {
    if (!selected.id || !Number.isFinite(Number(selected.id))) {
      setError('O personagem selecionado nÃ£o possui uma ficha vÃ¡lida para comparaÃ§Ã£o.');
      return;
    }

    const requestId = candidateRequestRef.current + 1;
    candidateRequestRef.current = requestId;

    setCandidate(null);
    setSelectedCandidateName(selected.nome);
    setQuery(selected.nome);
    setResults([]);
    setError('');
    setLoadingCandidate(true);

    try {
      // A busca Ã© apenas um Ã­ndice. Carregar a ficha individualmente impede que
      // uma projeÃ§Ã£o resumida da lista alimente os atributos do radar.
      const detailed = await getCharacterForComparison(
        selected.origem,
        Number(selected.id),
        selected.idVariante,
      );
      if (candidateRequestRef.current === requestId) setCandidate(detailed);
    } catch (requestError: unknown) {
      const canceled = requestError instanceof Error && requestError.name === 'CanceledError';
      if (!canceled && candidateRequestRef.current === requestId) {
        setSelectedCandidateName('');
        setError('NÃ£o foi possÃ­vel carregar o personagem selecionado.');
      }
    } finally {
      if (candidateRequestRef.current === requestId) setLoadingCandidate(false);
    }
  }, []);

  return {
    currentCharacter,
    candidate,
    query,
    results,
    loadingCurrent,
    loadingCandidate,
    searching,
    error,
    setQuery,
    selectCandidate,
  };
};
