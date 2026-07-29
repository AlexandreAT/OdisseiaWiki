import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  getApiAvailabilityStatus,
  subscribeToApiAvailability,
  wakeApiServer,
} from '../../../services/apiAvailability';
import {
  NoticeAction,
  NoticeActions,
  NoticeContent,
  NoticeHelpButton,
  NoticeSpinner,
  NoticeWrapper,
  ServerInfoContent,
} from './ServerStatusNotice.style';
import { Modal } from '../Modal/Modal';

export const ServerStatusNotice = () => {
  const [status, setStatus] = useState(getApiAvailabilityStatus);
  const [showServerInfo, setShowServerInfo] = useState(false);
  const { theme, neon } = useSelector((state: any) => state.themesReducer);

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
    <NoticeWrapper
      role="status"
      aria-live="polite"
      $error={status === 'unavailable'}
      $modalOpen={showServerInfo}
    >
      {status === 'starting' && <NoticeSpinner aria-hidden="true" />}
      <NoticeContent>
        <strong>{status === 'starting' ? 'Iniciando o servidor...' : 'Servidor temporariamente indisponível'}</strong>
        <span>
          {status === 'starting'
            ? 'A conex\u00e3o est\u00e1 sendo preparada. Isso pode levar alguns segundos.'
            : 'Confira sua conexão e tente novamente.'}
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
              do serviço. Os dados permanecem preservados, mas a API pode levar alguns segundos
              para ficar pronta e responder normalmente.
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
