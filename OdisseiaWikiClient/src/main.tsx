import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Importações
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './redux/store.ts'
import ErrorPage from './routes/ErrorPage.tsx'
import Home from './routes/Home.tsx'
import Login from './routes/Login.tsx'
import Register from './routes/Register.tsx'
import Wiki from './routes/Wiki.tsx'
import CharacterWiki from './routes/CharacterWiki.tsx'

const router = createBrowserRouter([{
  path: '/',
  element: <App />,
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
      path: 'register',
      element: <Register />
    },
    {
      path: 'wiki',
      element: <Wiki />
    },
    {
      path: 'characters',
      element: <CharacterWiki />
    }
  ]
}])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store = {store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>,
)