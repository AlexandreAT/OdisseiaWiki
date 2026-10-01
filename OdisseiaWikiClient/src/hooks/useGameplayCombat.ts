import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameplayCombatCommandBase, GameplayCombatCommandResponse, GameplayCombatSnapshot, GameplayStateCatalog } from '../models/GameplayCombat';
import {
  adicionarNpcCombate,
  aplicarDescansoGameplay,
  aplicarCondicaoCombate,
  ativarCombate,
  avancarTurnoCombate,
  encerrarCombate,
  iniciarCombate,
  obterCombateAtual,
  obterCatalogoEstadoGameplay,
  removerCondicaoCombate,
  removerParticipanteCombate,
  rolarIniciativaCombate,
  rolarSobrevivenciaCombate,
} from '../services/gameplayCombatService';
import type { AdicionarNpcCombatePayload } from '../services/gameplayCombatService';
import { getApiErrorMessage } from '../utils/apiError';

export const useGameplayCombat = (idMesa?: number, idMesaSessao?: number | null) => {
  const [combat, setCombat] = useState<GameplayCombatSnapshot | null>(null);
  const [catalog, setCatalog] = useState<GameplayStateCatalog | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshPromiseRef = useRef<Promise<GameplayCombatSnapshot | null> | null>(null);
  const queuedRefreshRef = useRef(false);

  const refresh = useCallback((showLoading = false, reportError = showLoading): Promise<GameplayCombatSnapshot | null> => {
    if (!idMesa || !idMesaSessao) {
      setCombat(null);
      setCatalog(null);
      return Promise.resolve(null);
    }
    if (refreshPromiseRef.current) {
      queuedRefreshRef.current = true;
      return refreshPromiseRef.current;
    }

    const request = (async () => {
      if (showLoading) setLoading(true);
      try {
        const [current, currentCatalog] = await Promise.all([
          obterCombateAtual(idMesa, idMesaSessao),
          obterCatalogoEstadoGameplay(idMesa, idMesaSessao),
        ]);
        setCombat((previous) => previous?.revisao === current?.revisao && previous?.idMesaCombate === current?.idMesaCombate ? previous : current);
        setCatalog((previous) => previous && JSON.stringify(previous) === JSON.stringify(currentCatalog)
          ? previous : currentCatalog);
        setError(null);
        return current;
      } catch (requestError) {
        if (reportError) {
          setError(getApiErrorMessage(requestError, 'Não foi possível carregar o combate.'));
        }
        return null;
      } finally {
        if (showLoading) setLoading(false);
      }
    })();
    refreshPromiseRef.current = request;
    const finish = () => {
      if (refreshPromiseRef.current !== request) return;
      refreshPromiseRef.current = null;
      if (queuedRefreshRef.current) {
        queuedRefreshRef.current = false;
        void refresh(false, false);
      }
    };
    void request.then(finish, finish);
    return request;
  }, [idMesa, idMesaSessao]);

  useEffect(() => { void refresh(true); }, [refresh]);

  const execute = useCallback(async (
    action: (basePayload: GameplayCombatCommandBase) => Promise<GameplayCombatCommandResponse>,
  ) => {
    if (!idMesaSessao) throw new Error('A sessão de gameplay não está ativa.');
    setSubmitting(true);
    setError(null);
    try {
      const response = await action({
        chaveIdempotencia: crypto.randomUUID(),
        revisaoCombateEsperada: combat?.revisao,
      });
      setCombat(response.combate ?? null);
      return response;
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, 'Não foi possível atualizar o combate.');
      setError(message);
      throw requestError;
    } finally {
      setSubmitting(false);
    }
  }, [combat?.revisao, idMesaSessao]);

  return {
    combat,
    catalog,
    loading,
    submitting,
    error,
    refresh,
    start: (idsPersonagens: number[]) => execute((basePayload) => iniciarCombate(idMesa!, idMesaSessao!, { ...basePayload, idsPersonagens })),
    addNpc: (npc: AdicionarNpcCombatePayload) => execute((basePayload) => adicionarNpcCombate(idMesa!, idMesaSessao!, { ...basePayload, ...npc })),
    removeParticipant: (idParticipante: number) => execute((basePayload) => removerParticipanteCombate(idMesa!, idMesaSessao!, { ...basePayload, idParticipante })),
    rollInitiative: (idParticipante: number) => execute((basePayload) => rolarIniciativaCombate(idMesa!, idMesaSessao!, { ...basePayload, idParticipante })),
    activate: (ordemParticipantes: number[]) => execute((basePayload) => ativarCombate(idMesa!, idMesaSessao!, { ...basePayload, ordemParticipantes })),
    advance: () => execute((basePayload) => avancarTurnoCombate(idMesa!, idMesaSessao!, basePayload)),
    end: () => execute((basePayload) => encerrarCombate(idMesa!, idMesaSessao!, basePayload)),
    applyCondition: (idParticipante: number, idSistemaCondicao: number, duracao?: number, valor?: number) => execute((basePayload) => aplicarCondicaoCombate(idMesa!, idMesaSessao!, { ...basePayload, idParticipante, idSistemaCondicao, duracao, valor })),
    removeCondition: (idCondicaoAtiva: number) => execute((basePayload) => removerCondicaoCombate(idMesa!, idMesaSessao!, { ...basePayload, idCondicaoAtiva })),
    rollSurvival: (idParticipante: number, estabilizacaoManual = false) => execute((basePayload) => rolarSobrevivenciaCombate(idMesa!, idMesaSessao!, { ...basePayload, idParticipante, estabilizacaoManual })),
    applyRest: (idPersonagemJogador: number, idSistemaDescansoConfig: number, revisaoPersonagemEsperada: number, guardaConfirmada: boolean) => execute((basePayload) => aplicarDescansoGameplay(idMesa!, idMesaSessao!, {
      ...basePayload,
      idPersonagemJogador,
      idSistemaDescansoConfig,
      revisaoPersonagemEsperada,
      guardaConfirmada,
    })),
  };
};
