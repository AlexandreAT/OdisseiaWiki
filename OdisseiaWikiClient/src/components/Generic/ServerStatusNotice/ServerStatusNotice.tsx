import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  wakeApiServer,
} from '../../../services/apiAvailability';
import { useApiAvailabilityStatus } from '../../../hooks/useApiAvailabilityStatus';
import {
  NoticeAction,
  NoticeActions,
  NoticeContent,
  NoticeHelpButton,
  NoticeWrapper,
  ServerInfoContent,
} from './ServerStatusNotice.style';
import { Modal } from '../Modal/Modal';
import { LoadingIndicator } from '../LoadingIndicator';

interface RootState {
  themesReducer: {
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
  };
}

export const ServerStatusNotice = () => {
  const status = useApiAvailabilityStatus();
  const [showServerInfo, setShowServerInfo] = useState(false);
  const previousStatusRef = useRef(status);
  const { theme, neon } = useSelector((state: RootState) => state.themesReducer);

  useEffect(() => {
    if (import.meta.env.PROD) {
      void wakeApiServer().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    const previousStatus = previousStatusRef.current;
    previousStatusRef.current = status;

    if (previousStatus === 'starting' && status === 'idle') {
      window.location.reload();
    }
  }, [status]);

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
    <NoticeWrapper
      role="status"
      aria-live="polite"
      $error={status === 'unavailable'}
      $modalOpen={showServerInfo}
    >
      <NoticeContent>
        <strong>
          {status === 'starting'
            ? <LoadingIndicator compact label="Iniciando o servidor" />
            : 'Servidor temporariamente indisponível'}
        </strong>
        <span>
          {status === 'starting'
            ? 'A conexão e o banco estão sendo preparados. Isso costuma levar cerca de um minuto.'
            : 'O servidor ou o banco não responderam a tempo. Tente novamente.'}
        </span>
      </NoticeContent>
      <NoticeActions>
        <NoticeHelpButton
          type="button"
          onClick={() => setShowServerInfo(true)}
          aria-label="Entenda por que o servidor precisa ser iniciado"
          title="Por que o servidor precisa ser iniciado?"
        >
          ?
        </NoticeHelpButton>
        {status === 'unavailable' && (
          <NoticeAction type="button" onClick={handleRetry}>Tentar novamente</NoticeAction>
        )}
      </NoticeActions>
      {showServerInfo && (
        <Modal
          title="Por que o servidor precisa iniciar?"
          theme={theme}
          neon={neon}
          onClose={() => setShowServerInfo(false)}
          showFooter={false}
          width="560px"
          mobileInset
        >
          <ServerInfoContent>
            <p>
              O OdisseiaWiki está hospedado em um plano gratuito. Para economizar recursos,
              o provedor suspende o backend depois de um período sem acessos.
            </p>
            <p>
              Quando alguém entra novamente, a primeira solicitação inicia uma nova instância
              do serviço. Os dados permanecem preservados, mas a API e o banco podem levar cerca
              de um minuto, ou um pouco mais, para responder normalmente.
            </p>
            <p>
              Essa espera é uma limitação do ambiente de hospedagem atual e não indica um
              problema no seu dispositivo ou na sua conexão.
            </p>
          </ServerInfoContent>
        </Modal>
      )}
    </NoticeWrapper>
  );
};
