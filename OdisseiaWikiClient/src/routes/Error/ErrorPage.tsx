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
      errorTitle: 'Cidade não encontrada',
      errorDescription: 'Não foi possível carregar os dados desta cidade.',
    };
  }

  if (pathname.startsWith('/raca/')) {
    return {
      errorTitle: 'Raça não encontrada',
      errorDescription: 'Não foi possível carregar os dados desta raça.',
    };
  }

  if (pathname.startsWith('/item/')) {
    return {
      errorTitle: 'Item não encontrado',
      errorDescription: 'Não foi possível carregar os dados deste item.',
    };
  }

  if (pathname.startsWith('/mesa/')) {
    return {
      errorTitle: 'Página de mesa ainda não disponível',
      errorDescription: 'A página dinâmica desta mesa está em desenvolvimento.',
    };
  }

  if (pathname.startsWith('/sistema/')) {
    return {
      errorTitle: 'Página de sistema ainda não disponível',
      errorDescription: 'Esta página dinâmica do sistema de RPG está em desenvolvimento.',
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

  return (
    <ErrorPageContainer>
      <ErrorPanel>
        <ErrorIcon aria-hidden="true">
          <BiErrorAlt />
        </ErrorIcon>
        <ErrorTitle>{title}</ErrorTitle>
        <ErrorDescription>{description}</ErrorDescription>
        <ErrorActions>
          <ErrorActionButton href="/">
            <BiArrowBack />
            Voltar
          </ErrorActionButton>
          <ErrorActionButton
            href="/wiki/MainPage"
            $primary
          >
            <BiBookOpen />
            Ir para a Wiki
          </ErrorActionButton>
        </ErrorActions>
      </ErrorPanel>
    </ErrorPageContainer>
  );
};

export default ErrorPage;
