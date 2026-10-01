import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import type { MesaAoVivoSnapshot, MesaNpcCatalogo } from '../../../models/Mesa';
import {
  adicionarNpcMesa,
  atualizarMesaAoVivo,
  atualizarVisibilidadeNpcMesa,
  obterMesaAoVivo,
  pesquisarNpcsMesa,
  publicarNpcMesa,
  removerNpcMesa,
} from '../../../services/mesaService';
import {
  atualizarRecursosPersonagemJogador,
  type AtualizarRecursosPersonagemPayload,
} from '../../../services/personagemJogadorService';
import { getApiErrorMessage } from '../../../utils/apiError';

const snapshotContent = (snapshot: MesaAoVivoSnapshot) => JSON.stringify(
  snapshot,
  (key, value) => (key === 'atualizadoEm' ? undefined : value),
);

/**
 * Fonte REST da Mesa em jogo. O refresh público é intencional: eventos do hub
 * apenas invalidam o snapshot, sem duplicar regras de autorização no cliente.
 */
export const useMesaGameData = (idMesa?: number) => {
  const [snapshot, setSnapshot] = useState<MesaAoVivoSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const queuedRefreshRef = useRef(false);

  const refresh = useCallback((showError = true): Promise<void> => {
    if (!idMesa || idMesa <= 0) return Promise.resolve();
    if (refreshPromiseRef.current) {
      queuedRefreshRef.current = true;
      return refreshPromiseRef.current;
    }

    const request = (async () => {
      try {
        const data = await obterMesaAoVivo(idMesa);
        setSnapshot((current) => (
          current && snapshotContent(current) === snapshotContent(data)
            ? current
            : data
        ));
      } catch (error) {
        if (showError) {
          toast.error(getApiErrorMessage(error, 'Não foi possível atualizar a Mesa em jogo.'));
        }
        throw error;
      }
    })();
    refreshPromiseRef.current = request;
    const finish = () => {
      if (refreshPromiseRef.current !== request) return;
      refreshPromiseRef.current = null;
      if (queuedRefreshRef.current) {
        queuedRefreshRef.current = false;
        void refresh(false).catch(() => undefined);
      }
    };
    void request.then(finish, finish);
    return request;
  }, [idMesa]);

  useEffect(() => {
    let disposed = false;
    setLoading(true);
    refresh().catch(() => undefined).finally(() => {
      if (!disposed) setLoading(false);
    });
    return () => { disposed = true; };
  }, [refresh]);

  const updateCharacterResources = useCallback(async (
    idPersonagemJogador: number,
    revisaoRuntime: number,
    changes: Omit<AtualizarRecursosPersonagemPayload, 'revisaoRuntime' | 'chaveIdempotencia'>,
  ) => {
    try {
      const result = await atualizarRecursosPersonagemJogador(idPersonagemJogador, {
        ...changes,
        revisaoRuntime,
        chaveIdempotencia: crypto.randomUUID(),
      });
      if (!result.sucesso) {
        throw new Error(result.mensagemErro || result.mensagem || 'Não foi possível atualizar os recursos.');
      }
      await refresh(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível salvar a atualização rápida.'));
    }
  }, [refresh]);

  const updateMesaLiveStatus = useCallback(async (aoVivo: boolean): Promise<boolean> => {
    if (!idMesa || idMesa <= 0) return false;
    try {
      await atualizarMesaAoVivo(idMesa, aoVivo);
      await refresh(false);
      toast.success(aoVivo ? 'Mesa iniciada ao vivo.' : 'Mesa encerrada.');
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível atualizar o status da Mesa.'));
      return false;
    }
  }, [idMesa, refresh]);

  const searchNpcs = useCallback(async (term = ''): Promise<MesaNpcCatalogo[]> => {
    if (!idMesa) return [];
    return pesquisarNpcsMesa(idMesa, term);
  }, [idMesa]);

  const addNpc = useCallback(async (idPersonagemOrigem: number, idVarianteOrigem?: string | null) => {
    if (!idMesa) return null;
    try {
      const result = await adicionarNpcMesa(idMesa, idPersonagemOrigem, idVarianteOrigem);
      setSnapshot((current) => current ? {
        ...current,
        personagensCena: [...(current.personagensCena ?? []), result],
      } : current);
      return result;
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível adicionar o NPC à Mesa.'));
      return null;
    }
  }, [idMesa]);

  const setNpcVisibility = useCallback(async (idPersonagem: number, visivel: boolean) => {
    if (!idMesa) return false;
    try {
      await atualizarVisibilidadeNpcMesa(idMesa, idPersonagem, visivel);
      setSnapshot((current) => current ? {
        ...current,
        personagensCena: (current.personagensCena ?? []).map((entry) => entry.personagem.idpersonagemJogador === idPersonagem
          ? { ...entry, personagem: { ...entry.personagem, visivel } }
          : entry),
      } : current);
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível alterar a visibilidade do NPC.'));
      return false;
    }
  }, [idMesa]);

  const removeNpc = useCallback(async (idPersonagem: number) => {
    if (!idMesa) return false;
    try {
      await removerNpcMesa(idMesa, idPersonagem);
      setSnapshot((current) => current ? {
        ...current,
        personagensCena: (current.personagensCena ?? []).filter((entry) => entry.personagem.idpersonagemJogador !== idPersonagem),
      } : current);
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível remover o NPC da Mesa.'));
      return false;
    }
  }, [idMesa]);

  const publishNpc = useCallback(async (idPersonagem: number) => {
    if (!idMesa) return false;
    try {
      await publicarNpcMesa(idMesa, idPersonagem);
      toast.success('Ficha original atualizada.');
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível atualizar a ficha original.'));
      return false;
    }
  }, [idMesa]);

  return {
    snapshot, loading, refresh, updateCharacterResources, updateMesaLiveStatus,
    searchNpcs, addNpc, setNpcVisibility, removeNpc, publishNpc,
  };
};
