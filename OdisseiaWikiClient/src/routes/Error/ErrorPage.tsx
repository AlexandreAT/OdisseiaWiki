import { BiArrowBack, BiBookOpen, BiErrorAlt } from 'react-icons/bi';
import { isRouteErrorResponse, useLocation, useRouteError } from 'react-router-dom';
import {
  ErrorActions,
  ErrorDescription,
  ErrorIcon,
  ErrorPageContainer,
  ErrorPanel,
  ErrorTitle,
  ErrorActionButton,
} from './ErrorPage.style';

interface ErrorLocationState {
  errorTitle?: string;
  errorDescription?: string;
}

const getPathContext = (pathname: string): ErrorLocationState => {
  if (pathname.startsWith('/cidade/')) {
    return {
      errorTitle: 'Página de cidade ainda não disponível',
      errorDescription: 'A página dinâmica desta cidade está em desenvolvimento.',
    };
  }

  if (pathname.startsWith('/raca/')) {
    return {
      errorTitle: 'Página de raça ainda não disponível',
      errorDescription: 'A página dinâmica desta raça está em desenvolvimento.',
    };
  }

  if (pathname.startsWith('/item/')) {
    return {
      errorTitle: 'Página de item ainda não disponível',
      errorDescription: 'A página dinâmica deste item está em desenvolvimento.',
    };
  }

  return {
    errorTitle: 'Ocorreu um erro',
    errorDescription: 'Não foi possível encontrar ou carregar o conteúdo solicitado.',
  };
};

const ErrorPage = () => {
  const location = useLocation();
  const routeError = useRouteError();
  const locationState = location.state as ErrorLocationState | null;
  const pathContext = getPathContext(location.pathname);
  const responseDescription = isRouteErrorResponse(routeError)
    ? `Erro ${routeError.status}: ${routeError.statusText || 'não foi possível concluir a solicitação.'}`
    : undefined;

  const title = locationState?.errorTitle ?? pathContext.errorTitle;
  const description = locationState?.errorDescription
    ?? responseDescription
    ?? pathContext.errorDescription;

  const handleBack = () => {
    if (document.referrer) {
      const previousUrl = new URL(document.referrer);
      if (previousUrl.origin === window.location.origin) {
        window.location.assign(previousUrl.href);
        return;
      }
    }

    window.location.assign('/');
  };

  const handleWiki = () => window.location.assign('/wiki/MainPage');

  return (
    <ErrorPageContainer>
      <ErrorPanel>
        <ErrorIcon aria-hidden="true">
          <BiErrorAlt />
        </ErrorIcon>
        <ErrorTitle>{title}</ErrorTitle>
        <ErrorDescription>{description}</ErrorDescription>
        <ErrorActions>
          <ErrorActionButton type="button" onClick={handleBack}>
            <BiArrowBack />
            Voltar
          </ErrorActionButton>
          <ErrorActionButton type="button" $primary onClick={handleWiki}>
            <BiBookOpen />
            Ir para a Wiki
          </ErrorActionButton>
        </ErrorActions>
      </ErrorPanel>
    </ErrorPageContainer>
  );
};

export default ErrorPage;
