import { useCallback, useEffect, useRef, useState } from 'react';
import { WikiGraphResponse } from '../../models/WikiGraph';
import { getWikiGraph } from '../../services/wikiGraphService';

interface WikiGraphState {
  graph: WikiGraphResponse | null;
  loading: boolean;
  error: string | null;
}

export const useWikiGraph = () => {
  const requestId = useRef(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<WikiGraphState>({
    graph: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    const currentRequestId = ++requestId.current;
    let active = true;

    const load = async () => {
      setState((previous) => ({ ...previous, loading: true, error: null }));

      try {
        const graph = await getWikiGraph({ signal: controller.signal, timeout: 15_000 });
        if (!active || currentRequestId !== requestId.current) return;
        setState({ graph, loading: false, error: null });
      } catch {
        if (!active || currentRequestId !== requestId.current) return;
        setState({
          graph: null,
          loading: false,
          error: 'Não foi possível carregar a Teia de Conexões.',
        });
      }
    };

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey]);

  const retry = useCallback(() => setReloadKey((value) => value + 1), []);

  return { ...state, retry };
};
