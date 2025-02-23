import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Page, Header, Body, Footer } from './styles/Global.style';
import Navbar from './components/Navbar';

function App() {

  const { theme, neon } = useSelector((state: any) => state.themesReducer);

  return (
    <Page theme={theme} neon={neon}>
      <Header theme={theme} neon={neon}><Navbar /></Header>
      <Body theme={theme} neon={neon}><Outlet /></Body>
      <Footer theme={theme} neon={neon}><h2>Rodapé</h2></Footer>    
    </Page>
  );
}

export default App;