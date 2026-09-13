import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatedBackground } from '../../../components/Generic/AnimatedBackground/AnimatedBackground';
import { LoadingIndicator } from '../../../components/Generic/LoadingIndicator';
import type { MesaPersonagemResumo } from '../../../models/Mesa';
import type { PersonagemStatus, StatusBase } from '../../../models/PersonagemJogador';
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
import type { MesaThemeState } from '../MesaThemeState';

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
  const removalTimers = useRef(new Map<number, number>());
  const currentUserId = useMemo(getCurrentUserId, []);

  const handleAccessRevoked = useCallback(() => {
    toast.error('Seu acesso a esta Mesa foi removido.');
    navigate('/hub?section=mesas', { replace: true });
  }, [navigate]);

  const realtime = useMesaEmJogoRealtime({
    idMesa,
    enabled: Boolean(snapshot),
    aoVivo: Boolean(snapshot?.mesa.aoVivo),
    onMesaInvalidada: () => refresh(false).catch(() => undefined),
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

  if (loading) return <MesaPageLoading><LoadingIndicator label="Carregando Mesa em jogo" /></MesaPageLoading>;
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
    await updateMesaLiveStatus(aoVivo);
    setUpdatingLiveStatus(false);
  };

  return (
    <>
      <AnimatedBackground type="distant" skipIntro />
      <MesaPage $neon={isNeonActive}>
        <PageHeader $neon={isNeonActive}>
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

        {!mesaAoVivo && !isMaster ? (
          <EmptyState>A Mesa está offline. Aguarde o mestre iniciar a sessão ao vivo.</EmptyState>
        ) : displayed.length === 0 ? (
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
                    onQuickStatusUpdate={isOwn
                      ? (changes) => updateCharacterResources(characterId, changes)
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
      </MesaPage>
    </>
  );
};

export default MesaGame;
