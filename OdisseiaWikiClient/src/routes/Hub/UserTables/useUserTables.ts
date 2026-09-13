import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import type { MesaHubResponse } from '../../../models/Mesa';
import { obterHubMesas } from '../../../services/mesaService';
import { getApiErrorMessage } from '../../../utils/apiError';

const emptyHub: MesaHubResponse = {
  criadas: { itens: [], pagina: 1, tamanhoPagina: 3, totalItens: 0, totalPaginas: 0 },
  participando: { itens: [], pagina: 1, tamanhoPagina: 3, totalItens: 0, totalPaginas: 0 },
};

export const useUserTables = () => {
  const [data, setData] = useState<MesaHubResponse>(emptyHub);
  const [createdPage, setCreatedPage] = useState(1);
  const [participatingPage, setParticipatingPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const lastReportedError = useRef<string | null>(null);
  const activeRequest = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++activeRequest.current;
    setLoading(true);
    try {
      const hub = await obterHubMesas(createdPage, participatingPage);
      if (requestId !== activeRequest.current) return;
      setData(hub);
      lastReportedError.current = null;
    } catch (error) {
      if (requestId !== activeRequest.current) return;
      const message = getApiErrorMessage(error, 'Não foi possível carregar suas Mesas.');
      if (lastReportedError.current !== message) {
        toast.error(message);
        lastReportedError.current = message;
      }
    } finally {
      if (requestId === activeRequest.current) setLoading(false);
    }
  }, [createdPage, participatingPage]);

  useEffect(() => { void load(); }, [load]);

  return {
    data,
    loading,
    createdPage,
    participatingPage,
    setCreatedPage,
    setParticipatingPage,
    reload: load,
  };
};
