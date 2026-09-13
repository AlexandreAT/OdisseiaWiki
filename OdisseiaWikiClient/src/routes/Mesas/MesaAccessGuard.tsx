import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAuthSession } from '../../services/authSession';

export const MesaAccessGuard = ({ children }: PropsWithChildren) => {
  const location = useLocation();
  const session = getAuthSession(localStorage.getItem('token'));

  if (session.status === 'anonymous') {
    return (
      <Navigate
        to="/login"
        replace
        state={{ returnTo: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  return children;
};
