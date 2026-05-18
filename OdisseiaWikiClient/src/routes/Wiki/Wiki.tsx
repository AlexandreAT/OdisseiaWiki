import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { WikiContainer } from './components/WikiContainer/WikiContainer';
import { WikiPageContainer } from './Wiki.style';

const Wiki = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams] = useSearchParams();
  const { theme, neon } = useSelector((state: any) => state.themesReducer);

  useEffect(() => {
    if (!slug && !searchParams.has('q')) {
      navigate('/wiki/MainPage');
    }
  }, [slug, searchParams, navigate]);

  return (
    <WikiPageContainer theme={theme} neon={neon}>
      <WikiContainer />
    </WikiPageContainer>
  );
};

export default Wiki;