import { useEffect, useState } from 'react';
import {
  getApiAvailabilityStatus,
  subscribeToApiAvailability,
  wakeApiServer,
} from '../../../services/apiAvailability';
import {
  NoticeAction,
  NoticeContent,
  NoticeSpinner,
  NoticeWrapper,
} from './ServerStatusNotice.style';

export const ServerStatusNotice = () => {
  const [status, setStatus] = useState(getApiAvailabilityStatus);

  useEffect(() => {
    const unsubscribe = subscribeToApiAvailability(setStatus);

    if (import.meta.env.PROD) {
      void wakeApiServer().catch(() => undefined);
    }

    return unsubscribe;
  }, []);

  if (status === 'idle') return null;

  const handleRetry = async () => {
    try {
      await wakeApiServer({ announceDelayMs: 0 });
      window.location.reload();
    } catch {
      // The shared service keeps the controlled unavailable state visible.
    }
  };

  return (
    <NoticeWrapper role="status" aria-live="polite" $error={status === 'unavailable'}>
      {status === 'starting' && <NoticeSpinner aria-hidden="true" />}
      <NoticeContent>
        <strong>{status === 'starting' ? 'Iniciando o servidor...' : 'Servidor temporariamente indisponível'}</strong>
        <span>
          {status === 'starting'
            ? 'No plano gratuito isso pode levar alguns segundos.'
            : 'Confira sua conexão e tente novamente.'}
        </span>
      </NoticeContent>
      {status === 'unavailable' && (
        <NoticeAction type="button" onClick={handleRetry}>Tentar novamente</NoticeAction>
      )}
    </NoticeWrapper>
  );
};
