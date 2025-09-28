import { Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Page, Header, Body, Footer } from './Global Styles/Global.style.ts';
import { Navbar } from './components/Generic/Navbar/Navbar.tsx';
import { Toaster } from 'react-hot-toast';

function App() {

  const { theme, neon } = useSelector((state: any) => state.themesReducer);
  const location = useLocation();

  const isLoginPage = location.pathname === "/login";

  return (
    <Page theme={theme} neon={neon}>
      <Toaster position="top-right" reverseOrder={false} />
      {!isLoginPage && (<Header theme={theme} neon={neon}><Navbar /></Header>)}
      <Body isLoginPage={isLoginPage} theme={theme} neon={neon}><Outlet /></Body>
      {!isLoginPage && (<Footer theme={theme} neon={neon}><h2>Rodapé</h2></Footer>)}    
    </Page>
  );
}

export default App;