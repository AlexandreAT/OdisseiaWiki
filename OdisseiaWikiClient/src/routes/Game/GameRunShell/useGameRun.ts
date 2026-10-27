import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { GameRunActionSelection, GameRunBaseResolution, GameRunBattleRecord, GameRunConsumeItemResult, GameRunDto, GameRunEncounterSetup, GameRunMediumRestResolution, GameRunConditionOriginRequest, GameRunMutationRequest } from '../../../models/GameRun';
import {
  upgradeGameRunWeapon,
  abandonGameRun, enterGameRunBase, getGameRun, getGameRunBattles,
  consumeGameRunItem,
  dropGameRunItem,
  equipGameRunDefenseItem,
  getCurrentGameRunEncounterSetup,
  resolveGameRunBattle, resolveGameRunEvent, restartGameRun, selectGameRunNode, upgradeGameRunMap,
  performGameRunMediumRest,
  updateGameRunLoadout, updateGameRunWeaponOrder,
  updateGameRunConditionOrigin,
  enterGameRunVendor, buyGameRunVendorItem, leaveGameRunVendor, transferGameRunStashItem, sellGameRunVendorItems, repairGameRunDefense,
  changeGameRunProtectedItem,
  visitGameRunNpc,
} from '../../../services/gameRunService';
import { getApiErrorMessage } from '../../../utils/apiError';
import { shouldAutoCloseCombat, type CombatOrigin } from './battleReplayFlow';
import { battleWinner } from '../BattleReplay/battleOutcome';
import { canManageRunItem } from './runRewardActions';

interface CombatScene {
  record: GameRunBattleRecord;
  origin: CombatOrigin;
}

interface PendingEncounter {
  runId: number;
  nodeId: string;
  revision: number;
  selectKey: string;
  resolveKey: string;
}

const battleSeenKey = (runId: number, record: GameRunBattleRecord) =>
  `game-run:${runId}:battle:${record.noId}:${record.ordem}:seen`;
const targetPromptKey = (runId: number) => `game-run:${runId}:skip-target-prompt`;
const hasSkippedTargetPrompt = (runId: number): boolean => {
  try { return window.localStorage.getItem(targetPromptKey(runId)) === '1'; }
  catch { return false; }
};

const hasSeenBattle = (runId: number, record: GameRunBattleRecord): boolean => {
  try { return window.localStorage.getItem(battleSeenKey(runId, record)) === '1'; }
  catch { return false; }
};

const markBattleSeen = (runId: number, record: GameRunBattleRecord): void => {
  try { window.localStorage.setItem(battleSeenKey(runId, record), '1'); }
  catch { /* A run continua utilizável mesmo com armazenamento local bloqueado. */ }
};

const apiErrorCode = (error: unknown): string | undefined => {
  const data = (error as { response?: { data?: { codigo?: unknown } } } | null)?.response?.data;
  return typeof data?.codigo === 'string' ? data.codigo : undefined;
};

export const canUpgradeGameRunMap = (candidate: GameRunDto): boolean =>
  candidate.status === 'Ativa' && candidate.noAtualId === null &&
  candidate.mapa.schemaVersion < 3;

const upgradeLegacyMap = async (candidate: GameRunDto): Promise<GameRunDto> => {
  if (!canUpgradeGameRunMap(candidate)) return candidate;
  const update = (run: GameRunDto) => upgradeGameRunMap(run.idGameRun, {
    revisaoEsperada: run.revisao, chaveIdempotencia: crypto.randomUUID(),
  });
  try {
    return await update(candidate);
  } catch (error: unknown) {
    if (!['REVISAO_DESATUALIZADA', 'MAPA_INDISPONIVEL'].includes(apiErrorCode(error) ?? '')) throw error;
    const latest = await getGameRun(candidate.idGameRun);
    return canUpgradeGameRunMap(latest) ? update(latest) : latest;
  }
};

export const useGameRun = () => {
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const runId = Number(id);
  const [run, setRun] = useState<GameRunDto | null>(null);
  const [economyBusy, setEconomyBusy] = useState(false);
  const [battles, setBattles] = useState<GameRunBattleRecord[]>([]);
  const [combatScene, setCombatScene] = useState<CombatScene | null>(null);
  const [lootSpeed, setLootSpeed] = useState<1 | 2 | null>(null);
  const [targetSetup, setTargetSetup] = useState<GameRunEncounterSetup | null>(null);
  const [targetPromptOpen, setTargetPromptOpen] = useState(false);
  const [skipTargetPromptChecked, setSkipTargetPromptChecked] = useState(false);
  const [targetSelectionOpen, setTargetSelectionOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [abandoning, setAbandoning] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [acting, setActing] = useState(false);
  const [savingWeapons, setSavingWeapons] = useState(false);
  const [savingLoadout, setSavingLoadout] = useState(false);
  const [consumingItemId, setConsumingItemId] = useState<string | null>(null);
  const [resting, setResting] = useState(false);
  const [mediumRestResult, setMediumRestResult] = useState<GameRunMediumRestResolution | null>(null);
  const [abandonDialogOpen, setAbandonDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [baseResult, setBaseResult] = useState<GameRunBaseResolution | null>(null);
  const pendingAbandon = useRef<{ revision: number; key: string } | null>(null);
  const pendingRestart = useRef<{ runId: number; revision: number; key: string } | null>(null);
  const pendingAction = useRef<{ revision: number; key: string; targets?: string } | null>(null);
  const pendingEncounter = useRef<PendingEncounter | null>(null);
  const encounterInFlight = useRef(false);
  const skippedTargetPromptRun = useRef<number | null>(null);
  const pendingWeaponOrder = useRef<{ revision: number; key: string; signature: string } | null>(null);
  const pendingLoadout = useRef<{ revision: number; key: string; signature: string } | null>(null);
  const pendingConsumable = useRef<{ revision: number; key: string; itemId: string; quantity: number } | null>(null);
  const pendingEconomy = useRef<{ runId: number; revision: number; signature: string; key: string } | null>(null);
  const economyInFlight = useRef(false);
  const rewardReturnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSequence = useRef(0);
  const currentRun = run?.idGameRun === runId ? run : null;

  useEffect(() => () => {
    if (rewardReturnTimer.current) clearTimeout(rewardReturnTimer.current);
  }, []);

  const reload = useCallback(async () => {
    if (rewardReturnTimer.current) clearTimeout(rewardReturnTimer.current);
    const sequence = ++requestSequence.current;
    setRun(null);
    setBattles([]);
    setCombatScene(null);
    setLootSpeed(null);
    setTargetSetup(null);
    setTargetPromptOpen(false);
    setSkipTargetPromptChecked(false);
    setTargetSelectionOpen(false);
    setActionError(null);
    setHistoryError(null);
    setBaseResult(null);
    setMediumRestResult(null);
    setAbandonDialogOpen(false);
    pendingAbandon.current = null;
    pendingAction.current = null;
    pendingEncounter.current = null;
    pendingWeaponOrder.current = null;
    pendingLoadout.current = null;
    pendingConsumable.current = null;
    pendingEconomy.current = null;
    if (!Number.isInteger(runId) || runId <= 0) {
      setError('Run inválida. Verifique o endereço.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [runResult, battlesResult] = await Promise.allSettled([
        getGameRun(runId), getGameRunBattles(runId),
      ]);
      if (runResult.status === 'rejected') throw runResult.reason;
      const result = runResult.value;
      let readyRun = result;
      try { readyRun = await upgradeLegacyMap(result); }
      catch (upgradeError: unknown) {
        if (sequence === requestSequence.current)
          setActionError(getApiErrorMessage(upgradeError, 'Não foi possível atualizar o mapa desta run.'));
      }
      if (sequence === requestSequence.current) {
        const savedBattles = battlesResult.status === 'fulfilled' ? battlesResult.value : [];
        if (battlesResult.status === 'rejected')
          setHistoryError(getApiErrorMessage(battlesResult.reason, 'Não foi possível carregar o histórico de combates.'));
        const latest = savedBattles[savedBattles.length - 1];
        const unseen = latest && !hasSeenBattle(runId, latest) ? latest : null;
        setCombatScene(unseen ? { record: unseen, origin: 'current' } : null);
        if (!unseen && readyRun.estadoAtual.loot?.roll === null) setLootSpeed(1);
        setRun(readyRun);
        setBattles(savedBattles);
      }
    } catch (requestError: unknown) {
      if (sequence === requestSequence.current)
        setError(getApiErrorMessage(requestError, 'Não foi possível carregar esta run.'));
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, [runId]);

  useEffect(() => { void reload(); }, [reload]);

  const reloadBattles = useCallback(async () => {
    if (!Number.isInteger(runId) || runId <= 0) return;
    const sequence = requestSequence.current;
    setHistoryError(null);
    try {
      const savedBattles = await getGameRunBattles(runId);
      if (sequence !== requestSequence.current) return;
      setBattles(savedBattles);
    } catch (requestError: unknown) {
      if (sequence === requestSequence.current)
        setHistoryError(getApiErrorMessage(requestError, 'Não foi possível carregar o histórico de combates.'));
    }
  }, [runId]);

  const handleActionError = async (requestError: unknown, fallback: string) => {
    if (apiErrorCode(requestError) === 'REVISAO_DESATUALIZADA') {
      await reload();
      setActionError('A run mudou. Confira o estado atualizado antes de tentar novamente.');
    } else {
      setActionError(getApiErrorMessage(requestError, fallback));
    }
  };

  const finishEncounter = async (result: Awaited<ReturnType<typeof resolveGameRunBattle>>) => {
    setTargetSetup(null);
    setTargetPromptOpen(false);
    setTargetSelectionOpen(false);
    setBaseResult(null);
    setMediumRestResult(null);
    const record: GameRunBattleRecord = {
      noId: result.noId, ordem: result.ordem,
      criadaEmUtc: result.criadaEmUtc, battle: result.battle,
    };
    setCombatScene({ record, origin: 'current' });
    setRun(result.run);
    if (result.battle.resultado.winnerActorId && result.battle.resultado.endReason === 'ActorDefeated') {
      setBattles((previous) => previous.some((battle) => battle.noId === record.noId)
        ? previous : [...previous, record]);
    }
    pendingEncounter.current = null;
    pendingAction.current = null;
    try { setRun(await upgradeLegacyMap(result.run)); }
    catch (upgradeError: unknown) {
      setActionError(getApiErrorMessage(upgradeError, 'Não foi possível atualizar o mapa desta run.'));
    }
  };

  const resolvePreparedEncounter = async (alvos: { actorId: string; targetId: string }[] = []) => {
    if (!currentRun?.noAtualId || acting) return;
    const targets = JSON.stringify(alvos);
    const pending = pendingAction.current?.revision === currentRun.revisao &&
      pendingAction.current.targets === targets ? pendingAction.current
      : { revision: currentRun.revisao, key: crypto.randomUUID(), targets };
    pendingAction.current = pending;
    setTargetPromptOpen(false);
    setActing(true);
    setActionError(null);
    try {
      await finishEncounter(await resolveGameRunBattle(currentRun.idGameRun, {
        revisaoEsperada: pending.revision, chaveIdempotencia: pending.key, alvos,
      }));
    } catch (requestError: unknown) {
      await handleActionError(requestError, 'Não foi possível iniciar o combate. Tente novamente.');
    } finally { setActing(false); }
  };

  const startEncounter = async (nodeId: string) => {
    if (currentRun?.estadoAtual.loot?.roll === null) { setLootSpeed(1); return; }
    if (!currentRun || currentRun.status !== 'Ativa' || !nodeId || acting || encounterInFlight.current ||
      savingWeapons || savingLoadout) return;
    const node = currentRun.mapa.nodes.find((entry) => entry.id === nodeId);
    if (currentRun.noAtualId !== null || node?.state !== 'DISPONIVEL' ||
      !['COMBATE', 'ELITE', 'BOSS', 'CACADA', 'BASE', 'DESCANSO', 'EVENTO', 'ATALHO', 'AREA_SECRETA', 'VENDEDOR', 'NPC'].includes(node.type)) return;
    encounterInFlight.current = true;
    setActing(true);
    setActionError(null);
    const pending = pendingEncounter.current?.runId === currentRun.idGameRun &&
      pendingEncounter.current.nodeId === nodeId &&
      pendingEncounter.current.revision === currentRun.revisao
      ? pendingEncounter.current
      : {
        runId: currentRun.idGameRun, nodeId, revision: currentRun.revisao,
        selectKey: crypto.randomUUID(), resolveKey: crypto.randomUUID(),
      };
    pendingEncounter.current = pending;
    try {
      if (node.type === 'NPC') {
        const result = await visitGameRunNpc(pending.runId, pending.nodeId, {
          revisaoEsperada: pending.revision, chaveIdempotencia: pending.selectKey,
        });
        setRun(result.run);
        setBaseResult(['NPC_MERCADOR', 'NPC_SABIO', 'NPC_ENGENHEIRO'].includes(result.tipo ?? '') ? null : result);
        setMediumRestResult(null);
        pendingEncounter.current = null;
        return;
      }
      if (node.type === 'VENDEDOR') {
        setRun(await enterGameRunVendor(pending.runId, pending.nodeId, {
          revisaoEsperada: pending.revision, chaveIdempotencia: pending.selectKey,
        }));
        pendingEncounter.current = null;
        return;
      }
      if (['BASE', 'DESCANSO', 'EVENTO', 'ATALHO', 'AREA_SECRETA'].includes(node.type)) {
        const result = await (['EVENTO', 'ATALHO', 'AREA_SECRETA'].includes(node.type) ? resolveGameRunEvent : enterGameRunBase)(
          pending.runId, pending.nodeId, {
          revisaoEsperada: pending.revision, chaveIdempotencia: pending.selectKey,
        });
        setRun(result.run);
        setBaseResult(result);
        setMediumRestResult(null);
        pendingEncounter.current = null;
        return;
      }
      const selected = await selectGameRunNode(pending.runId, pending.nodeId, {
        revisaoEsperada: pending.revision, chaveIdempotencia: pending.selectKey,
      });
      setRun(selected);
      const setup = await getCurrentGameRunEncounterSetup(pending.runId);
      if (setup.oponentes.length > 1 && skippedTargetPromptRun.current !== runId && !hasSkippedTargetPrompt(runId)) {
        setTargetSetup(setup);
        setSkipTargetPromptChecked(false);
        setTargetPromptOpen(true);
        return;
      }
      const result = await resolveGameRunBattle(pending.runId, {
        revisaoEsperada: selected.revisao, chaveIdempotencia: pending.resolveKey, alvos: [],
      });
      await finishEncounter(result);
    } catch (requestError: unknown) {
      await handleActionError(requestError, ['BASE', 'DESCANSO', 'EVENTO', 'ATALHO', 'AREA_SECRETA'].includes(node.type)
        ? 'Não foi possível concluir esta opção. Tente novamente.'
        : 'Não foi possível iniciar o combate. Tente novamente.');
    } finally {
      encounterInFlight.current = false;
      setActing(false);
    }
  };

  const resumeEncounter = async () => {
    if (!currentRun || currentRun.status !== 'Ativa' || !currentRun.noAtualId || acting || savingWeapons || savingLoadout ||
      currentRun.mapa.nodes.some((node) => node.id === currentRun.noAtualId &&
        (node.type === 'VENDEDOR' || node.type === 'NPC'))) return;
    setActing(true);
    setActionError(null);
    const pending = pendingAction.current?.revision === currentRun.revisao
      ? pendingAction.current
      : { revision: currentRun.revisao, key: crypto.randomUUID() };
    pendingAction.current = pending;
    try {
      const setup = await getCurrentGameRunEncounterSetup(currentRun.idGameRun);
      if (setup.oponentes.length > 1 && skippedTargetPromptRun.current !== runId && !hasSkippedTargetPrompt(runId)) {
        setTargetSetup(setup);
        setSkipTargetPromptChecked(false);
        setTargetPromptOpen(true);
        return;
      }
      const result = await resolveGameRunBattle(currentRun.idGameRun, {
        revisaoEsperada: pending.revision, chaveIdempotencia: pending.key, alvos: [],
      });
      await finishEncounter(result);
    } catch (requestError: unknown) {
      await handleActionError(requestError, 'Não foi possível continuar o combate. Tente novamente.');
    } finally {
      setActing(false);
    }
  };

  const upgradeMap = async () => {
    if (!currentRun || !canUpgradeGameRunMap(currentRun) || acting || savingWeapons || savingLoadout) return;
    setActing(true);
    setActionError(null);
    try {
      setRun(await upgradeLegacyMap(currentRun));
      setBaseResult(null);
    } catch (requestError: unknown) {
      await handleActionError(requestError, 'Não foi possível atualizar o mapa. Tente novamente.');
    } finally {
      setActing(false);
    }
  };

  const saveWeaponOrder = async (order: string[]): Promise<boolean> => {
    if (!currentRun || currentRun.status !== 'Ativa' || currentRun.noAtualId || acting || savingWeapons || savingLoadout)
      return false;
    const signature = JSON.stringify(order);
    const pending = pendingWeaponOrder.current?.revision === currentRun.revisao &&
      pendingWeaponOrder.current.signature === signature
      ? pendingWeaponOrder.current
      : { revision: currentRun.revisao, key: crypto.randomUUID(), signature };
    pendingWeaponOrder.current = pending;
    setSavingWeapons(true);
    setActionError(null);
    try {
      const updated = await updateGameRunWeaponOrder(currentRun.idGameRun, {
        revisaoEsperada: pending.revision,
        chaveIdempotencia: pending.key,
        ordemArmas: order,
      });
      setRun(updated);
      pendingWeaponOrder.current = null;
      return true;
    } catch (requestError: unknown) {
      await handleActionError(requestError, 'Não foi possível salvar a ordem das armas. Tente novamente.');
      return false;
    } finally {
      setSavingWeapons(false);
    }
  };

  const saveLoadout = async (actions: GameRunActionSelection[], defenseIds?: string[]): Promise<boolean> => {
    if (!currentRun || currentRun.acoesEquipadas === null || currentRun.status !== 'Ativa' ||
      currentRun.noAtualId || acting || savingLoadout) return false;
    const signature = JSON.stringify({ actions, defenseIds });
    const pending = pendingLoadout.current?.revision === currentRun.revisao &&
      pendingLoadout.current.signature === signature
      ? pendingLoadout.current
      : { revision: currentRun.revisao, key: crypto.randomUUID(), signature };
    pendingLoadout.current = pending;
    setSavingLoadout(true);
    setActionError(null);
    try {
      const updated = await updateGameRunLoadout(currentRun.idGameRun, {
        revisaoEsperada: pending.revision,
        chaveIdempotencia: pending.key,
        acoes: actions,
        defesasEquipadas: defenseIds,
      });
      setRun(updated);
      pendingLoadout.current = null;
      return true;
    } catch (requestError: unknown) {
      await handleActionError(requestError, 'Não foi possível salvar as ações equipadas.');
      return false;
    } finally {
      setSavingLoadout(false);
    }
  };

  const consumeItem = async (itemId: string, quantity = 1): Promise<GameRunConsumeItemResult | null> => {
    if (!currentRun || !canManageRunItem(currentRun, itemId) || currentRun.noAtualId !== null ||
      acting || savingWeapons || savingLoadout || consumingItemId) return null;
    const pending = pendingConsumable.current?.revision === currentRun.revisao &&
      pendingConsumable.current.itemId === itemId && pendingConsumable.current.quantity === quantity
      ? pendingConsumable.current
      : { revision: currentRun.revisao, key: crypto.randomUUID(), itemId, quantity };
    pendingConsumable.current = pending;
    setConsumingItemId(itemId);
    setActionError(null);
    try {
      const result = await consumeGameRunItem(currentRun.idGameRun, {
        revisaoEsperada: pending.revision,
        chaveIdempotencia: pending.key,
        idInstancia: itemId,
        quantidade: quantity,
      });
      setRun(result.run);
      pendingConsumable.current = null;
      return result;
    } catch (requestError: unknown) {
      await handleActionError(requestError, 'Não foi possível usar este consumível.');
      return null;
    } finally {
      setConsumingItemId(null);
    }
  };

  const dropItem = async (itemId: string): Promise<boolean> => {
    if (!currentRun || currentRun.status !== 'Ativa' || currentRun.noAtualId || acting || consumingItemId) return false;
    setConsumingItemId(itemId);
    setActionError(null);
    try {
      setRun(await dropGameRunItem(currentRun.idGameRun, itemId, {
        revisaoEsperada: currentRun.revisao, chaveIdempotencia: crypto.randomUUID(),
      }));
      return true;
    } catch (error: unknown) {
      await handleActionError(error, 'Não foi possível deixar este item.');
      return false;
    } finally { setConsumingItemId(null); }
  };

  const equipDefense = async (itemId: string, equipado: boolean): Promise<boolean> => {
    if (!currentRun || !canManageRunItem(currentRun, itemId) || currentRun.noAtualId || acting || consumingItemId) return false;
    setConsumingItemId(itemId);
    setActionError(null);
    try {
      setRun(await equipGameRunDefenseItem(currentRun.idGameRun, itemId, {
        revisaoEsperada: currentRun.revisao, chaveIdempotencia: crypto.randomUUID(), equipado,
      }));
      return true;
    } catch (error: unknown) {
      await handleActionError(error, 'Não foi possível alterar o equipamento defensivo.');
      return false;
    } finally { setConsumingItemId(null); }
  };

  const configureCondition = async (
    origin: Omit<GameRunConditionOriginRequest, 'revisaoEsperada' | 'chaveIdempotencia'>,
  ): Promise<boolean> => {
    if (!currentRun || currentRun.status !== 'Ativa' || currentRun.noAtualId || acting ||
      consumingItemId || savingLoadout || savingWeapons) return false;
    setConsumingItemId(origin.idInstancia);
    setActionError(null);
    try {
      setRun(await updateGameRunConditionOrigin(currentRun.idGameRun, {
        ...origin, revisaoEsperada: currentRun.revisao, chaveIdempotencia: crypto.randomUUID(),
      }));
      return true;
    } catch (error: unknown) {
      await handleActionError(error, 'Não foi possível ajustar a condição desta cópia.');
      return false;
    } finally { setConsumingItemId(null); }
  };

  const mediumRest = async (): Promise<boolean> => {
    if (!currentRun || currentRun.status !== 'Ativa' || currentRun.noAtualId ||
      acting || resting || savingWeapons || savingLoadout || consumingItemId) return false;
    setResting(true);
    setActionError(null);
    try {
      const result = await performGameRunMediumRest(currentRun.idGameRun, {
        revisaoEsperada: currentRun.revisao,
        chaveIdempotencia: crypto.randomUUID(),
      });
      setRun(result.run);
      setMediumRestResult(result);
      return true;
    } catch (requestError: unknown) {
      await handleActionError(requestError, 'Não foi possível realizar o descanso médio.');
      return false;
    } finally { setResting(false); }
  };

  const abandon = async () => {
    if (!currentRun || currentRun.status !== 'Ativa' || abandoning || savingWeapons || savingLoadout) return;
    setAbandoning(true);
    setActionError(null);
    const pending = pendingAbandon.current?.revision === currentRun.revisao
      ? pendingAbandon.current
      : { revision: currentRun.revisao, key: crypto.randomUUID() };
    pendingAbandon.current = pending;

    try {
      await abandonGameRun(currentRun.idGameRun, {
        revisaoEsperada: pending.revision,
        chaveIdempotencia: pending.key,
      });
      pendingAbandon.current = null;
      setAbandonDialogOpen(false);
      navigate('/jogo', { replace: true });
    } catch (requestError: unknown) {
      const status = (requestError as { response?: { status?: number } } | null)?.response?.status;
      if (status === 409) {
        pendingAbandon.current = null;
        setAbandonDialogOpen(false);
        await reload();
        setActionError('O estado desta run mudou. Confira os dados atualizados antes de confirmar novamente.');
      } else {
        setActionError(getApiErrorMessage(requestError, 'Não foi possível abandonar a run. Tente novamente.'));
      }
    } finally {
      setAbandoning(false);
    }
  };

  const restart = async () => {
    if (!currentRun || restarting || acting || savingWeapons || savingLoadout || abandoning) return;
    setRestarting(true);
    setActionError(null);
    const pending = pendingRestart.current?.runId === currentRun.idGameRun &&
      pendingRestart.current.revision === currentRun.revisao
      ? pendingRestart.current
      : { runId: currentRun.idGameRun, revision: currentRun.revisao, key: crypto.randomUUID() };
    pendingRestart.current = pending;
    try {
      const fresh = await restartGameRun(pending.runId, {
        revisaoEsperada: pending.revision,
        chaveIdempotencia: pending.key,
      });
      pendingRestart.current = null;
      navigate(`/jogo/run/${fresh.idGameRun}`, { replace: true });
    } catch (requestError: unknown) {
      if ((requestError as { response?: { status?: number } } | null)?.response?.status === 409) {
        pendingRestart.current = null;
        await reload();
        setActionError('A run mudou. Confira o estado atualizado antes de reiniciar.');
      } else {
        setActionError(getApiErrorMessage(requestError, 'Não foi possível reiniciar a run. Tente novamente.'));
      }
    } finally {
      setRestarting(false);
    }
  };

  const rememberTargetPromptPreference = () => {
    if (!skipTargetPromptChecked) return;
    skippedTargetPromptRun.current = runId;
    try { window.localStorage.setItem(targetPromptKey(runId), '1'); }
    catch { /* A escolha ainda vale nesta montagem quando o armazenamento estiver indisponivel. */ }
  };

  const economyAction = async (signature: string,
    action: (run: GameRunDto, request: GameRunMutationRequest) => Promise<GameRunDto>): Promise<boolean> => {
    if (!currentRun || economyInFlight.current || acting || savingWeapons || savingLoadout || consumingItemId) return false;
    economyInFlight.current = true;
    const pending = pendingEconomy.current?.runId === currentRun.idGameRun &&
      pendingEconomy.current.revision === currentRun.revisao && pendingEconomy.current.signature === signature
      ? pendingEconomy.current : { runId: currentRun.idGameRun, revision: currentRun.revisao,
        signature, key: crypto.randomUUID() };
    pendingEconomy.current = pending;
    setEconomyBusy(true); setActionError(null);
    try {
      setRun(await action(currentRun, { revisaoEsperada: pending.revision, chaveIdempotencia: pending.key }));
      pendingEconomy.current = null;
      return true;
    } catch (reason: unknown) {
      await handleActionError(reason, 'Não foi possível atualizar a economia desta run.');
      return false;
    } finally { economyInFlight.current = false; setEconomyBusy(false); }
  };

  return {
    run: currentRun,
    economyBusy,
    upgradeWeapon: (itemId: string) => economyAction(`upgrade:${itemId}`, (active, request) =>
      upgradeGameRunWeapon(active.idGameRun, { ...request, itemId })),
    repairDefense: (itemId: string) => economyAction(`repair:${itemId}`, (active, request) =>
      repairGameRunDefense(active.idGameRun, { ...request, itemId })),
    changeProtectedItem: (itemId: string, action: import('../../../models/GameRun').ProtectedDepositAction) =>
      economyAction(`protected:${itemId}:${action}`, (active, request) =>
        changeGameRunProtectedItem(active.idGameRun, { ...request, itemId, action })),
    buyVendorItem: (itemId: string, toStash: boolean) => economyAction(`buy:${itemId}:${toStash}`, (active, request) =>
      buyGameRunVendorItem(active.idGameRun, { ...request, itemId, toStash })),
    sellVendorItems: (items: import('./runEconomy').RunSaleLine[], fromStash: boolean) =>
      economyAction(`sell:${fromStash}:${JSON.stringify(items)}`, (active, request) =>
        sellGameRunVendorItems(active.idGameRun, { ...request, items, fromStash })),
    leaveVendor: () => economyAction('leave', (active, request) => leaveGameRunVendor(active.idGameRun, request)),
    transferStashItem: (itemId: string, toStash: boolean) => economyAction(`transfer:${itemId}:${toStash}`, (active, request) =>
      transferGameRunStashItem(active.idGameRun, { ...request, itemId, toStash })),
    battles,
    historyError,
    reloadBattles,
    combatScene,
    targetSetup,
    targetPromptOpen,
    skipTargetPromptChecked,
    setSkipTargetPromptChecked,
    targetSelectionOpen,
    chooseTargets: () => { rememberTargetPromptPreference(); setTargetPromptOpen(false); setTargetSelectionOpen(true); },
    startWithDefaultTargets: () => { rememberTargetPromptPreference(); void resolvePreparedEncounter(); },
    startWithTargets: (alvos: { actorId: string; targetId: string }[]) =>
      void resolvePreparedEncounter(alvos),
    openBattle: (record: GameRunBattleRecord) => setCombatScene({ record, origin: 'history' }),
    finishCombatReplay: async (speed: 1 | 2) => {
      if (!combatScene) return;
      if (!battleWinner(combatScene.record.battle)) return;
      markBattleSeen(runId, combatScene.record);
      if (combatScene.origin !== 'history' && currentRun) {
        try {
          // Confirm the persisted reward before closing the current battle scene.
          const latest = await getGameRun(currentRun.idGameRun);
          setRun(latest);
          if (latest.estadoAtual.loot?.roll === null &&
            latest.estadoAtual.loot.nodeId === combatScene.record.noId) {
            if (rewardReturnTimer.current) clearTimeout(rewardReturnTimer.current);
            rewardReturnTimer.current = setTimeout(() => {
              if (shouldAutoCloseCombat(combatScene.origin, speed))
                setCombatScene((scene) => scene?.record.noId === combatScene.record.noId ? null : scene);
              setLootSpeed(speed);
              rewardReturnTimer.current = null;
            }, 2000);
            return;
          }
        } catch (error: unknown) {
          setActionError(getApiErrorMessage(error,
            'Não foi possível confirmar a recompensa desta run. Tente novamente.'));
          return;
        }
      }
      if (shouldAutoCloseCombat(combatScene.origin, speed)) {
        const close = () => setCombatScene((scene) =>
          scene?.record.noId === combatScene.record.noId ? null : scene);
        if ((combatScene.record.battle.xpConcedido ?? 0) > 0)
          rewardReturnTimer.current = setTimeout(close,
            (combatScene.record.battle.niveisAlcancados?.length ?? 0) > 0 ? 2300 : 1700);
        else close();
      }
    },
    closeCombatReplay: () => {
      if (combatScene?.origin !== 'history' && currentRun?.estadoAtual.loot?.roll === null) {
        if (rewardReturnTimer.current) clearTimeout(rewardReturnTimer.current);
        setCombatScene(null);
        setLootSpeed(1);
        return;
      }
      if (rewardReturnTimer.current) clearTimeout(rewardReturnTimer.current);
      if (combatScene && battleWinner(combatScene.record.battle)) markBattleSeen(runId, combatScene.record);
      setCombatScene(null);
    },
    startEncounter,
    lootSpeed,
    updateRewardRun: setRun,
    openLoot: () => setLootSpeed(1),
    closeLoot: () => {
      if (combatScene && shouldAutoCloseCombat(combatScene.origin, lootSpeed ?? 1)) setCombatScene(null);
      setLootSpeed(null);
    },
    resumeEncounter,
    loading,
    abandoning,
    restarting,
    acting,
    savingWeapons,
    savingLoadout,
    consumingItemId,
    resting,
    mediumRestResult,
    mediumRest,
    abandonDialogOpen,
    setAbandonDialogOpen,
    error,
    actionError,
    baseResult,
    reload,
    abandon,
    restart,
    upgradeMap,
    saveWeaponOrder,
    saveLoadout,
    consumeItem,
    dropItem,
    equipDefense,
    configureCondition,
  };
};
