import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './redux/store.ts';
import ErrorPage from './routes/Error/ErrorPage.tsx';
import Home from './routes/Home/Home.tsx';
import Login from './routes/Login/Login.tsx';
import Wiki from './routes/Wiki/Wiki.tsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Management } from './routes/Management/Management.tsx';
import { Hub } from './routes/Hub/Hub.tsx';
import PersonagemPage from './routes/Personagem/PersonagemPage';

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
          element: <Home />
        },
        {
          path: 'login',
          element: <Login />
        },
        {
          path: 'wiki',
          element: <Wiki />,
          children: [
            {
              path: ':slug',
              element: <Wiki />
            }
          ]
        },
        {
          path: 'management',
          element: <Management />
        },
        {
          path: 'hub',
          element: <Hub />
        },
        {
          path: 'personagem/:id',
          element: <PersonagemPage />
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
    <GoogleOAuthProvider clientId="1000361239674-p29f1mb5mdardrmucofq5m2r0v340nu2.apps.googleusercontent.com">
      <Provider store = {store}>
        <RouterProvider router={router} />
      </Provider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
