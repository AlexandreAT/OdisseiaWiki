import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GameCharacterOption, GameRunDto } from '../../../models/GameRun';
import type { GameAdventure } from '../../../models/GameModeManagement';
import { abandonGameRun, createGameRun, getActiveGameRun, getGameCharacters, getCharacterGames } from '../../../services/gameRunService';
import { getApiErrorMessage } from '../../../utils/apiError';

const isConflict = (error: unknown) => (
  (error as { response?: { status?: number } } | null)?.response?.status === 409
);

export const useGameLanding = () => {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<GameCharacterOption[]>([]);
  const [activeRun, setActiveRun] = useState<GameRunDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingCharacterId, setCreatingCharacterId] = useState<number | null>(null);
  const [gameChoices, setGameChoices] = useState<{ characterId: number; games: GameAdventure[] } | null>(null);
  const [abandoning, setAbandoning] = useState(false);
  const [abandonDialogOpen, setAbandonDialogOpen] = useState(false);
  const [abandonError, setAbandonError] = useState<string | null>(null);
  const [charactersError, setCharactersError] = useState<string | null>(null);
  const [activeRunError, setActiveRunError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const pendingCreate = useRef<{ characterId: number; code?: string; key: string } | null>(null);
  const creatingRef = useRef(false);
  const pendingAbandon = useRef<{ revision: number; key: string } | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    const [charactersResult, activeResult] = await Promise.allSettled([
      getGameCharacters(),
      getActiveGameRun(),
    ]);

    if (charactersResult.status === 'fulfilled') {
      setCharacters(charactersResult.value);
      setCharactersError(null);
    } else {
      setCharactersError(getApiErrorMessage(
        charactersResult.reason,
        'Não foi possível carregar seus personagens.',
      ));
    }

    if (activeResult.status === 'fulfilled') {
      setActiveRun(activeResult.value);
      setActiveRunError(null);
    } else {
      setActiveRunError(getApiErrorMessage(
        activeResult.reason,
        'Não foi possível consultar sua run ativa.',
      ));
    }
    setLoading(false);
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const commitRun = async (characterId: number, code?: string) => {
    if (creatingRef.current) return;
    creatingRef.current = true;
    setCreatingCharacterId(characterId);
    setActionError(null);
    const pending = pendingCreate.current?.characterId === characterId && pendingCreate.current.code === code
      ? pendingCreate.current
      : { characterId, code, key: crypto.randomUUID() };
    pendingCreate.current = pending;

    try {
      const run = await createGameRun({
        idPersonagemJogador: characterId,
        codigoJogo: code,
        chaveIdempotencia: pending.key,
      });
      pendingCreate.current = null;
      setGameChoices(null);
      navigate(`/jogo/run/${run.idGameRun}`);
    } catch (error: unknown) {
      if (isConflict(error)) {
        pendingCreate.current = null;
        try {
          const current = await getActiveGameRun();
          setActiveRun(current);
        } catch {
          // A mensagem de conflito permanece visível até a próxima tentativa.
        }
        setActionError('Já existe uma run ativa ou os dados mudaram. Atualize a página para continuar.');
      } else {
        setActionError(getApiErrorMessage(error, 'Não foi possível iniciar a run. Tente novamente.'));
      }
    } finally {
      creatingRef.current = false;
      setCreatingCharacterId(null);
    }
  };

  const startRun = async (characterId: number) => {
    if (creatingRef.current || loading || activeRun || activeRunError ||
      !characters.some((character) => character.idPersonagemJogador === characterId)) return;
    creatingRef.current = true;
    setCreatingCharacterId(characterId);
    setActionError(null);
    try {
      const games = await getCharacterGames(characterId);
      if (games.length === 0) {
        setActionError('Ainda não há jogo publicado para a versão do Sistema desta ficha. O responsável precisa adaptar e publicar o jogo nessa versão.');
      } else if (games.length > 1) setGameChoices({ characterId, games });
      else {
        creatingRef.current = false;
        await commitRun(characterId, games[0]?.codigo);
      }
    } catch (error: unknown) {
      setActionError(getApiErrorMessage(error, 'Não foi possível carregar os jogos desta mesa.'));
    } finally {
      creatingRef.current = false;
      setCreatingCharacterId(null);
    }
  };

  const abandonRun = async () => {
    if (!activeRun || activeRun.status !== 'Ativa' || abandoning) return;
    setAbandoning(true);
    setAbandonError(null);
    const pending = pendingAbandon.current?.revision === activeRun.revisao
      ? pendingAbandon.current
      : { revision: activeRun.revisao, key: crypto.randomUUID() };
    pendingAbandon.current = pending;

    try {
      await abandonGameRun(activeRun.idGameRun, {
        revisaoEsperada: pending.revision,
        chaveIdempotencia: pending.key,
      });
      pendingAbandon.current = null;
      setAbandonDialogOpen(false);
      setActiveRun(null);
    } catch (error: unknown) {
      if (isConflict(error)) {
        pendingAbandon.current = null;
        setAbandonDialogOpen(false);
        await reload();
        setAbandonError('O estado desta run mudou. Confira os dados atualizados antes de confirmar novamente.');
      } else {
        setAbandonError(getApiErrorMessage(error, 'Não foi possível abandonar a run. Tente novamente.'));
      }
    } finally {
      setAbandoning(false);
    }
  };

  return {
    characters,
    gameChoices,
    closeGameChoices: () => setGameChoices(null),
    chooseGame: (code: string) => {
      if (gameChoices?.games.some((game) => game.codigo === code))
        void commitRun(gameChoices.characterId, code);
    },
    activeRun,
    creatingCharacterId,
    loading,
    creating: creatingCharacterId !== null,
    abandoning,
    abandonDialogOpen,
    abandonError,
    setAbandonDialogOpen,
    charactersError,
    activeRunError,
    actionError,
    reload,
    startRun,
    abandonRun,
  };
};
