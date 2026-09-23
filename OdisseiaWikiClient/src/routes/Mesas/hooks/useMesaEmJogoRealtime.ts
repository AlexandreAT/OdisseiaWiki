import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { useEffect, useRef, useState } from 'react';
import { apiUrl } from '../../../axios/apiConfig';

export type MesaRealtimeStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected';

interface MesaPresencaAtualizada {
  idMesa: number;
  idsUsuariosOnline: number[];
  quantidadeUsuariosOnline: number;
  atualizadoEmUtc: string;
}

interface MesaInvalidada {
  idMesa: number;
  atualizadoEmUtc: string;
}

interface UseMesaEmJogoRealtimeOptions {
  idMesa?: number;
  enabled?: boolean;
  aoVivo?: boolean;
  onMesaInvalidada?: () => void | Promise<void>;
  onMesaRessincronizar?: () => void | Promise<void>;
  onAcessoRevogado?: () => void | Promise<void>;
}

interface UseMesaEmJogoRealtimeResult {
  status: MesaRealtimeStatus;
  conectado: boolean;
  idsUsuariosOnline: number[];
  quantidadeUsuariosOnline: number;
}

const mesaHubUrl = `${new URL(apiUrl).origin}/hubs/mesas`;

const normalizePresence = (
  presence: MesaPresencaAtualizada | null | undefined,
  idMesa: number,
): MesaPresencaAtualizada => {
  const ids = Array.from(new Set(
    (presence?.idsUsuariosOnline ?? []).filter((id) => Number.isInteger(id) && id > 0),
  ));

  return {
    idMesa,
    idsUsuariosOnline: ids,
    quantidadeUsuariosOnline: ids.length,
    atualizadoEmUtc: presence?.atualizadoEmUtc ?? new Date().toISOString(),
  };
};

export const useMesaEmJogoRealtime = ({
  idMesa,
  enabled = true,
  aoVivo = false,
  onMesaInvalidada,
  onMesaRessincronizar,
  onAcessoRevogado,
}: UseMesaEmJogoRealtimeOptions): UseMesaEmJogoRealtimeResult => {
  const [status, setStatus] = useState<MesaRealtimeStatus>('disconnected');
  const [presence, setPresence] = useState<MesaPresencaAtualizada | null>(null);
  const invalidationCallback = useRef(onMesaInvalidada);
  const resyncCallback = useRef(onMesaRessincronizar);
  const revokedCallback = useRef(onAcessoRevogado);

  useEffect(() => {
    invalidationCallback.current = onMesaInvalidada;
  }, [onMesaInvalidada]);

  useEffect(() => {
    resyncCallback.current = onMesaRessincronizar;
  }, [onMesaRessincronizar]);

  useEffect(() => {
    revokedCallback.current = onAcessoRevogado;
  }, [onAcessoRevogado]);

  useEffect(() => {
    if (!enabled || !idMesa || idMesa <= 0) {
      setStatus('disconnected');
      setPresence(null);
      return undefined;
    }

    let disposed = false;
    let accessRevoked = false;
    let inactiveDocument = document.visibilityState !== 'visible';
    let enteredMesa = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const connection: HubConnection = new HubConnectionBuilder()
      .withUrl(mesaHubUrl, {
        accessTokenFactory: () => localStorage.getItem('token') ?? '',
      })
      .configureLogging(import.meta.env.DEV ? LogLevel.Warning : LogLevel.Error)
      .withAutomaticReconnect([0, 2_000, 5_000, 10_000, 30_000])
      .build();

    const publishPresence = (value?: MesaPresencaAtualizada | null) => {
      if (disposed || (value && value.idMesa !== idMesa)) return;
      setPresence(normalizePresence(value, idMesa));
    };

    const observeMesa = async () => {
      await connection.invoke('ObservarMesa', idMesa);
    };

    const enterMesa = async () => {
      const snapshot = await connection.invoke<MesaPresencaAtualizada>(
        'EntrarNaMesa',
        idMesa,
      );
      enteredMesa = true;
      publishPresence(snapshot);
    };

    const leaveMesa = async () => {
      if (!enteredMesa) return;
      enteredMesa = false;
      try {
        await connection.invoke('SairDaMesa');
      } catch {
        // O OnDisconnectedAsync limpa a presença quando a conexão já caiu.
      }
    };

    const canConnect = () => !disposed
      && !accessRevoked
      && !inactiveDocument
      && document.visibilityState === 'visible';

    const scheduleInitialRetry = () => {
      if (!canConnect() || retryTimer) return;
      retryTimer = setTimeout(() => {
        retryTimer = undefined;
        void startConnection();
      }, 5_000);
    };

    const startConnection = async () => {
      if (
        !canConnect()
        || connection.state !== HubConnectionState.Disconnected
      ) return;
      setStatus('connecting');
      try {
        await connection.start();
        if (disposed) {
          await connection.stop();
          return;
        }
        await observeMesa();
        if (aoVivo) {
          try {
            await enterMesa();
          } catch {
            // A mesa pode ter sido encerrada entre o snapshot REST e o hub.
            // Mantemos a observação para receber a atualização que corrige o estado.
            await (resyncCallback.current ?? invalidationCallback.current)?.();
          }
        }
        setStatus('connected');
      } catch {
        if (!disposed) {
          setStatus('disconnected');
          scheduleInitialRetry();
        }
      }
    };

    connection.on('PresencaAtualizada', publishPresence);
    connection.on('MesaInvalidada', (event: MesaInvalidada) => {
      if (!disposed && event?.idMesa === idMesa) {
        void invalidationCallback.current?.();
      }
    });
    connection.on('AcessoRevogado', (event: MesaInvalidada) => {
      if (disposed || event?.idMesa !== idMesa) return;
      accessRevoked = true;
      setStatus('disconnected');
      setPresence(null);
      void revokedCallback.current?.();
      void connection.stop();
    });

    connection.onreconnecting(() => {
      if (!disposed) setStatus('reconnecting');
    });
    connection.onreconnected(async () => {
      if (disposed) return;
      try {
        await observeMesa();
        if (aoVivo && !inactiveDocument && document.visibilityState === 'visible') {
          await enterMesa();
        }
        setStatus('connected');
        await (resyncCallback.current ?? invalidationCallback.current)?.();
      } catch {
        setStatus('disconnected');
        await connection.stop();
        scheduleInitialRetry();
      }
    });
    connection.onclose(() => {
      enteredMesa = false;
      if (!disposed) {
        setStatus('disconnected');
        setPresence(null);
        scheduleInitialRetry();
      }
    });

    const stopForInactiveDocument = () => {
      inactiveDocument = true;
      void (async () => {
        await leaveMesa();
        if (connection.state !== HubConnectionState.Disconnected) {
          await connection.stop();
        }
      })();
    };

    const resumeForActiveDocument = () => {
      inactiveDocument = false;
      void startConnection();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resumeForActiveDocument();
      } else {
        stopForInactiveDocument();
      }
    };

    void startConnection();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', stopForInactiveDocument);
    window.addEventListener('focus', resumeForActiveDocument);

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', stopForInactiveDocument);
      window.removeEventListener('focus', resumeForActiveDocument);
      connection.off('PresencaAtualizada');
      connection.off('MesaInvalidada');
      connection.off('AcessoRevogado');

      void leaveMesa().finally(() => connection.stop());
    };
  }, [aoVivo, enabled, idMesa]);

  return {
    status,
    conectado: status === 'connected',
    idsUsuariosOnline: presence?.idsUsuariosOnline ?? [],
    quantidadeUsuariosOnline: presence?.quantidadeUsuariosOnline ?? 0,
  };
};
