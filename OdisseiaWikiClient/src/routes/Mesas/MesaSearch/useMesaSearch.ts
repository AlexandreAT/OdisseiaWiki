import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import type { MesaResumo, PaginaMesa } from '../../../models/Mesa';
import type { SistemaRpgResumo } from '../../../models/SistemaRpg';
import { pesquisarMesas } from '../../../services/mesaService';
import { listarSistemasRpg } from '../../../services/sistemasRpgService';
import { getApiErrorMessage } from '../../../utils/apiError';

const emptyPage: PaginaMesa<MesaResumo> = { itens: [], pagina: 1, tamanhoPagina: 12, totalItens: 0, totalPaginas: 0 };

export const useMesaSearch = () => {
  const [query, setQuery] = useState('');
  const [systemId, setSystemId] = useState<number | undefined>();
  const [availableOnly, setAvailableOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(emptyPage);
  const [systems, setSystems] = useState<SistemaRpgResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const activeRequest = useRef(0);

  useEffect(() => {
    let active = true;

    void listarSistemasRpg()
      .then((items) => {
        if (active) setSystems(items);
      })
      .catch(() => {
        if (active) setSystems([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const search = useCallback(async () => {
    const requestId = ++activeRequest.current;
    setLoading(true);
    try {
      const pageResult = await pesquisarMesas({
        termo: query,
        idSistemaRpg: systemId,
        somenteComVagas: availableOnly,
        pagina: page,
        tamanhoPagina: 12,
      });
      if (requestId === activeRequest.current) setResult(pageResult);
    } catch (error) {
      if (requestId !== activeRequest.current) return;
      toast.error(getApiErrorMessage(error, 'Não foi possível pesquisar Mesas.'));
    } finally {
      if (requestId === activeRequest.current) setLoading(false);
    }
  }, [availableOnly, page, query, systemId]);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => { void search(); },
      query.trim() ? 280 : 0,
    );

    return () => {
      window.clearTimeout(timeout);
      activeRequest.current += 1;
    };
  }, [query, search]);

  return {
    query, setQuery: (value: string) => { setQuery(value); setPage(1); },
    systemId, setSystemId: (value?: number) => { setSystemId(value); setPage(1); },
    availableOnly, setAvailableOnly: (value: boolean) => { setAvailableOnly(value); setPage(1); },
    page, setPage, result, systems, loading,
  };
};
