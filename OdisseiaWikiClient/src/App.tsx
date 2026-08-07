import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Page, Header, Body } from './Global Styles/Global.style.ts';
import { Navbar } from './components/Generic/Navbar/Navbar.tsx';
import { Footer } from './components/Generic/Footer';
import toast, { Toaster } from 'react-hot-toast';
import { ServerStatusNotice } from './components/Generic/ServerStatusNotice/ServerStatusNotice.tsx';
import { consumeSessionExpiredMessage } from './services/authSession.ts';

interface RootState {
  themesReducer: {
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
  };
}

function App() {

  const { theme, neon } = useSelector((state: RootState) => state.themesReducer);
  const location = useLocation();

  const isLoginPage = location.pathname === "/login";
  const isWikiPage = location.pathname.startsWith('/wiki');

  useEffect(() => {
    if (location.hash) {
      const targetId = decodeURIComponent(location.hash.slice(1));
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let frameId = 0;
      let remainingAttempts = 60;

      const scrollToTarget = () => {
        const target = document.getElementById(targetId);

        if (target) {
          target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
          return;
        }

        remainingAttempts -= 1;
        if (remainingAttempts > 0) frameId = window.requestAnimationFrame(scrollToTarget);
      };

      scrollToTarget();
      return () => window.cancelAnimationFrame(frameId);
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    const sessionMessage = consumeSessionExpiredMessage();
    if (sessionMessage) toast.error(sessionMessage, { id: 'session-expired' });
  }, []);

  return (
    <Page theme={theme} neon={neon}>
      <Toaster position="top-right" reverseOrder={false} />
      <ServerStatusNotice />
      {!isLoginPage && (<Header theme={theme} neon={neon}><Navbar /></Header>)}
      <Body isLoginPage={isLoginPage} isWikiPage={isWikiPage} theme={theme} neon={neon}><Outlet /></Body>
      {!isLoginPage && <Footer theme={theme} neon={neon} />}
    </Page>
  );
}

export default App;
