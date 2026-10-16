import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import BackpackOutlinedIcon from '@mui/icons-material/BackpackOutlined';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import UpgradeIcon from '@mui/icons-material/Upgrade';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { RunAttributeModal } from './RunAttributeModal';
import { RunLootModal } from './RunLootModal';
import { RunVictoryScreen } from './RunVictoryScreen';
import { RunResourceBar } from './RunResourceBar/RunResourceBar';
import { UpgradeArrow } from './RunRewards.style';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined';
import { useSelector } from 'react-redux';
import { CyberButton } from '../../../components/Generic/HighlightButton/HighlightButton';
import { OdisseiaAnimatedTitle } from '../../../components/Generic/OdisseiaAnimatedTitle';
import { ConfirmDialog } from '../../../components/Generic/ConfirmDialog/ConfirmDialog';
import { CheckBox } from '../../../components/Generic/CheckBox/CheckBox';
import { LoadingIndicator } from '../../../components/Generic/LoadingIndicator';
import type { MesaThemeState } from '../../Mesas/MesaThemeState';
import { normalizeImagePath } from '../../Wiki/utils/imagePathHelper';
import { BattleReplay } from '../BattleReplay/BattleReplay';
import { RunTargetSelection } from '../BattleReplay/RunTargetSelection';
import { RunMapCanvas } from '../RunMapCanvas/RunMapCanvas';
import { getRunAreaImage } from '../RunMapCanvas/mapAreaImage';
import { getVisibleRunMap } from '../RunMapCanvas/visibleRunMap';
import { RunInventory } from './RunInventory';
import { RunLoadout } from './RunLoadout';
import { parseRunInventoryEntries } from './runInventoryEntries';
import { RunRegionBackdrops } from './RunRegionBackdrops';
import { GameHint, GameNotice, GamePage, GameSectionTitle, GameTextLink } from '../GameShared.style';
import {
  AttributeList, ResourceAndAttributes, GameRunPage, ReplaySection, ResourceList,
  RunActionRail, RunBattleHistoryNav, RunConclusion, RunFooterActions, RunHudHeader, RunHudMeta, RunHudPanel,
  RunHudTopline, RunLoadingPage, RunMapArea, RunRouteBusy, RunPanel, RunStickyHeader, RunTrainingBody, RunTrainingDialog,
  RunDefenseRow, RunDefenseValue, RunProtection,
  RunTrainingPanel, RunXpLabel, SnapshotHeader, SnapshotPortrait, TrainingIcon,
} from './GameRunShell.style';
import { canUpgradeGameRunMap, useGameRun } from './useGameRun';
import { getGameRunMediumRestPreview } from '../../../services/gameRunService';
import type { GameRunMediumRestPreview } from '../../../models/GameRun';
import { getApiErrorMessage } from '../../../utils/apiError';


const combatNodeTypes = new Set(['COMBATE', 'ELITE', 'BOSS', 'CACADA']);
const attributeNames: Record<string, [string, string]> = {
  resistencia: ['Res', 'Resistência'], agilidade: ['Agi', 'Agilidade'],
  sabedoria: ['Sab', 'Sabedoria'], precisao: ['Pre', 'Precisão'], forca: ['For', 'Força'],
  sanidade: ['San', 'Sanidade'], coragem: ['Cor', 'Coragem'],
  inteligencia: ['Int', 'Inteligência'], percepcao: ['Per', 'Percepção'],
  labia: ['Láb', 'Lábia'], intimidacao: ['Inti', 'Intimidação'],
};
const emptyLoadoutNoticeKey = (runId: number) => `game-run:${runId}:empty-loadout-notice`;

const hasSeenEmptyLoadoutNotice = (runId: number) => {
  try { return window.localStorage.getItem(emptyLoadoutNoticeKey(runId)) === '1'; }
  catch { return false; }
};

const markEmptyLoadoutNoticeSeen = (runId: number) => {
  try { window.localStorage.setItem(emptyLoadoutNoticeKey(runId), '1'); }
  catch { /* O aviso continua limitado à montagem atual quando o armazenamento estiver indisponível. */ }
};

export default function GameRunShell() {
  const { theme, neon } = useSelector((state: MesaThemeState) => state.themesReducer);
  const neonEnabled = neon === 'on';
  const state = useGameRun();
  const run = state.run;
  const currentRunId = run?.idGameRun;
  const currentRevision = run?.revisao;
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [attributesOpen, setAttributesOpen] = useState(false);
  const [trainingOpen, setTrainingOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [victoryOpen, setVictoryOpen] = useState(false);
  const [mediumRestOpen, setMediumRestOpen] = useState(false);
  const [mediumRestPreview, setMediumRestPreview] = useState<GameRunMediumRestPreview | null>(null);
  const [mediumRestLoading, setMediumRestLoading] = useState(false);
  const [mediumRestError, setMediumRestError] = useState<string | null>(null);
  const [emptyLoadoutNoticeOpen, setEmptyLoadoutNoticeOpen] = useState(false);
  const [backpackAttention, setBackpackAttention] = useState(false);
  const [expandedAttribute, setExpandedAttribute] = useState<string | null>(null);
  const [xpPulse, setXpPulse] = useState<{ runId: number; sequence: number } | null>(null);
  const noticeShownForRun = useRef<number | null>(null);
  const attentionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapAreaRef = useRef<HTMLDivElement>(null);
  const mapReturnPoint = useRef<{ scrollY: number; nodeId: string | null } | null>(null);
  const pendingMapReturn = useRef<{ scrollY: number; nodeId: string | null } | null>(null);
  const combatWasVisible = useRef(false);
  const combatNodeId = useRef<string | null>(null);
  const combatRewardPending = useRef(false);
  const previousBaseResult = useRef(state.baseResult);
  const combatWasOpen = useRef(false);

  useEffect(() => {
    if (!run || run.status !== 'Vitoria' || state.combatScene || state.lootSpeed !== null ||
      run.estadoAtual.loot?.roll === null) return;
    const key = `game-run:${run.idGameRun}:victory-seen`;
    try { if (window.localStorage.getItem(key) === '1') return; }
    catch { /* Sem persistência local, a vitória ainda pode ser vista nesta sessão. */ }
    setVictoryOpen(true);
  }, [run, state.combatScene, state.lootSpeed]);

  const closeVictory = () => {
    if (run) {
      try { window.localStorage.setItem(`game-run:${run.idGameRun}:victory-seen`, '1'); }
      catch { /* A run permanece concluída no servidor. */ }
    }
    setVictoryOpen(false);
  };

  useEffect(() => () => {
    if (attentionTimer.current) clearTimeout(attentionTimer.current);
  }, []);

  useEffect(() => {
    if (!mediumRestOpen || !currentRunId) return;
    let active = true;
    setMediumRestPreview(null);
    setMediumRestError(null);
    setMediumRestLoading(true);
    void getGameRunMediumRestPreview(currentRunId).then((preview) => {
      if (active) setMediumRestPreview(preview);
    }).catch((error: unknown) => {
      if (active) setMediumRestError(getApiErrorMessage(error, 'Não foi possível consultar o descanso.'));
    }).finally(() => { if (active) setMediumRestLoading(false); });
    return () => { active = false; };
  }, [mediumRestOpen, currentRunId, currentRevision]);

  useLayoutEffect(() => {
    const enteringCombat = Boolean(state.combatScene) && !combatWasOpen.current;
    combatWasOpen.current = Boolean(state.combatScene);
    if (enteringCombat) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [state.combatScene]);

  useLayoutEffect(() => {
    if (state.combatScene) {
      combatWasVisible.current = true;
      combatNodeId.current = state.combatScene.record.noId;
      combatRewardPending.current = state.combatScene.origin !== 'history' &&
        (state.combatScene.record.battle.xpConcedido ?? 0) > 0;
      return;
    }

    const baseChanged = state.baseResult !== null && state.baseResult !== previousBaseResult.current;
    previousBaseResult.current = state.baseResult;
    const returnedFromCombat = combatWasVisible.current;
    combatWasVisible.current = false;
    if (returnedFromCombat && combatRewardPending.current && run)
      setXpPulse((previous) => ({ runId: run.idGameRun, sequence: (previous?.sequence ?? 0) + 1 }));
    combatRewardPending.current = false;
    if (run && (baseChanged || returnedFromCombat)) {
      const returnPoint = mapReturnPoint.current ?? (returnedFromCombat
        ? { scrollY: 0, nodeId: combatNodeId.current } : null);
      mapReturnPoint.current = null;
      combatNodeId.current = null;
      if (returnPoint) {
        const completedNode = run.mapa.nodes.find((node) => node.id ===
          (baseChanged ? state.baseResult?.noId : returnPoint.nodeId));
        const firstAvailableNode = run.mapa.nodes.find((node) => node.state === 'DISPONIVEL');
        pendingMapReturn.current = {
          scrollY: returnPoint.scrollY,
          nodeId: completedNode?.id ??
            (returnPoint.nodeId !== null || baseChanged ? firstAvailableNode?.id : null) ?? null,
        };
      }
    }

    const pending = pendingMapReturn.current;
    if (!run || !pending) return;
    let frame = 0;
    let attempts = 0;
    const restore = () => {
      const nodeElement = Array.from(mapAreaRef.current?.querySelectorAll<SVGGElement>('[data-node-id]') ?? [])
        .find((element) => element.dataset.nodeId === pending.nodeId);
      if (!nodeElement && pending.nodeId && attempts++ < 8) {
        frame = requestAnimationFrame(restore);
        return;
      }
      const headerHeight = Number.parseFloat(getComputedStyle(mapAreaRef.current ?? document.documentElement)
        .getPropertyValue('--main-header-height')) || 85;
      const stickyHeader = mapAreaRef.current?.parentElement?.querySelector<HTMLElement>('[data-run-sticky-header]');
      const nodeHeight = nodeElement?.getBoundingClientRect().height ?? 0;
      const visibleNodeCenter = headerHeight + 18 + (stickyHeader?.getBoundingClientRect().height ?? 0) + nodeHeight / 2 + 12;
      const top = nodeElement ? window.scrollY + nodeElement.getBoundingClientRect().top +
        nodeElement.getBoundingClientRect().height / 2 -
        Math.max(window.innerHeight / 2, visibleNodeCenter) : pending.scrollY;
      const hudElement = mapAreaRef.current?.parentElement;
      if (hudElement) {
        hudElement.removeAttribute('data-map-centering');
        hudElement.style.removeProperty('--map-center-space');
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        if (nodeElement && top > maxScroll) {
          hudElement.style.setProperty('--map-center-space', `${Math.ceil(top - maxScroll)}px`);
          hudElement.dataset.mapCentering = 'true';
        }
      }
      window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
      pendingMapReturn.current = null;
    };
    frame = requestAnimationFrame(() => { frame = requestAnimationFrame(restore); });
    return () => cancelAnimationFrame(frame);
  }, [state.combatScene, state.baseResult, run]);

  if (state.loading && !run) {
    return <RunLoadingPage><LoadingIndicator label="Carregando run" /></RunLoadingPage>;
  }

  if (!run) {
    return <GamePage><RunPanel neon={neonEnabled}>
      <GameSectionTitle>Não foi possível abrir esta jornada</GameSectionTitle>
      <GameNotice $danger role="alert">{state.error ?? 'Run não encontrada.'}</GameNotice>
      <RunFooterActions>
        <GameTextLink to="/jogo">Voltar ao jogo</GameTextLink>
        <CyberButton theme={theme} neon={neon} colorType="secondary" width="160px" text="Recarregar" onClick={() => void state.reload()} />
      </RunFooterActions>
    </RunPanel></GamePage>;
  }

  const combatScene = state.combatScene;
  const lootModal = state.lootSpeed !== null && run.estadoAtual.loot
    ? <RunLootModal key={run.estadoAtual.loot.nodeId} run={run} speed={state.lootSpeed} theme={theme} neon={neon}
      onUpdate={state.updateRewardRun} onClose={state.closeLoot} /> : null;
  const visibleAreas = getVisibleRunMap(run.mapa, run.configuracaoModo).areas;
  const areaImage = visibleAreas.at(-1)?.image ?? getRunAreaImage(run.fase, run.mapa, run.configuracaoModo);
  if (state.targetSelectionOpen && state.targetSetup && run.noAtualId) {
    const node = run.mapa.nodes.find((entry) => entry.id === run.noAtualId);
    return <GameRunPage $areaImage={normalizeImagePath(node?.areaImage ?? undefined) || areaImage}>
      <ReplaySection neon={neonEnabled} aria-labelledby="target-title">
        <GameSectionTitle id="target-title">{node?.name ?? 'Combate'}</GameSectionTitle>
        {state.actionError && <GameNotice $danger role="alert">{state.actionError}</GameNotice>}
        <RunTargetSelection setup={state.targetSetup} theme={theme} neon={neon}
          busy={state.acting} onStart={state.startWithTargets} />
      </ReplaySection>
    </GameRunPage>;
  }
  if (combatScene) {
    const battleNode = [...run.mapa.nodes, ...(run.mapa.historicalNodes ?? [])]
      .find((node) => node.id === combatScene.record.noId);
    const combatAreaImage = normalizeImagePath(battleNode?.areaImage ?? undefined) || areaImage;
    return <GameRunPage $areaImage={combatAreaImage}>
      {lootModal}
      <ReplaySection neon={neonEnabled} $areaImage={combatAreaImage} aria-labelledby="combat-title">
        <GameSectionTitle id="combat-title">{battleNode?.name ?? 'Combate'}</GameSectionTitle>
        <BattleReplay key={`saved-${run.idGameRun}-${combatScene.record.noId}`}
          runId={run.idGameRun} theme={theme} neon={neon}
          playerImage={run.estadoAtual.imagem}
          savedBattle={combatScene.record.battle} onComplete={state.finishCombatReplay}
          onReturnToMap={state.closeCombatReplay}
          isHistoricalReplay={combatScene.origin === 'history'}
          allowCloseBeforeComplete={combatScene.origin === 'history'} />
      </ReplaySection>
    </GameRunPage>;
  }

  const current = run.estadoAtual;
  const status = current.status?.status;
  const imageUrl = normalizeImagePath(current.imagem ?? undefined);
  const resources = [
    { label: 'Vida', tone: 'life' as const, value: status?.vida ?? 0, max: status?.vidaMaxima ?? status?.vida ?? 0 },
    { label: 'Mana', tone: 'mana' as const, value: status?.mana ?? 0, max: status?.manaMaxima ?? status?.mana ?? 0 },
    { label: 'Estamina', tone: 'stamina' as const, value: status?.estamina ?? 0,
      max: status?.estaminaMaxima ?? status?.estamina ?? 0 },
  ];
  const defenses = current.status?.defesas;
  const initialProtection = run.snapshotInicial.status?.defesas?.protecao ?? 0;
  const protection = Math.max(0, defenses?.protecao ?? 0);
  const equippedProtection = (inventory: typeof current.inventario) =>
    parseRunInventoryEntries(inventory, 'ITEM').reduce((sum, item) =>
      sum + (item.defenseEquipped ? item.defense.protecao : 0), 0);
  const initialEquippedProtection = equippedProtection(run.snapshotInicial.inventario);
  const protectionMax = Math.max(protection,
    Math.max(0, initialProtection - initialEquippedProtection) + equippedProtection(current.inventario));
  const attributes = Object.entries(current.status?.atributos?.principais ?? {})
    .concat(Object.entries(current.status?.atributos?.secundarios ?? {}))
    .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1]))
    .map(([code, value]) => ({ code, value,
      short: attributeNames[code]?.[0] ?? code.slice(0, 4),
      name: attributeNames[code]?.[1] ?? code }));
  const selectedNode = run.mapa.nodes.find((node) => node.id === run.noAtualId);
  const dismissEmptyLoadoutNotice = () => {
    setEmptyLoadoutNoticeOpen(false);
    noticeShownForRun.current = run.idGameRun;
    markEmptyLoadoutNoticeSeen(run.idGameRun);
    mapReturnPoint.current = null;
    if (attentionTimer.current) clearTimeout(attentionTimer.current);
    attentionTimer.current = setTimeout(() => {
      setBackpackAttention(true);
      attentionTimer.current = setTimeout(() => {
        setBackpackAttention(false);
        attentionTimer.current = null;
      }, 1500);
    }, 225);
  };
  const selectMapNode = (nodeId: string) => {
    mapReturnPoint.current = { scrollY: window.scrollY, nodeId };
    const node = run.mapa.nodes.find((entry) => entry.id === nodeId);
    const noActions = run.acoesEquipadas === null
      ? run.ordemArmas.length === 0 : !run.acoesEquipadas.some((action) => action.tipo !== 'DESCANSO');
    const hasCompletedCombat = [...run.mapa.nodes, ...(run.mapa.historicalNodes ?? [])]
      .some((entry) => combatNodeTypes.has(entry.type) && entry.state === 'CONCLUIDO');
    if (node && combatNodeTypes.has(node.type) && !hasCompletedCombat && noActions &&
      noticeShownForRun.current !== run.idGameRun && !hasSeenEmptyLoadoutNotice(run.idGameRun)) {
      setEmptyLoadoutNoticeOpen(true);
      return;
    }
    void state.startEncounter(nodeId);
  };
  const canUpgradeMap = canUpgradeGameRunMap(run);
  const hasAvailableNode = run.mapa.nodes.some((node) => node.state === 'DISPONIVEL');

  return <GameRunPage $areaImage={areaImage}>
    {lootModal}
    {attributesOpen && <RunAttributeModal run={run} theme={theme} neon={neon}
      onUpdate={state.updateRewardRun} onClose={() => setAttributesOpen(false)} />}
    {run.estadoAtual.loot?.roll === null && <GameNotice>
      <CyberButton theme={theme} neon={neon} text="Revelar loot" onClick={state.openLoot} />
    </GameNotice>}
    {state.error && <GameNotice $danger role="alert">{state.error}</GameNotice>}
    {state.actionError && <GameNotice $danger role="alert">{state.actionError}</GameNotice>}
    {run.mapa.schemaVersion < 5 && <GameNotice role="status">
      Esta run preserva o mapa antigo. Para gerar áreas com tamanho configurável, publique o novo modo em Gerenciamento &gt; Jogo
      e reinicie a jornada. Esta run não muda automaticamente.
    </GameNotice>}
    {state.baseResult && <GameNotice role="status">
      {state.baseResult.tipo === 'AREA_SECRETA' ? `Entrou em ${state.baseResult.descanso}.` :
      ['EVENTO', 'ATALHO'].includes(state.baseResult.tipo ?? '') ? `${state.baseResult.descanso} concluído.` : <>
        {state.baseResult.descanso}: +{state.baseResult.vidaRecuperada} vida, +{state.baseResult.manaRecuperada} mana,
        {' '}+{state.baseResult.estaminaRecuperada} estamina.
        {(state.baseResult.protecaoReparada ?? 0) > 0 &&
          <> {state.baseResult.protecaoReparada} de proteção dos itens reparada.</>}
      </>}
    </GameNotice>}
    {state.mediumRestResult && <GameNotice role="status">
      {state.mediumRestResult.nome}: +{state.mediumRestResult.vidaRecuperada} vida,
      {' '}+{state.mediumRestResult.manaRecuperada} mana,
      {' '}+{state.mediumRestResult.estaminaRecuperada} estamina. O próximo combate terá um ataque de oportunidade inimigo.
    </GameNotice>}
    <RunHudPanel neon={neonEnabled} aria-label={`Jornada de ${current.nome}`}>
      <RunRegionBackdrops map={run.mapa} config={run.configuracaoModo} mapAreaRef={mapAreaRef} />
      <RunStickyHeader data-run-sticky-header>
        <RunHudTopline>
          <GameTextLink to="/jogo">← Jogo</GameTextLink>
          <RunHudMeta>Fase {run.fase} · {run.status === 'Ativa' ? 'Em andamento' : run.status}
            {' '}· Modo {run.numeroVersaoModo} · Sistema #{run.idSistemaVersao}</RunHudMeta>
          {run.status === 'Ativa' && <button type="button" onClick={() => state.setAbandonDialogOpen(true)}
            disabled={state.abandoning || state.savingWeapons || state.savingLoadout}>Abandonar run</button>}
        </RunHudTopline>
        <RunHudHeader>
          <SnapshotHeader>
            <SnapshotPortrait aria-hidden="true">
              {imageUrl ? <img src={imageUrl} alt="" /> : <PersonOutlineIcon />}
            </SnapshotPortrait>
            <div><h1><OdisseiaAnimatedTitle key={current.nome} theme={theme} neon={neon}
              text={current.nome} compact /></h1>
              <RunXpLabel key={xpPulse?.runId === run.idGameRun ? xpPulse.sequence : 0}
                $pulse={xpPulse?.runId === run.idGameRun}>
                Nível {current.status?.nivel ?? 1} · {current.status?.xp ?? 0} XP
                {(Number(current.status?.pontos ?? 0) + Number(current.status?.pontosAtributo ?? 0)) > 0 &&
                <UpgradeArrow type="button" aria-label="Distribuir pontos de atributos" title="Evoluir atributos"
                  onClick={() => setAttributesOpen(true)}><UpgradeIcon fontSize="small" /></UpgradeArrow>}
              </RunXpLabel>
              </div>
          </SnapshotHeader>
          <ResourceAndAttributes>
            <ResourceList>
              {resources.map((resource) => <RunResourceBar key={resource.label} {...resource} />)}
            </ResourceList>
            <RunDefenseRow aria-label="Defesas atuais">
              <RunProtection><RunResourceBar label="Proteção" value={protection}
                max={protectionMax} tone="protection" /></RunProtection>
              <RunDefenseValue title="Defesa fixa" aria-label={`Defesa: ${defenses?.armadura ?? 0}`}>
                <SecurityOutlinedIcon aria-hidden="true" />{defenses?.armadura ?? 0}
              </RunDefenseValue>
              <RunDefenseValue $shield title="Escudo: absorvido no primeiro impacto"
                aria-label={`Escudo: ${defenses?.escudo ?? 0}`}>
                <ShieldOutlinedIcon aria-hidden="true" />{defenses?.escudo ?? 0}
              </RunDefenseValue>
            </RunDefenseRow>
            {attributes.length > 0 && <AttributeList $neon={neonEnabled} aria-label="Atributos atuais">
              {attributes.map(({ code, short, name, value }) => <button key={code} type="button"
                title={`${name}: ${value}`} aria-label={`${name}: ${value}`}
                aria-expanded={expandedAttribute === code}
                onClick={() => setExpandedAttribute((open) => open === code ? null : code)}
                onBlur={() => setExpandedAttribute(null)}>
                <span>{short}</span><strong>{value}</strong><em>{name}</em>
              </button>)}
            </AttributeList>}
          </ResourceAndAttributes>
        </RunHudHeader>
        {run.status !== 'Ativa' && <RunConclusion $won={run.status === 'Vitoria'} role="status">
          <strong>{run.status === 'Vitoria' ? 'Jornada vencida' :
            run.status === 'Derrota' ? 'Jornada encerrada' : 'Run abandonada'}</strong>
          <span>{state.battles.length} {state.battles.length === 1 ? 'combate' : 'combates'} ·
            {' '}+{state.battles.reduce((total, record) => total + (record.battle.xpConcedido ?? 0), 0)} XP nesta run</span>
          {run.status === 'Vitoria' && <button type="button" onClick={() => setVictoryOpen(true)}>
            Rever vitória
          </button>}
        </RunConclusion>}
        <RunActionRail aria-label="Ações da jornada">
          <button type="button" aria-label="Reiniciar run" title="Reiniciar run"
            disabled={state.restarting || state.acting || state.savingWeapons || state.savingLoadout || state.abandoning}
            onClick={() => void state.restart()}><RestartAltIcon /></button>
          <button type="button" aria-label="Abrir inventário" title="Inventário"
            data-attention={backpackAttention}
            disabled={state.acting}
            onClick={() => setInventoryOpen(true)}><BackpackOutlinedIcon /></button>
          {run.status === 'Ativa' && <button type="button" aria-label="Abrir treino livre" title="Treino livre"
            disabled={state.acting} onClick={() => setTrainingOpen(true)}>
            <TrainingIcon><TrackChangesOutlinedIcon /><NorthEastIcon /></TrainingIcon>
          </button>}
          {run.status === 'Ativa' && <button type="button" aria-label="Descanso médio" title="Descanso médio"
            disabled={state.acting || state.resting || run.noAtualId !== null}
            onClick={() => setMediumRestOpen(true)}><HotelOutlinedIcon /></button>}
          <button type="button" aria-label="Histórico de combates" title="Histórico de combates"
            disabled={state.acting} onClick={() => setHistoryOpen(true)}><HistoryIcon /></button>
        </RunActionRail>
      </RunStickyHeader>
      <RunMapArea ref={mapAreaRef}>
        <RunMapCanvas map={run.mapa} config={run.configuracaoModo} neon={neonEnabled}
          active={run.status === 'Ativa' && run.noAtualId === null}
          acting={state.acting || state.savingWeapons || state.savingLoadout || state.restarting}
          onSelect={selectMapNode} />
      </RunMapArea>
      {state.acting && createPortal(<RunRouteBusy><LoadingIndicator label="Preparando rota" /></RunRouteBusy>, document.body)}
      {canUpgradeMap && state.actionError && <RunFooterActions>
        <CyberButton theme={theme} neon={neon} width="180px" text="Atualizar mapa"
          loading={state.acting} disabled={state.acting || state.savingWeapons} onClick={() => void state.upgradeMap()} />
      </RunFooterActions>}
      {run.status === 'Ativa' && selectedNode?.state === 'SELECIONADO' && <RunFooterActions>
        <CyberButton theme={theme} neon={neon} width="180px" text="Retomar"
          loading={state.acting} disabled={state.acting} onClick={() => void state.resumeEncounter()} />
      </RunFooterActions>}
      {run.status === 'Ativa' && !run.noAtualId && !hasAvailableNode && !canUpgradeMap &&
        <GameHint>Este trecho terminou. Novas etapas chegam na próxima camada.</GameHint>}
    </RunHudPanel>

    {victoryOpen && run.status === 'Vitoria' && <RunVictoryScreen run={run} battles={state.battles}
      theme={theme} neon={neon} onClose={closeVictory}
      onHistory={() => { closeVictory(); setHistoryOpen(true); }} />}
    <RunTrainingDialog open={historyOpen} onClose={() => setHistoryOpen(false)}
      aria-labelledby="history-title" maxWidth="sm" fullWidth>
      <RunTrainingPanel neon={neonEnabled}>
        <RunHudTopline><GameSectionTitle id="history-title">Combates concluídos</GameSectionTitle>
          <button type="button" aria-label="Fechar histórico" onClick={() => setHistoryOpen(false)}><CloseIcon /></button>
        </RunHudTopline>
        <RunTrainingBody>
          {state.historyError && <>
            <GameNotice $danger role="alert">{state.historyError}</GameNotice>
            <RunFooterActions>
              <CyberButton theme={theme} neon={neon} colorType="secondary" width="160px"
                text="Tentar novamente" onClick={() => void state.reloadBattles()} />
            </RunFooterActions>
          </>}
          {state.battles.length === 0 ?
            !state.historyError && <GameHint>Nenhum combate concluído nesta jornada.</GameHint> :
            <RunBattleHistoryNav aria-label="Rever combates da run">
              {state.battles.map((record) => <button key={record.noId} type="button"
                onClick={() => {
                  mapReturnPoint.current = { scrollY: window.scrollY, nodeId: null };
                  setHistoryOpen(false);
                  state.openBattle(record);
                }}>
                {record.ordem}. {[...run.mapa.nodes, ...(run.mapa.historicalNodes ?? [])]
                  .find((node) => node.id === record.noId)?.name || 'Sentinela de treino'}
              </button>)}
            </RunBattleHistoryNav>}
        </RunTrainingBody>
      </RunTrainingPanel>
    </RunTrainingDialog>

    {inventoryOpen && (run.acoesEquipadas !== null
      ? <RunLoadout run={run} theme={theme} neon={neon}
          saving={state.savingLoadout || Boolean(state.consumingItemId)}
          error={state.actionError} busy={state.acting || Boolean(state.consumingItemId)}
          onSave={state.saveLoadout} onUseItem={state.consumeItem} onDropItem={state.dropItem} onEquipDefense={state.equipDefense}
          usingItemId={state.consumingItemId}
          onClose={() => setInventoryOpen(false)} />
      : <RunInventory run={run} theme={theme} neon={neon}
          saving={state.savingWeapons || Boolean(state.consumingItemId)}
          error={state.actionError} busy={state.acting || Boolean(state.consumingItemId)}
          onSave={state.saveWeaponOrder} onUseItem={state.consumeItem} onDropItem={state.dropItem} onEquipDefense={state.equipDefense}
          usingItemId={state.consumingItemId}
          onClose={() => setInventoryOpen(false)} />)}
    <RunTrainingDialog open={trainingOpen} onClose={() => setTrainingOpen(false)}
      aria-labelledby="training-title" maxWidth="md" fullWidth>
      <RunTrainingPanel neon={neonEnabled}>
        <RunHudTopline><GameSectionTitle id="training-title">Treino livre</GameSectionTitle>
          <button type="button" aria-label="Fechar treino" onClick={() => setTrainingOpen(false)}><CloseIcon /></button>
        </RunHudTopline>
        <RunTrainingBody>
          {trainingOpen && <BattleReplay key={run.idGameRun} runId={run.idGameRun} theme={theme} neon={neon}
            playerImage={run.estadoAtual.imagem} />}
        </RunTrainingBody>
      </RunTrainingPanel>
    </RunTrainingDialog>
    <ConfirmDialog open={state.targetPromptOpen} title="Definir alvos?"
      compactActions
      message="Escolha quem atacar antes de começar."
      confirmText="Escolher alvos" cancelText="Começar direto" danger={false}
      onConfirm={state.chooseTargets} onCancel={state.startWithDefaultTargets}>
      <CheckBox neon={neon} label="Não perguntar de novo nesta run" width="fit-content" height="auto"
        checked={state.skipTargetPromptChecked} onChange={state.setSkipTargetPromptChecked} />
    </ConfirmDialog>
    <ConfirmDialog open={mediumRestOpen} title="Descanso médio"
      message={mediumRestLoading ? 'Consultando a regra publicada do Sistema...' :
        mediumRestError ?? mediumRestPreview?.motivo ??
        (mediumRestPreview ? `Uma vez por mapa. ${mediumRestPreview.nome} recupera agora +${mediumRestPreview.vidaRecuperada} vida, +${mediumRestPreview.manaRecuperada} mana e +${mediumRestPreview.estaminaRecuperada} estamina, além de restaurar os usos até descanso dos itens. No próximo combate, o primeiro inimigo fará um ataque extra inicial com vantagem (rola dois dados e usa o maior); depois, a ordem de turnos segue normalmente.` : 'Preparando o descanso...')}
      confirmText="Descansar" cancelText="Cancelar" danger={false} showCloseButton
      confirmDisabled={!mediumRestPreview?.disponivel || mediumRestLoading || Boolean(mediumRestError)}
      isLoading={state.resting}
      onCancel={() => setMediumRestOpen(false)}
      onConfirm={() => { void state.mediumRest().then((done) => { if (done) setMediumRestOpen(false); }); }} />
    <ConfirmDialog open={emptyLoadoutNoticeOpen}
      title="Sem ações equipadas"
      message="Você está entrando no primeiro combate sem ações configuradas. Equipe um item, prótese, magia ou skill na mochila. Sem isso, será usado o ataque de reserva."
      confirmText="Entendi" danger={false} hideCancelButton showCloseButton
      onConfirm={dismissEmptyLoadoutNotice} onCancel={dismissEmptyLoadoutNotice} />
    <ConfirmDialog open={state.abandonDialogOpen} title="Abandonar esta run?"
      message="O progresso desta run será encerrado. Seu personagem original não será alterado."
      confirmText="Abandonar" onConfirm={() => void state.abandon()}
      onCancel={() => state.setAbandonDialogOpen(false)} isLoading={state.abandoning} />
  </GameRunPage>;
}
