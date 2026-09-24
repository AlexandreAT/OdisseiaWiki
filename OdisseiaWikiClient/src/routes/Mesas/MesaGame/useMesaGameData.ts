import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { MesaAoVivoSnapshot } from '../../../models/Mesa';
import { atualizarMesaAoVivo, obterMesaAoVivo } from '../../../services/mesaService';
import {
  atualizarRecursosPersonagemJogador,
  type AtualizarRecursosPersonagemPayload,
} from '../../../services/personagemJogadorService';
import { getApiErrorMessage } from '../../../utils/apiError';

const FALLBACK_REFRESH_MS = 30_000;

/**
 * Fonte REST da Mesa em jogo. O refresh público é intencional: eventos do hub
 * apenas invalidam o snapshot, sem duplicar regras de autorização no cliente.
 */
export const useMesaGameData = (idMesa?: number) => {
  const [snapshot, setSnapshot] = useState<MesaAoVivoSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (showError = true) => {
    if (!idMesa || idMesa <= 0) return;
    try {
      const data = await obterMesaAoVivo(idMesa);
      setSnapshot(data);
    } catch (error) {
      if (showError) {
        toast.error(getApiErrorMessage(error, 'Não foi possível atualizar a Mesa em jogo.'));
      }
      throw error;
    }
  }, [idMesa]);

  useEffect(() => {
    let disposed = false;
    setLoading(true);
    refresh().catch(() => undefined).finally(() => {
      if (!disposed) setLoading(false);
    });
    return () => { disposed = true; };
  }, [refresh]);

  useEffect(() => {
    if (!idMesa) return undefined;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refresh(false).catch(() => undefined);
      }
    }, FALLBACK_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [idMesa, refresh]);

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

  return { snapshot, loading, refresh, updateCharacterResources, updateMesaLiveStatus };
};
