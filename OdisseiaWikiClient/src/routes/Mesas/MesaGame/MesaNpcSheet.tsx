import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowBack } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { LoadingIndicator } from '../../../components/Generic/LoadingIndicator';
import type { PersonagemJogador } from '../../../models/PersonagemJogador';
import { getPersonagemJogadorById } from '../../../services/personagemJogadorService';
import { obterMesaAoVivo } from '../../../services/mesaService';
import { getAuthSession } from '../../../services/authSession';
import { getApiErrorMessage } from '../../../utils/apiError';
import type { MesaThemeState } from '../MesaThemeState';
import { BackButtonDiv, Main, StyledIconButton, Title } from '../../Hub/UserCharacters/UserCharacters.style';

const CharacterEdit = lazy(() => import('../../Hub/UserCharacters/CharacterEdit/CharacterEdit').then((module) => ({
  default: module.CharacterEdit,
})));

const currentUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('usuario') || 'null');
    return Number(user?.id ?? user?.idusuario ?? user?.idUsuario ?? 0);
  } catch {
    return 0;
  }
};

/** Usa o mesmo editor da ficha, sem passar pela navegação de personagens do jogador. */
export const MesaNpcSheet = () => {
  const { id, characterId } = useParams();
  const mesaId = Number(id);
  const npcId = Number(characterId);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme, neon } = useSelector((state: MesaThemeState) => state.themesReducer);
  const [character, setCharacter] = useState<PersonagemJogador | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setCharacter(null);
    if (!Number.isInteger(mesaId) || !Number.isInteger(npcId) || mesaId <= 0 || npcId <= 0) {
      setError('Ficha do NPC não encontrada.');
      setLoading(false);
      return;
    }
    Promise.all([obterMesaAoVivo(mesaId), getPersonagemJogadorById(npcId)])
      .then(([snapshot, loaded]) => {
        if (!active) return;
        const session = getAuthSession(localStorage.getItem('token'));
        const isAdmin = session.status === 'authenticated'
          && session.roles.some((role) => role.toLowerCase() === 'admin');
        if ((!isAdmin && snapshot.mesa.papelUsuario !== 'Mestre')
          || !loaded || Number(loaded.idmesa) !== mesaId || !loaded.idPersonagemOrigem) {
          setError('Esta ficha não está disponível para edição nesta Mesa.');
          return;
        }
        setCharacter(loaded);
      })
      .catch((requestError) => {
        if (active) setError(getApiErrorMessage(requestError, 'Não foi possível carregar a ficha do NPC.'));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [mesaId, npcId]);

  const goBack = () => navigate(`/mesa/${mesaId}/jogo`);
  if (loading) return <LoadingIndicator label="Carregando ficha" />;
  return (
    <Main>
      <BackButtonDiv theme={theme} neon={neon}>
        <StyledIconButton theme={theme} neon={neon} onClick={goBack} title="Voltar à Mesa">
          <ArrowBack className="icon" />
        </StyledIconButton>
      </BackButtonDiv>
      <Title theme={theme} neon={neon} $editMode>Ficha do NPC</Title>
      {error && <p role="alert">{error}</p>}
      {character && <Suspense fallback={<LoadingIndicator label="Carregando ficha" />}>
        <CharacterEdit
          theme={theme}
          neon={neon}
          personagem={character}
          userId={currentUserId()}
          initialStep={searchParams.get('step') === '1' ? 1 : 2}
          onBack={goBack}
        />
      </Suspense>}
    </Main>
  );
};
