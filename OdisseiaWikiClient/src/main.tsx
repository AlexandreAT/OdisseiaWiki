import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './redux/store.ts';
import ErrorPage from './routes/Error/ErrorPage.tsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { RouteLoading } from './components/Generic/RouteLoading/RouteLoading.tsx';

const Home = lazy(() => import('./routes/Home/Home.tsx'));
const Login = lazy(() => import('./routes/Login/Login.tsx'));
const Wiki = lazy(() => import('./routes/Wiki/Wiki.tsx'));
const Management = lazy(() => import('./routes/Management/Management.tsx').then(module => ({
  default: module.Management,
})));
const Hub = lazy(() => import('./routes/Hub/Hub.tsx').then(module => ({
  default: module.Hub,
})));
const PersonagemPage = lazy(() => import('./routes/Personagem/PersonagemPage'));
const CidadePage = lazy(() => import('./routes/Cidade/CidadePage'));
const RacaPage = lazy(() => import('./routes/Raca/RacaPage'));
const ItemPage = lazy(() => import('./routes/Item/ItemPage'));

const withRouteLoading = (element: React.ReactNode) => (
  <Suspense fallback={<RouteLoading />}>{element}</Suspense>
);

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  throw new Error('VITE_GOOGLE_CLIENT_ID não foi configurado.');
}

const router = createBrowserRouter([{
  path: '/',
  element: <App />,
  errorElement: <ErrorPage />,
  children: [
    {
      errorElement: <ErrorPage />,
      children: [
        {
          path: '/',
          element: withRouteLoading(<Home />)
        },
        {
          path: 'login',
          element: withRouteLoading(<Login />)
        },
        {
          path: 'wiki',
          element: withRouteLoading(<Wiki />),
          children: [
            {
              path: ':slug',
              element: withRouteLoading(<Wiki />)
            }
          ]
        },
        {
          path: 'management',
          element: withRouteLoading(<Management />)
        },
        {
          path: 'hub',
          element: withRouteLoading(<Hub />)
        },
        {
          path: 'personagem/:id',
          element: withRouteLoading(<PersonagemPage />)
        },
        {
          path: 'cidade/:id',
          element: withRouteLoading(<CidadePage />)
        },
        {
          path: 'raca/:id',
          element: withRouteLoading(<RacaPage />)
        },
        {
          path: 'item/:id',
          element: withRouteLoading(<ItemPage />)
        },
        {
          path: 'erro',
          element: <ErrorPage />
        },
        {
          path: '*',
          element: <ErrorPage />
        }
      ]
    }
  ]
}])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <Provider store = {store}>
        <RouterProvider router={router} />
      </Provider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
