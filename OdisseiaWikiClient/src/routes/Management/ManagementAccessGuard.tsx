import { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAuthSession } from '../../services/authSession';

const ADMIN_ROLE = 'Admin';

export const ManagementAccessGuard = ({ children }: PropsWithChildren) => {
  const location = useLocation();
  const session = getAuthSession(localStorage.getItem('token'));

  if (session.status === 'anonymous') {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;

    return <Navigate to="/login" replace state={{ returnTo }} />;
  }

  if (!session.roles.includes(ADMIN_ROLE)) {
    return (
      <Navigate
        to="/erro"
        replace
        state={{
          errorTitle: 'Acesso negado',
          errorDescription: 'Sua conta não possui permissão para acessar o gerenciamento.',
        }}
      />
    );
  }

  return children;
};
