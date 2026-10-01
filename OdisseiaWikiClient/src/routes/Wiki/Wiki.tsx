import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { WikiContainer } from './components/WikiContainer/WikiContainer';
import { WikiPageContainer } from './Wiki.style';
import { getMesaWikiIdFromPath, getMesaWikiRoute } from '../../services/wikiContext';

const Wiki = () => {
  const navigate = useNavigate();

  const { slug } = useParams<{ slug?: string }>();

  const [searchParams] = useSearchParams();

  const isWikiDaMesa = getMesaWikiIdFromPath() !== null;

  const { theme, neon } = useSelector(
    (state: any) => state.themesReducer
  );

  useEffect(() => {
    // A Wiki global continua abrindo a MainPage. Já uma Mesa pode não possuir
    // página inicial — nesse caso, a própria Wiki apresenta o estado vazio.
    if (!isWikiDaMesa && !slug && !searchParams.has('q') && !searchParams.has('type')) {
      navigate(getMesaWikiRoute('/wiki/MainPage'), { replace: true });
    }
  }, [isWikiDaMesa, slug, searchParams, navigate]);

  return (
    <WikiPageContainer
      theme={theme}
      neon={neon}
    >
      <WikiContainer />
    </WikiPageContainer>
  );
};

export default Wiki;
