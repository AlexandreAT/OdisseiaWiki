import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AnimatedBackground } from '../../../components/Generic/AnimatedBackground/AnimatedBackground';
import {
  GameplayActionCenter,
  GameplaySheetActionDialog,
  type GameplaySheetActionSource,
} from '../../../components/Gameplay';
import { DiceRollOverlay } from '../../../components/Gameplay/DiceRollOverlay/DiceRollOverlay';
import { LoadingIndicator } from '../../../components/Generic/LoadingIndicator';
import { useGameplayEngine } from '../../../hooks/useGameplayEngine';
import { useGameplayFavoriteGroups, useGameplayFavorites } from '../../../hooks/useGameplayFavorites';
import type {
  GameplayCharacterOption,
  GameplayCommandResponse,
  GameplayFavoriteRoll,
  GameplayFavoriteRollUpsert,
  GameplayRollRequest,
} from '../../../models/Gameplay';
import type { MesaPersonagemResumo } from '../../../models/Mesa';
import type { PersonagemStatus, StatusBase } from '../../../models/PersonagemJogador';
import { getApiErrorMessage } from '../../../utils/apiError';
import { getCharacterItemGameplayAction } from '../../../utils/gameplaySheetAction';
import { CharacterSelectionCard } from '../../Hub/UserCharacters/CharacterSelectionCard/CharacterSelectionCard';
import { useMesaEmJogoRealtime } from '../hooks/useMesaEmJogoRealtime';
import { MesaHudDecor } from '../components/MesaHudDecor/MesaHudDecor';
import {
  ActionButton,
  MesaGameCharacterGrid,
  DeadCardWrapper,
  EmptyState,
  GameStatus,
  HeaderActions,
  LiveBadge,
  LiveControl,
  MesaPage,
  MesaPageLoading,
  PageHeader,
} from '../Mesas.style';
import { useMesaGameData } from './useMesaGameData';
import { useRemoteGameplayRolls } from './useRemoteGameplayRolls';
import type { MesaThemeState } from '../MesaThemeState';
import { GameplayLiveHistory } from './GameplayLiveHistory';
import { GameplayFavoriteRolls } from './GameplayFavoriteRolls';
import { MesaGameActivityLayout, MesaGameActivityMain, MesaGameActivitySidebar } from './GameplayLiveHistory.style';

const emptyStatus: StatusBase = {
  vida: 0,
  vidaMaxima: 0,
  mana: 0,
  manaMaxima: 0,
  estamina: 0,
  estaminaMaxima: 0,
  capacidadeCarga: 0,
};

const parseStatus = (raw: unknown): PersonagemStatus | null => {
  try {
    const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!value || typeof value !== 'object') return null;

    // A ficha persiste os recursos dentro de `status`; aceitar o formato plano
    // mantém compatibilidade com registros antigos.
    const nestedStatus = (value as { status?: unknown }).status;
    return nestedStatus && typeof nestedStatus === 'object'
      ? nestedStatus as PersonagemStatus
      : value as PersonagemStatus;
  } catch {
    return null;
  }
};

type DisplayCharacter = MesaPersonagemResumo & { exiting?: boolean };

const getCurrentUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('usuario') || 'null');
    return Number(user?.id ?? user?.idusuario ?? user?.idUsuario ?? user?.Idusuario ?? 0);
  } catch {
    return 0;
  }
};

const MesaGame = () => {
  const { id } = useParams();
  const idMesa = Number(id);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme, neon } = useSelector((state: MesaThemeState) => state.themesReducer);
  const isNeonActive = neon === 'on';
  const {
    snapshot,
    loading,
    refresh,
    updateCharacterResources,
    updateMesaLiveStatus,
  } = useMesaGameData(idMesa);
  const [displayed, setDisplayed] = useState<DisplayCharacter[]>([]);
  const [updatingLiveStatus, setUpdatingLiveStatus] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [actionCharacterId, setActionCharacterId] = useState<number | null>(null);
  const [localDiceOpen, setLocalDiceOpen] = useState(false);
  const [quickRoll, setQuickRoll] = useState<{
    favorite: GameplayFavoriteRoll;
    response: GameplayCommandResponse | null;
    error: string | null;
    requestStarted: boolean;
    resultRevealed: boolean;
  } | null>(null);
  const [favoriteConfiguration, setFavoriteConfiguration] = useState<{
    favorite: GameplayFavoriteRoll;
    source: GameplaySheetActionSource;
    character: GameplayCharacterOption;
  } | null>(null);
  const [configuredFavoriteEventId, setConfiguredFavoriteEventId] = useState<number | null>(null);
  const removalTimers = useRef(new Map<number, number>());
  const currentUserId = useMemo(getCurrentUserId, []);
  const gameplay = useGameplayEngine({ idMesa, enabled: Boolean(snapshot), mesaAoVivo: Boolean(snapshot?.mesa.aoVivo) });
  const gameplayCharacters = useMemo(() => displayed
    .filter((entry) => Number(entry.idUsuarioDono ?? entry.personagem.idusuario ?? 0) === currentUserId)
    .map((entry) => ({ personagem: entry.personagem, ownerName: entry.donoNome })), [currentUserId, displayed]);
  const favoriteCharacters = useMemo(() => gameplayCharacters.map((entry) => ({
    idPersonagemJogador: entry.personagem.idpersonagemJogador,
    nome: entry.personagem.nome,
  })), [gameplayCharacters]);
  const favoriteCharacterId = actionCharacterId ?? gameplayCharacters[0]?.personagem.idpersonagemJogador ?? null;
  const gameplayFavorites = useGameplayFavorites(favoriteCharacterId, Boolean(favoriteCharacterId));
  const gameplayFavoriteGroups = useGameplayFavoriteGroups(favoriteCharacters, favoriteCharacters.length > 0);
  const visibleGameplayEvents = useMemo(() => {
    const quickRollEventId = quickRoll?.resultRevealed === false
      ? quickRoll.response?.evento?.idEvento
      : null;
    if (!quickRollEventId && !configuredFavoriteEventId) return gameplay.events;
    return gameplay.events.filter((event) => (
      event.idEvento !== quickRollEventId && event.idEvento !== configuredFavoriteEventId
    ));
  }, [configuredFavoriteEventId, gameplay.events, quickRoll]);
  const { remoteRoll, dismissRemoteRoll } = useRemoteGameplayRolls({
    currentUserId,
    events: gameplay.realtimeEvents,
    sessionId: gameplay.session?.idMesaSessao,
  });
  const remoteCharacterName = remoteRoll?.idPersonagemJogador
    ? displayed.find((entry) => entry.personagem.idpersonagemJogador === remoteRoll.idPersonagemJogador)
      ?.personagem.nome
    : null;

  useEffect(() => {
    const requestedId = Number(searchParams.get('acoes'));
    if (!requestedId || !gameplayCharacters.some((entry) => entry.personagem.idpersonagemJogador === requestedId)) return;
    setActionCharacterId(requestedId);
    setActionsOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete('acoes');
    setSearchParams(next, { replace: true });
  }, [gameplayCharacters, searchParams, setSearchParams]);

  const handleAccessRevoked = useCallback(() => {
    toast.error('Seu acesso a esta Mesa foi removido.');
    navigate('/hub?section=mesas', { replace: true });
  }, [navigate]);

  const realtime = useMesaEmJogoRealtime({
    idMesa,
    enabled: Boolean(snapshot),
    aoVivo: Boolean(snapshot?.mesa.aoVivo),
    onMesaInvalidada: () => Promise.all([
      refresh(false).catch(() => undefined),
      gameplay.refresh(false, true).catch(() => undefined),
    ]).then(() => undefined),
    onMesaRessincronizar: () => Promise.all([
      refresh(false).catch(() => undefined),
      gameplay.refresh(false, false).catch(() => undefined),
    ]).then(() => undefined),
    onAcessoRevogado: handleAccessRevoked,
  });

  useEffect(() => {
    const incoming = snapshot?.personagens ?? [];
    setDisplayed((current) => {
      const incomingIds = new Set(incoming.map((entry) => entry.personagem.idpersonagemJogador));
      const removed = current.filter((entry) => !incomingIds.has(entry.personagem.idpersonagemJogador));

      removed.forEach((entry) => {
        const characterId = entry.personagem.idpersonagemJogador;
        if (removalTimers.current.has(characterId)) return;
        const timer = window.setTimeout(() => {
          setDisplayed((items) => items.filter((item) => item.personagem.idpersonagemJogador !== characterId));
          removalTimers.current.delete(characterId);
        }, 460);
        removalTimers.current.set(characterId, timer);
      });

      return [
        ...incoming.map((entry) => ({ ...entry, exiting: false })),
        ...removed.map((entry) => ({ ...entry, exiting: true })),
      ];
    });
  }, [snapshot?.personagens]);

  useEffect(() => () => {
    removalTimers.current.forEach((timer) => window.clearTimeout(timer));
    removalTimers.current.clear();
  }, []);

  if (loading) {
    return (
      <>
        <AnimatedBackground type="distant" skipIntro />
        <MesaPageLoading><LoadingIndicator label="Carregando mesa" /></MesaPageLoading>
      </>
    );
  }
  if (!snapshot) return null;

  const mesaAoVivo = snapshot.mesa.aoVivo;
  const isMaster = snapshot.mesa.papelUsuario === 'Mestre';
  const onlineCount = mesaAoVivo && realtime.conectado
    ? realtime.quantidadeUsuariosOnline
    : 0;
  const realtimeLabel = realtime.status === 'connected'
    ? 'Ao vivo'
    : realtime.status === 'reconnecting'
      ? 'Reconectando'
      : realtime.status === 'connecting'
        ? 'Conectando'
        : 'Atualização periódica';

  const liveSessionLabel = mesaAoVivo
    ? realtime.conectado ? 'Ao vivo' : realtimeLabel
    : 'Mesa offline';

  const handleLiveStatusChange = async (aoVivo: boolean) => {
    setUpdatingLiveStatus(true);
    const updated = await updateMesaLiveStatus(aoVivo);
    if (updated) await gameplay.refresh(false);
    setUpdatingLiveStatus(false);
  };

  const handleQuickFavoriteRoll = (favorite: GameplayFavoriteRoll) => {
    const character = gameplayCharacters.find((entry) => entry.personagem.idpersonagemJogador === favorite.idPersonagemJogador);
    if (!character) {
      toast.error('Este personagem não está disponível na Mesa.');
      return;
    }
    if (favorite.tipoOrigem === 'ITEM' || favorite.tipoOrigem === 'PROTESE') {
      const source = getCharacterItemGameplayAction(
        character.personagem,
        favorite.idOrigem,
      );
      if (!source) {
        toast.error('O item desta rolagem favorita não foi encontrado na ficha.');
        return;
      }
      setQuickRoll(null);
      setConfiguredFavoriteEventId(null);
      setFavoriteConfiguration({ favorite, source, character });
      return;
    }
    setFavoriteConfiguration(null);
    setQuickRoll({
      favorite,
      response: null,
      error: null,
      requestStarted: false,
      resultRevealed: false,
    });
    setLocalDiceOpen(true);
  };

  const handleConfiguredFavoriteRoll = async (payload: GameplayRollRequest) => {
    const response = await gameplay.roll(payload);
    setConfiguredFavoriteEventId(response.evento?.idEvento ?? null);
    return response;
  };

  const handleQuickFavoriteThrow = async () => {
    const currentRoll = quickRoll;
    if (!currentRoll || currentRoll.requestStarted) return;
    const { favorite } = currentRoll;
    const character = gameplayCharacters.find((entry) => entry.personagem.idpersonagemJogador === favorite.idPersonagemJogador);
    if (!character) {
      setQuickRoll((current) => current ? {
        ...current,
        error: 'Este personagem não está disponível na Mesa.',
        requestStarted: true,
      } : current);
      return;
    }
    setQuickRoll((current) => current ? { ...current, requestStarted: true } : current);
    try {
      const response = await gameplay.roll({
        ...favorite.configuracao,
        chaveIdempotencia: crypto.randomUUID(),
        idPersonagemJogador: favorite.idPersonagemJogador,
        revisaoSessaoEsperada: gameplay.session?.revisaoEstado,
        revisaoPersonagemEsperada: character.personagem.revisaoRuntime,
      });
      setQuickRoll((current) => current?.favorite.idFavorito === favorite.idFavorito
        ? {
          ...current,
          response,
          error: response.rolagem ? null : 'O resultado está oculto pela visibilidade escolhida.',
        }
        : current);
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, 'Não foi possível realizar a rolagem favorita.');
      setQuickRoll((current) => current?.favorite.idFavorito === favorite.idFavorito
        ? { ...current, error: message }
        : current);
    }
  };

  const handleSaveFavorite = async (payload: GameplayFavoriteRollUpsert) => {
    const saved = await gameplayFavorites.save(payload);
    await gameplayFavoriteGroups.refresh();
    return saved;
  };

  const handleRemoveFavorite = async (idFavorito: string) => {
    await gameplayFavorites.remove(idFavorito);
    await gameplayFavoriteGroups.refresh();
  };

  return (
    <>
      <AnimatedBackground type="distant" skipIntro />
      <MesaPage $neon={isNeonActive}>
        <PageHeader $neon={isNeonActive}>
          <MesaHudDecor neon={isNeonActive} />
          <div>
            <h1>Mesa em jogo — {snapshot.mesa.nome}</h1>
            <p>Status compartilhados dos personagens da Mesa.</p>
          </div>
          <HeaderActions>
            <LiveBadge $connected={mesaAoVivo}>{liveSessionLabel}</LiveBadge>
            {isMaster && (
              <LiveControl $active={mesaAoVivo}>
                <input
                  type="checkbox"
                  checked={mesaAoVivo}
                  disabled={updatingLiveStatus}
                  onChange={(event) => void handleLiveStatusChange(event.target.checked)}
                  aria-label="Alternar transmissão ao vivo da Mesa"
                />
                <span className="live-control-track" aria-hidden="true" />
                <span>{updatingLiveStatus ? 'Atualizando' : mesaAoVivo ? 'Encerrar ao vivo' : 'Iniciar ao vivo'}</span>
              </LiveControl>
            )}
            <ActionButton
              $accent="pink"
              title="Abrir Central de ações"
              onClick={() => {
                setActionCharacterId(gameplayCharacters[0]?.personagem.idpersonagemJogador ?? null);
                setActionsOpen(true);
              }}
            >
              <CasinoOutlinedIcon /> Ações
            </ActionButton>
            <ActionButton onClick={() => navigate(`/mesa/${idMesa}`)}>
              <VisibilityOutlinedIcon sx={{ color: 'var(--clearneonBlue)' }} /> Ver Mesa
            </ActionButton>
          </HeaderActions>
        </PageHeader>

        <GameStatus $neon={isNeonActive}>
          <MesaHudDecor neon={isNeonActive} />
          <div><small><GroupsOutlinedIcon /> Mesa</small><strong>{snapshot.mesa.nome}</strong></div>
          <div><small><StorageOutlinedIcon /> Sistema</small><strong>{snapshot.mesa.sistemaNome}</strong></div>
          <div><small><LayersOutlinedIcon /> Versão</small><strong>{snapshot.mesa.numeroVersao || '—'}</strong></div>
          <div><small><PersonOutlineIcon /> Jogadores online</small><strong>{onlineCount} / {snapshot.participantes}</strong></div>
          <div><small>Turno atual</small><strong>{snapshot.turnoAtual || 'Mestre'}</strong></div>
        </GameStatus>

        <MesaGameActivityLayout>
          <MesaGameActivityMain>
            {displayed.length === 0 ? (
              <EmptyState>Nenhum personagem visível e ativo nesta Mesa.</EmptyState>
            ) : (
              <MesaGameCharacterGrid>
                {displayed.map((entry) => {
                  const characterId = entry.personagem.idpersonagemJogador;
                  const parsed = parseStatus(entry.personagem.statusJson);
                  const ownerId = Number(entry.idUsuarioDono ?? entry.personagem.idusuario ?? 0);
                  const isOwn = ownerId > 0 && ownerId === currentUserId;
                  const online = mesaAoVivo && realtime.conectado && ownerId > 0
                    ? realtime.idsUsuariosOnline.includes(ownerId)
                    : entry.online;
                  return (
                    <DeadCardWrapper key={characterId} $exiting={entry.exiting}>
                      <CharacterSelectionCard
                        personagem={entry.personagem}
                        status={entry.status || parsed?.status || emptyStatus}
                        level={entry.nivel ?? parsed?.nivel ?? 1}
                        xp={entry.xp ?? parsed?.xp ?? 0}
                        theme={theme}
                        neon={neon}
                        context={isOwn ? 'mesa-own' : 'mesa-other'}
                        ownerName={entry.donoNome}
                        online={online}
                        variant="mesa-game"
                        onActions={isOwn ? () => {
                          setActionCharacterId(characterId);
                          setActionsOpen(true);
                        } : undefined}
                        onQuickStatusUpdate={isOwn
                          ? (changes) => updateCharacterResources(
                            characterId,
                            entry.personagem.revisaoRuntime ?? 0,
                            changes,
                          )
                          : undefined}
                        onView={() => navigate(`/personagem/${characterId}?tipo=jogador&mesaId=${idMesa}&modo=leitura`)}
                        onSheet={() => navigate(`/hub?section=personagens&mode=edit&characterId=${characterId}&step=2`)}
                        onEdit={() => navigate(`/hub?section=personagens&mode=edit&characterId=${characterId}&step=1`)}
                      />
                    </DeadCardWrapper>
                  );
                })}
              </MesaGameCharacterGrid>
            )}
          </MesaGameActivityMain>
          <MesaGameActivitySidebar>
            <GameplayFavoriteRolls
              groups={gameplayFavoriteGroups.groups}
              loading={gameplayFavoriteGroups.loading}
              rolling={gameplay.submitting}
              neon={isNeonActive}
              onRoll={handleQuickFavoriteRoll}
            />
            <GameplayLiveHistory
              session={gameplay.session}
              mesaAoVivo={mesaAoVivo}
              events={visibleGameplayEvents}
              characters={displayed}
              loading={gameplay.loading}
              loadingMore={gameplay.loadingMore}
              error={gameplay.error}
              hasMore={gameplay.hasMore}
              neon={isNeonActive}
              onRefresh={gameplay.refresh}
              onLoadMore={gameplay.loadMore}
            />
          </MesaGameActivitySidebar>
        </MesaGameActivityLayout>
        <GameplayActionCenter
          open={actionsOpen}
          onClose={() => setActionsOpen(false)}
          onDiceVisualOpenChange={setLocalDiceOpen}
          onCharacterChange={setActionCharacterId}
          initialCharacterId={actionCharacterId}
          characters={gameplayCharacters}
          effectTargets={isMaster ? displayed.map((entry) => ({
            personagem: entry.personagem,
            ownerName: entry.donoNome,
          })) : []}
          session={gameplay.session}
          mesaAoVivo={mesaAoVivo}
          events={visibleGameplayEvents}
          loading={gameplay.loading}
          loadingMore={gameplay.loadingMore}
          submitting={gameplay.submitting}
          error={gameplay.error}
          hasMore={gameplay.hasMore}
          theme={theme}
          neon={neon}
          onRoll={gameplay.roll}
          onApplyEffect={gameplay.applyEffect}
          onGetActionCatalog={gameplay.getActionCatalog}
          onRecordManual={gameplay.recordManual}
          onLoadMore={gameplay.loadMore}
          onRefresh={gameplay.refresh}
          favorites={gameplayFavorites.favorites}
          favoriteSaving={gameplayFavorites.saving}
          onSaveFavorite={handleSaveFavorite}
          onRemoveFavorite={handleRemoveFavorite}
        />
        <GameplaySheetActionDialog
          open={Boolean(favoriteConfiguration)}
          source={favoriteConfiguration?.source ?? null}
          character={favoriteConfiguration?.character ?? null}
          theme={theme}
          neon={neon}
          submitting={gameplay.submitting}
          onClose={() => {
            setFavoriteConfiguration(null);
            setConfiguredFavoriteEventId(null);
          }}
          onRoll={handleConfiguredFavoriteRoll}
          onApplyEffect={gameplay.applyEffect}
          onEffectApplied={gameplay.refresh}
          onDiceVisualOpenChange={setLocalDiceOpen}
          onResultRevealed={() => setConfiguredFavoriteEventId(null)}
          favorite={favoriteConfiguration?.favorite ?? null}
        />
        {quickRoll && (
          <DiceRollOverlay
            open
            result={quickRoll.response?.rolagem ?? null}
            error={quickRoll.error}
            title={quickRoll.favorite.nome}
            hasDice
            requestedFaces={quickRoll.response?.rolagem?.grupos[0]?.faces
              ?? quickRoll.favorite.configuracao.grupos[0]?.faces
              ?? (quickRoll.favorite.tipoOrigem === 'ATRIBUTO' ? 6 : 20)}
            requestedDiceCount={Math.min(2, quickRoll.response?.rolagem?.grupos
              .reduce((total, group) => total + group.valores.length, 0)
              ?? Math.max(1, quickRoll.favorite.configuracao.grupos
                .reduce((total, group) => total + group.quantidade, 0))
                * (quickRoll.favorite.configuracao.modo === 'Normal' ? 1 : 2))}
            neon={isNeonActive}
            onThrow={() => void handleQuickFavoriteThrow()}
            onResultRevealed={() => setQuickRoll((current) => current
              ? { ...current, resultRevealed: true }
              : current)}
            onClose={() => {
              setQuickRoll(null);
              setLocalDiceOpen(false);
            }}
          />
        )}
        {remoteRoll && (
          <DiceRollOverlay
            key={remoteRoll.idEvento}
            open={!localDiceOpen}
            autoThrow
            result={remoteRoll.rolagem ?? null}
            title={`${remoteCharacterName || remoteRoll.personagemNome || remoteRoll.autorNome || 'Jogador'} · ${remoteRoll.titulo || 'Rolagem na Mesa'}`}
            hasDice={Boolean(remoteRoll.rolagem?.grupos.length)}
            requestedFaces={remoteRoll.rolagem?.grupos[0]?.faces ?? 6}
            requestedDiceCount={Math.min(2, remoteRoll.rolagem?.grupos
              .reduce((total, group) => total + group.valores.length, 0) ?? 1)}
            neon={isNeonActive}
            onClose={dismissRemoteRoll}
          />
        )}
      </MesaPage>
    </>
  );
};

export default MesaGame;
