import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Page, Header, Body, Footer } from './Global Styles/Global.style.ts';
import { Navbar } from './components/Generic/Navbar/Navbar.tsx';
import { Toaster } from 'react-hot-toast';
import { ServerStatusNotice } from './components/Generic/ServerStatusNotice/ServerStatusNotice.tsx';

function App() {

  const { theme, neon } = useSelector((state: any) => state.themesReducer);
  const location = useLocation();

  const isLoginPage = location.pathname === "/login";
  const isWikiPage = location.pathname.startsWith('/wiki');

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search]);

  return (
    <Page theme={theme} neon={neon}>
      <Toaster position="top-right" reverseOrder={false} />
      <ServerStatusNotice />
      {!isLoginPage && (<Header theme={theme} neon={neon}><Navbar /></Header>)}
      <Body isLoginPage={isLoginPage} isWikiPage={isWikiPage} theme={theme} neon={neon}><Outlet /></Body>
      {!isLoginPage && (<Footer theme={theme} neon={neon}><h2>Rodapé</h2></Footer>)}    
    </Page>
  );
}

export default App;
