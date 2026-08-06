import { useCallback, useEffect, useMemo, useState } from 'react';
import { SistemaRuntimeConsulta, SistemaRuntimeContexto } from '../models/SistemaRpg';
import { resolverContextoRuntimeSistemaRpg } from '../services/sistemasRpgService';
import { getApiErrorMessage } from '../utils/apiError';

interface UseSistemaRuntimeContextoOptions extends SistemaRuntimeConsulta {
  enabled?: boolean;
}

export const useSistemaRuntimeContexto = ({
  enabled = true,
  idMesa,
  idPersonagemJogador,
  tipoEntidade,
  idEntidade,
  idRaca,
  codigoTipoItem,
  codigoCategoriaItem,
  codigoArquetipoItem,
}: UseSistemaRuntimeContextoOptions) => {
  const [contexto, setContexto] = useState<SistemaRuntimeContexto | null>(null);
  const [resolvedQueryKey, setResolvedQueryKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const consulta = useMemo<SistemaRuntimeConsulta>(() => ({
    idMesa,
    idPersonagemJogador,
    tipoEntidade,
    idEntidade,
    idRaca,
    codigoTipoItem,
    codigoCategoriaItem,
    codigoArquetipoItem,
  }), [
    codigoArquetipoItem,
    codigoCategoriaItem,
    codigoTipoItem,
    idEntidade,
    idMesa,
    idPersonagemJogador,
    idRaca,
    tipoEntidade,
  ]);
  const queryKey = useMemo(() => JSON.stringify(consulta), [consulta]);

  const reload = useCallback(() => setReloadKey((current) => current + 1), []);

  useEffect(() => {
    if (!enabled) {
      setContexto(null);
      setResolvedQueryKey(null);
      setLoading(false);
      setError(null);
      return undefined;
    }

    const controller = new AbortController();
    setContexto(null);
    setResolvedQueryKey(null);
    setLoading(true);
    setError(null);

    resolverContextoRuntimeSistemaRpg(consulta, { signal: controller.signal })
      .then((resolvedContext) => {
        setContexto(resolvedContext);
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setError(getApiErrorMessage(requestError, 'Não foi possível resolver o Sistema da ficha.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setResolvedQueryKey(queryKey);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [consulta, enabled, queryKey, reloadKey]);

  const hasCurrentResult = enabled && resolvedQueryKey === queryKey;

  return {
    contexto: hasCurrentResult ? contexto : null,
    loading: enabled && (loading || !hasCurrentResult),
    error: hasCurrentResult ? error : null,
    reload,
  };
};
