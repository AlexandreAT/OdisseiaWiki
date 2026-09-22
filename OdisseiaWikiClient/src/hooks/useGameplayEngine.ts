import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  GameplayCommandResponse,
  GameplayEvent,
  GameplayManualRecordRequest,
  GameplayRollRequest,
  GameplaySession,
} from '../models/Gameplay';
import {
  criarRegistroManualGameplay,
  criarRolagemGameplay,
  listarEventosGameplay,
  obterSessaoGameplayAtual,
  simularRolagemGameplay,
} from '../services/gameplayService';
import { getApiErrorMessage } from '../utils/apiError';

interface UseGameplayEngineOptions {
  idMesa?: number;
  enabled?: boolean;
  mesaAoVivo?: boolean;
}

const mergeEvents = (current: GameplayEvent[], incoming: GameplayEvent[]) => {
  const byId = new Map<number, GameplayEvent>();
  [...current, ...incoming].forEach((event) => byId.set(event.idEvento, event));
  return [...byId.values()].sort((left, right) => left.sequencia - right.sequencia);
};

export const useGameplayEngine = ({
  idMesa,
  enabled = true,
  mesaAoVivo = false,
}: UseGameplayEngineOptions) => {
  const [session, setSession] = useState<GameplaySession | null>(null);
  const [events, setEvents] = useState<GameplayEvent[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const sessionIdRef = useRef<number | null>(null);
  const sessionLoadSequenceRef = useRef(0);

  const consumePage = useCallback((page: Awaited<ReturnType<typeof listarEventosGameplay>>) => {
    setEvents((current) => mergeEvents(current, page.itens ?? []));
    cursorRef.current = page.proximoCursor ?? cursorRef.current;
    setHasMore(Boolean(page.haMais));
  }, []);

  const loadNewEvents = useCallback(async (mesaId: number, sessionId: number, sequence: number) => {
    let cursor = cursorRef.current;
    // O feed ao vivo não pode ficar preso nas primeiras páginas de uma sessão longa.
    // O limite evita esgotar a cota de leitura em históricos excepcionalmente grandes.
    for (let pageIndex = 0; pageIndex < 10; pageIndex += 1) {
      const page = await listarEventosGameplay(mesaId, sessionId, cursor, 100);
      if (sequence !== sessionLoadSequenceRef.current || sessionIdRef.current !== sessionId) return;
      consumePage(page);
      if (!page.haMais || !page.proximoCursor || page.proximoCursor === cursor) return;
      cursor = page.proximoCursor;
    }
  }, [consumePage]);

  const loadSession = useCallback(async (resetHistory = false) => {
    const sequence = ++sessionLoadSequenceRef.current;
    if (!enabled || !idMesa || idMesa <= 0 || !mesaAoVivo) {
      setSession(null);
      setEvents([]);
      sessionIdRef.current = null;
      cursorRef.current = null;
      setHasMore(false);
      setLoading(false);
      return { session: null, loadedHistory: false };
    }

    const currentSession = await obterSessaoGameplayAtual(idMesa);
    if (sequence !== sessionLoadSequenceRef.current) return { session: null, loadedHistory: false };
    const changedSession = currentSession?.idMesaSessao !== sessionIdRef.current;
    setSession(currentSession);

    if (!currentSession) {
      sessionIdRef.current = null;
      cursorRef.current = null;
      setEvents([]);
      setHasMore(false);
      return { session: null, loadedHistory: false };
    }

    if (resetHistory || changedSession) {
      sessionIdRef.current = currentSession.idMesaSessao;
      cursorRef.current = null;
      setEvents([]);
      await loadNewEvents(idMesa, currentSession.idMesaSessao, sequence);
    }

    return { session: currentSession, loadedHistory: resetHistory || changedSession };
  }, [enabled, idMesa, loadNewEvents, mesaAoVivo]);

  const refresh = useCallback(async (showError = true) => {
    if (!enabled || !idMesa || idMesa <= 0) return;
    try {
      const { session: currentSession, loadedHistory } = await loadSession(false);
      setError(null);
      if (!currentSession || loadedHistory || currentSession.idMesaSessao !== sessionIdRef.current) return;
      await loadNewEvents(idMesa, currentSession.idMesaSessao, sessionLoadSequenceRef.current);
    } catch (requestError) {
      if (showError) setError(getApiErrorMessage(requestError, 'Não foi possível atualizar as ações.'));
    }
  }, [enabled, idMesa, loadNewEvents, loadSession]);

  useEffect(() => {
    let disposed = false;
    setLoading(true);
    setError(null);
    loadSession(true)
      .catch((requestError) => {
        if (!disposed) {
          setError(getApiErrorMessage(requestError, 'Não foi possível carregar as ações.'));
        }
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    return () => { disposed = true; };
  }, [loadSession]);

  useEffect(() => {
    if (!enabled || !idMesa) return undefined;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh(false);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [enabled, idMesa, refresh]);

  const consumeCommand = useCallback((response: GameplayCommandResponse) => {
    if (response.evento) {
      setEvents((current) => mergeEvents(current, [response.evento as GameplayEvent]));
    }
    setSession((current) => current ? {
      ...current,
      revisaoEstado: response.revisaoSessao,
      ultimaSequenciaEvento: response.ultimaSequenciaEvento,
    } : current);
    return response;
  }, []);

  const resolveSessionForWrite = useCallback(async () => {
    if (session || !mesaAoVivo || !idMesa) return session;
    try {
      const recovered = await obterSessaoGameplayAtual(idMesa);
      if (recovered) {
        setSession(recovered);
        setError(null);
      }
      return recovered;
    } catch (requestError) {
      throw new Error(`A sessão ao vivo não pôde ser consultada. ${getApiErrorMessage(requestError, 'Tente atualizar a Mesa.')}`);
    }
  }, [idMesa, mesaAoVivo, session]);

  const roll = useCallback(async (payload: GameplayRollRequest) => {
    if (!idMesa) throw new Error('Mesa inválida.');
    setSubmitting(true);
    try {
      const activeSession = await resolveSessionForWrite();
      if (!activeSession) {
        if (!payload.idPersonagemJogador) throw new Error('Selecione um personagem para o teste.');
        const simulation = await simularRolagemGameplay(payload.idPersonagemJogador, payload);
        return {
          idComando: 0,
          replay: false,
          idMesaSessao: 0,
          revisaoMesa: 0,
          revisaoSessao: 0,
          ultimaSequenciaEvento: 0,
          rolagem: simulation.rolagem,
          simulacao: true,
          aviso: simulation.aviso,
        } satisfies GameplayCommandResponse;
      }
      const response = await criarRolagemGameplay(idMesa, activeSession.idMesaSessao, payload);
      return consumeCommand(response);
    } finally {
      setSubmitting(false);
    }
  }, [consumeCommand, idMesa, resolveSessionForWrite]);

  const recordManual = useCallback(async (payload: GameplayManualRecordRequest) => {
    if (!idMesa) throw new Error('Mesa inválida.');
    setSubmitting(true);
    try {
      const activeSession = await resolveSessionForWrite();
      if (!activeSession) {
        const now = new Date().toISOString();
        return {
          idComando: 0,
          replay: false,
          idMesaSessao: 0,
          revisaoMesa: 0,
          revisaoSessao: 0,
          ultimaSequenciaEvento: 0,
          simulacao: true,
          aviso: 'Prévia local: o registro não foi salvo.',
          evento: {
            idMesaEvento: 0,
            idEvento: 0,
            idMesaSessao: 0,
            sequencia: 0,
            tipo: 'REGISTRO_MANUAL',
            origem: 'Manual',
            titulo: payload.rotulo,
            descricao: payload.observacao,
            idPersonagemJogador: payload.idPersonagemJogador,
            visibilidade: payload.visibilidade,
            manual: true,
            resultadoSemantico: payload.resultadoSemantico,
            valorAssociado: payload.valorAssociado,
            categoria: payload.categoria,
            observacao: payload.observacao,
            ocorreuEmUtc: now,
            criadoEmUtc: now,
            oculto: false,
          },
        } satisfies GameplayCommandResponse;
      }
      const response = await criarRegistroManualGameplay(idMesa, activeSession.idMesaSessao, payload);
      return consumeCommand(response);
    } finally {
      setSubmitting(false);
    }
  }, [consumeCommand, idMesa, resolveSessionForWrite]);

  const loadMore = useCallback(async () => {
    if (!idMesa || !session || !hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await listarEventosGameplay(
        idMesa,
        session.idMesaSessao,
        cursorRef.current,
      );
      consumePage(page);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Não foi possível carregar mais registros.'));
    } finally {
      setLoadingMore(false);
    }
  }, [consumePage, hasMore, idMesa, loadingMore, session]);

  return {
    session,
    events,
    loading,
    loadingMore,
    submitting,
    error,
    hasMore,
    refresh,
    roll,
    recordManual,
    loadMore,
  };
};
