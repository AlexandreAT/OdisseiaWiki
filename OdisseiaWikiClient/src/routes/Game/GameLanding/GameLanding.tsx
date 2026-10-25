import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SearchIcon from '@mui/icons-material/Search';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ConfirmDialog } from '../../../components/Generic/ConfirmDialog/ConfirmDialog';
import { Modal } from '../../../components/Generic/Modal/Modal';
import { CyberButton } from '../../../components/Generic/HighlightButton/HighlightButton';
import { LoadingIndicator } from '../../../components/Generic/LoadingIndicator';
import { OdisseiaAnimatedTitle } from '../../../components/Generic/OdisseiaAnimatedTitle';
import { Search } from '../../../components/Generic/Search/Search';
import type { MesaThemeState } from '../../Mesas/MesaThemeState';
import { getRankedSuggestions } from '../../../utils/searchSuggestions';
import { normalizeImagePath } from '../../Wiki/utils/imagePathHelper';
import {
  GameEyebrow,
  GameHint,
  GameNotice,
  GamePage,
  GameSectionTitle,
  GameTextLink,
} from '../GameShared.style';
import { ResourceList } from '../GameRunShell/GameRunShell.style';
import { RunResourceBar } from '../GameRunShell/RunResourceBar/RunResourceBar';
import {
  ActiveRunActions,
  ActiveRunContent,
  ActiveRunIdentity,
  ActiveRunName,
  ActiveRunResources,
  ActiveRunSummary,
  CharacterChoice,
  CharacterCard,
  CharacterGrid,
  GameChoiceGrid,
  GameChoiceCard,
  CharacterInfo,
  CharacterPortrait,
  CharacterSearch,
  CharacterWarningButton,
  CharacterWarningTooltip,
  LandingSection,
  SectionHeading,
} from './GameLanding.style';
import { useGameLanding } from './useGameLanding';
import { getGameCharacterWarnings } from './gameCharacterWarnings';

export default function GameLanding() {
  const { theme, neon } = useSelector((state: MesaThemeState) => state.themesReducer);
  const neonEnabled = neon === 'on';
  const navigate = useNavigate();
  const state = useGameLanding();
  const activeRun = state.activeRun;
  const activeRunHasLoot = Object.values(activeRun?.configuracaoModo.encounters ?? {})
    .some((encounter) => (encounter.lootCount ?? 0) > 0);
  const [search, setSearch] = useState('');
  const [warningTooltip, setWarningTooltip] = useState<{
    characterId: number; top: number; left: number; closing: boolean;
  } | null>(null);
  const warningCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningHoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningAnchor = useRef<HTMLButtonElement | null>(null);
  const warningPopup = useRef<HTMLDivElement | null>(null);
  const cancelWarningClose = () => {
    if (warningHoverTimer.current) clearTimeout(warningHoverTimer.current);
  };
  const closeWarning = useCallback(() => {
    if (warningCloseTimer.current) clearTimeout(warningCloseTimer.current);
    setWarningTooltip((currentTooltip) => currentTooltip ? { ...currentTooltip, closing: true } : null);
    warningCloseTimer.current = setTimeout(() => setWarningTooltip(null), 220);
  }, []);
  const positionWarning = useCallback(() => {
    const anchor = warningAnchor.current;
    const popup = warningPopup.current;
    if (!anchor || !popup || !anchor.isConnected) return;
    const bounds = anchor.getBoundingClientRect();
    const { width, height } = popup.getBoundingClientRect();
    const left = Math.max(12, Math.min(bounds.right - width, window.innerWidth - width - 12));
    const below = window.innerHeight - bounds.bottom - 8;
    const above = bounds.top - 8;
    const top = below >= height || below >= above
      ? Math.min(bounds.bottom + 8, window.innerHeight - height - 12)
      : Math.max(12, bounds.top - height - 8);
    setWarningTooltip((current) => current && (current.top !== top || current.left !== left)
      ? { ...current, top, left } : current);
  }, []);
  useLayoutEffect(() => { if (warningTooltip) positionWarning(); }, [warningTooltip, positionWarning]);
  const scheduleWarningClose = () => {
    cancelWarningClose();
    warningHoverTimer.current = setTimeout(closeWarning, 100);
  };
  useEffect(() => {
    if (!warningTooltip) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element) ||
          (!target.closest('[data-game-warning-trigger]') && !target.closest('[data-game-warning-tooltip]'))) {
        closeWarning();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') closeWarning(); };
    const onScroll = (event: Event) => {
      if (event.target !== warningPopup.current) positionWarning();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [warningTooltip, closeWarning, positionWarning]);
  useEffect(() => () => {
    if (warningCloseTimer.current) clearTimeout(warningCloseTimer.current);
    if (warningHoverTimer.current) clearTimeout(warningHoverTimer.current);
  }, []);
  const showWarning = (characterId: number, target: HTMLButtonElement) => {
    cancelWarningClose();
    if (warningCloseTimer.current) clearTimeout(warningCloseTimer.current);
    warningAnchor.current = target;
    const bounds = target.getBoundingClientRect();
    setWarningTooltip({ characterId, top: bounds.bottom + 8, left: Math.max(12, bounds.left), closing: false });
  };
  const visibleCharacters = search.trim()
    ? getRankedSuggestions(state.characters, search, state.characters.length, (character) => character.nome)
    : state.characters;
  const current = activeRun?.estadoAtual;
  const status = current?.status?.status;
  const resources = [
    { label: 'Vida', tone: 'life' as const, value: status?.vida ?? 0, max: status?.vidaMaxima ?? status?.vida ?? 0 },
    { label: 'Mana', tone: 'mana' as const, value: status?.mana ?? 0, max: status?.manaMaxima ?? status?.mana ?? 0 },
    { label: 'Estamina', tone: 'stamina' as const, value: status?.estamina ?? 0,
      max: status?.estaminaMaxima ?? status?.estamina ?? 0 },
  ];

  return (
    <GamePage>
      {activeRun && <LandingSection neon={neonEnabled} aria-labelledby="active-run-title">
        <SectionHeading>
          <div>
            <GameEyebrow>Continuar</GameEyebrow>
            <GameSectionTitle id="active-run-title">Sua jornada</GameSectionTitle>
          </div>
        </SectionHeading>
        <ActiveRunContent>
          <ActiveRunIdentity>
            <CharacterPortrait aria-hidden="true">
              {current?.imagem ? <img src={normalizeImagePath(current.imagem)} alt="" /> : <PersonOutlineIcon />}
            </CharacterPortrait>
            <ActiveRunSummary>
              <ActiveRunName><OdisseiaAnimatedTitle theme={theme} neon={neon}
                text={current?.nome ?? ''} compact /></ActiveRunName>
              <span>Nível {current?.status?.nivel ?? 1} · {current?.status?.xp ?? 0} XP · Fase {activeRun.fase}</span>
              <span>{activeRun.nomeJogo} · Modo {activeRun.numeroVersaoModo}</span>
            </ActiveRunSummary>
          </ActiveRunIdentity>
          <ActiveRunResources><ResourceList>
            {resources.map((resource) => <RunResourceBar key={resource.label} {...resource} />)}
          </ResourceList></ActiveRunResources>
          <ActiveRunActions>
            <CyberButton theme={theme} neon={neon} width="calc(100% - 15px)" text="Continuar"
              disabled={state.abandoning} onClick={() => navigate(`/jogo/run/${activeRun.idGameRun}`)} />
            <CyberButton theme={theme} neon={neon} colorType="secondary" width="calc(100% - 15px)" text="Abandonar run"
              disabled={state.abandoning} onClick={() => state.setAbandonDialogOpen(true)} />
          </ActiveRunActions>
        </ActiveRunContent>
        {activeRun.mapa.schemaVersion < 5 && <GameHint>
          Esta run usa o mapa antigo. Para ter o tamanho de mapa configurável, publique o novo modo em Gerenciamento &gt; Jogo
          e depois reinicie a jornada. O progresso atual não será convertido automaticamente.
        </GameHint>}
        {!activeRunHasLoot && <GameHint>O modo fixado nesta run não tem loot configurado. Uma publicação nova não altera jornadas já iniciadas.</GameHint>}
      </LandingSection>}
      {state.abandonError && !state.abandonDialogOpen && <GameNotice $danger role="alert">{state.abandonError}</GameNotice>}

      <LandingSection neon={neonEnabled} aria-labelledby="character-title">
        <SectionHeading>
          <div>
            <GameEyebrow>Modo solo</GameEyebrow>
            <GameSectionTitle id="character-title">Escolha seu personagem</GameSectionTitle>
          </div>
          <GameTextLink to="/hub?section=personagens">Gerenciar personagens</GameTextLink>
        </SectionHeading>
        {state.activeRunError && <GameNotice $danger role="alert">{state.activeRunError}</GameNotice>}
        {state.loading ? <LoadingIndicator label="Carregando personagens" /> : state.charactersError ? (
          <>
            <GameNotice $danger role="alert">{state.charactersError}</GameNotice>
            <CyberButton theme={theme} neon={neon} colorType="secondary" width="160px" text="Recarregar" onClick={() => void state.reload()} />
          </>
        ) : state.characters.length === 0 ? (
          <GameNotice role="status">
            Você ainda não tem personagens pessoais. Crie um em “Gerenciar personagens” e volte para iniciar a run.
          </GameNotice>
        ) : (
          <>
            {state.activeRun && (
              <GameNotice role="status">Você já tem uma run ativa. Continue ou abandone essa jornada antes de iniciar outra.</GameNotice>
            )}
            <CharacterSearch><Search theme={theme} neon={neon} label="Buscar personagem"
              value={search} onChange={(event) => setSearch(event.target.value)}
              icon={<SearchIcon />} width="100%" height="52px" /></CharacterSearch>
            <CharacterGrid aria-busy={state.creating}>
              {visibleCharacters.map((character) => {
                const imageUrl = normalizeImagePath(character.imagem ?? undefined);
                const warnings = getGameCharacterWarnings(character);
                return (
                  <CharacterCard key={character.idPersonagemJogador}>
                  <CharacterChoice
                    type="button"
                    $selected={state.creatingCharacterId === character.idPersonagemJogador}
                    aria-label={`Iniciar run com ${character.nome}`}
                    disabled={Boolean(state.activeRun) || Boolean(state.activeRunError) || state.creating}
                    onClick={() => void state.startRun(character.idPersonagemJogador)}
                  >
                    <CharacterPortrait aria-hidden="true">
                      {imageUrl ? <img src={imageUrl} alt="" /> : <PersonOutlineIcon />}
                    </CharacterPortrait>
                    <CharacterInfo>
                      <strong title={character.nome}>{character.nome}</strong>
                      <small>{state.creatingCharacterId === character.idPersonagemJogador ? 'Iniciando jornada...' :
                        [character.nomeMesa, character.nomeSistema &&
                          `${character.nomeSistema} v${character.numeroVersaoSistema ?? 'legada'}`]
                          .filter(Boolean).join(' · ') || 'Sistema verificado ao iniciar'}</small>
                    </CharacterInfo>
                  </CharacterChoice>
                  {warnings.length > 0 && <CharacterWarningButton type="button"
                    data-game-warning-trigger
                    aria-label={`Avisos de ${character.nome}`}
                    aria-expanded={warningTooltip?.characterId === character.idPersonagemJogador && !warningTooltip.closing}
                    aria-describedby={warningTooltip?.characterId === character.idPersonagemJogador && !warningTooltip.closing
                      ? 'game-character-warning-tooltip' : undefined}
                    onPointerEnter={(event) => { if (event.pointerType !== 'touch') showWarning(character.idPersonagemJogador, event.currentTarget); }}
                    onPointerLeave={(event) => { if (event.pointerType !== 'touch') scheduleWarningClose(); }}
                    onFocus={(event) => { if (event.currentTarget.matches(':focus-visible')) showWarning(character.idPersonagemJogador, event.currentTarget); }}
                    onBlur={() => { if (window.matchMedia('(hover: hover)').matches) scheduleWarningClose(); }}
                    onClick={(event) => {
                      if (window.matchMedia('(hover: hover)').matches) return;
                      if (warningTooltip?.characterId === character.idPersonagemJogador && !warningTooltip.closing) closeWarning();
                      else showWarning(character.idPersonagemJogador, event.currentTarget);
                    }}>
                    <InfoOutlinedIcon />
                  </CharacterWarningButton>}
                  </CharacterCard>
                );
              })}
            </CharacterGrid>
            {visibleCharacters.length === 0 && <GameHint>Nenhum personagem encontrado.</GameHint>}
            {state.actionError && <GameNotice $danger role="alert">{state.actionError}</GameNotice>}
          </>
        )}
      </LandingSection>
      {warningTooltip && (() => {
        const character = state.characters.find((entry) => entry.idPersonagemJogador === warningTooltip.characterId);
        if (!character) return null;
        return createPortal(<CharacterWarningTooltip ref={warningPopup} id="game-character-warning-tooltip"
          data-game-warning-tooltip role="tooltip"
          onPointerDown={cancelWarningClose}
          onPointerEnter={cancelWarningClose}
          onPointerLeave={(event) => { if (event.pointerType !== 'touch') scheduleWarningClose(); }}
          $top={warningTooltip.top} $left={warningTooltip.left} $closing={warningTooltip.closing}>
          <strong>Atenção · {character.nome}</strong>
          {getGameCharacterWarnings(character).map((warning) => <p key={warning}>{warning}</p>)}
        </CharacterWarningTooltip>, document.body);
      })()}
      <ConfirmDialog
        open={state.abandonDialogOpen}
        title="Abandonar esta run?"
        message="O progresso desta run será encerrado. Seu personagem original não será alterado."
        confirmText="Abandonar"
        onConfirm={() => void state.abandonRun()}
        onCancel={() => state.setAbandonDialogOpen(false)}
        isLoading={state.abandoning}
        error={state.abandonError}
      />
      {state.gameChoices && <Modal title="Escolha o jogo" theme={theme} neon={neon}
        width="1040px" showFooter={false} onClose={state.closeGameChoices}>
        {state.actionError && <GameNotice $danger role="alert">{state.actionError}</GameNotice>}
        <GameChoiceGrid>
          {state.gameChoices.games.map((game) => <GameChoiceCard key={game.codigo}
            type="button" disabled={state.creating}
            onClick={() => state.chooseGame(game.codigo)}>
            {game.banner && <img src={normalizeImagePath(game.banner)} alt="" />}
            <strong>{game.nome}</strong>
            {game.descricao && <small>{game.descricao}</small>}
            <small>{game.idMesa ? 'Jogo da mesa' : 'Jogo global'} · Modo {game.numeroVersao}</small>
          </GameChoiceCard>)}
        </GameChoiceGrid>
      </Modal>}
    </GamePage>
  );
}
