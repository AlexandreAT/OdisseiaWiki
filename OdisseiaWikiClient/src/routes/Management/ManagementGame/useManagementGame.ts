import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GameAdventure, GameModeArea, GameModeEditor, GameModeEncounter, GameModeNpcOption, GameModePowerOption, GameModeRestOption, GameModeSystemVersion } from '../../../models/GameModeManagement';
import { saveAsset } from '../../../services/assetsService';
import {
  cloneGameModeDraft, createGameModeDraft, getGameModeEditor, getGameModeNpcs, getGameModeRestOptions, getGameModeSystemVersions,
  listGameAdventures, createGameAdventure, getGameAdventureEditor, createGameAdventureDraft,
  adaptGameAdventure,
  saveGameAdventureDraft, publishGameAdventureDraft, getGameAdventureSystemVersions,
} from '../../../services/gameModeManagementService';
import { getApiErrorMessage } from '../../../utils/apiError';

const copy = (editor: GameModeEditor): GameModeEditor => structuredClone(editor);
const editableSnapshot = (value: GameModeEditor | null) => value && JSON.stringify({
  areas: value.areas, encounters: value.encounters, fallbackAction: value.fallbackAction,
  playerDamageByResult: value.playerDamageByResult, saleDiscountPercent: value.saleDiscountPercent,
  startingCurrency: value.startingCurrency, repairProtectionAtBase: value.repairProtectionAtBase,
  protectedDepositSlots: value.protectedDepositSlots ?? 0, protectedDepositCost: value.protectedDepositCost ?? 0,
  powerCatalog: value.powerCatalog,
});
const nextEncounterNumber = (editor: GameModeEditor, after = 0) => {
  let number = Object.keys(editor.encounters).length + 1 + after;
  while (editor.encounters[`ENCONTRO_${number}`]) number++;
  return number;
};
const createEncounter = (editor: GameModeEditor, number: number): GameModeEncounter => ({
  mapName: `Encontro ${number}`,
  configured: false,
  xpReward: 0,
  currencyReward: 0,
  enemy: { name: `Inimigo ${number}`, image: null, npcId: null, variantId: null,
    attributes: {}, attackAttributeCode: null, maxVida: 100, defesa: 0,
    maxMana: 0, maxEstamina: 0, custoManaAtaque: 0, custoEstaminaAtaque: 0,
    quantity: 1, actions: [] },
  damageByResult: Object.fromEntries(editor.attackOutcomeCodes.map((code) =>
    [code, editor.encounters[Object.keys(editor.encounters)[0]]?.damageByResult[code] ?? 0])),
});

export const useManagementGame = (mesaId?: number) => {
  const [saved, setSaved] = useState<GameModeEditor | null>(null);
  const [editor, setEditor] = useState<GameModeEditor | null>(null);
  const [npcs, setNpcs] = useState<GameModeNpcOption[]>([]);
  const [restOptions, setRestOptions] = useState<GameModeRestOption[]>([]);
  const [systemVersions, setSystemVersions] = useState<GameModeSystemVersion[]>([]);
  const [selectedSystemVersion, setSelectedSystemVersion] = useState<number | null>(null);
  const [games, setGames] = useState<GameAdventure[]>([]);
  const [selectedGameCode, setSelectedGameCode] = useState<string | null>(null);
  const [newGameName, setNewGameName] = useState('');
  const [newGameDescription, setNewGameDescription] = useState('');
  const [newGameBanner, setNewGameBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const savedSnapshot = useMemo(() => editableSnapshot(saved), [saved]);
  const currentSnapshot = useMemo(() => editableSnapshot(editor), [editor]);
  const changed = savedSnapshot !== null && currentSnapshot !== null && savedSnapshot !== currentSnapshot;

  const load = useCallback(async (versionId?: number, gameCode?: string) => {
    setLoading(true); setError(null);
    try {
      const versions = mesaId ? await getGameAdventureSystemVersions(mesaId) : await getGameModeSystemVersions();
      setSystemVersions(versions);
      const selected = versionId ?? versions.find((item) => item.current)?.id ?? versions[0]?.id;
      setSelectedSystemVersion(selected ?? null);
      if (!selected) throw new Error('Nenhuma versão publicada ou arquivada do Sistema foi encontrada.');
      let catalog = await listGameAdventures(mesaId);
      if (!mesaId && catalog.length === 0) {
        await getGameModeEditor(selected);
        catalog = await listGameAdventures();
      }
      setGames(catalog);
      const currentCode = gameCode && catalog.some((item) => item.codigo === gameCode)
        ? gameCode : catalog[0]?.codigo ?? null;
      setSelectedGameCode(currentCode);
      let value: GameModeEditor | null = null;
      if (currentCode) {
        try {
          value = await getGameAdventureEditor(currentCode, mesaId, mesaId ? versionId : selected);
        } catch (reason) {
          const code = (reason as { response?: { data?: { codigo?: string } } })?.response?.data?.codigo;
          if (code !== 'MODO_INDISPONIVEL') throw reason;
        }
      }
      const effectiveVersion = mesaId ? value?.idSistemaVersao ?? selected : selected;
      setSelectedSystemVersion(effectiveVersion ?? null);
      const [candidates, rests] = await Promise.all([
        getGameModeNpcs(effectiveVersion, mesaId).catch(() => []),
        getGameModeRestOptions(effectiveVersion, mesaId).catch(() => []),
      ]);
      setNpcs(candidates);
      setRestOptions(rests);
      setSaved(value); setEditor(value ? copy(value) : null);
    } catch (reason) {
      setSaved(null); setEditor(null);
      setError(getApiErrorMessage(reason, 'Não foi possível carregar o jogo.'));
    } finally { setLoading(false); }
  }, [mesaId]);
  useEffect(() => { void load(); }, [load]);

  const run = async (action: () => Promise<GameModeEditor>, success: string) => {
    setBusy(true); setError(null); setNotice(null);
    try {
      const value = await action();
      setSaved(value); setEditor(copy(value)); setSelectedSystemVersion(value.idSistemaVersao);
      setSelectedGameCode(value.codigoJogo);
      setGames((current) => current.some((item) => item.codigo === value.codigoJogo) ?
        current.map((item) => item.codigo === value.codigoJogo ? {
          ...item, idSistemaVersao: value.idSistemaVersao,
          status: value.status, numeroVersao: value.numeroVersao,
        } : item) : [...current, { codigo: value.codigoJogo, idMesa: value.idMesa,
          idSistemaVersao: value.idSistemaVersao, nome: value.nomeJogo,
          descricao: value.descricaoJogo, banner: value.bannerJogo,
          status: value.status, numeroVersao: value.numeroVersao }]);
      setNotice(success);
      return true;
    } catch (reason) {
      setError(getApiErrorMessage(reason, 'Não foi possível salvar a configuração.'));
      return false;
    } finally { setBusy(false); }
  };

  const updateArea = (index: number, update: Partial<GameModeArea>) => {
    setEditor((current) => current && ({ ...current,
      areas: current.areas.map((area, areaIndex) => areaIndex === index ? { ...area, ...update } : area),
    }));
  };
  const moveArea = (index: number, phaseNumber: number) => {
    setEditor((current) => {
      if (!current || current.areas[index]?.isSecret || !Number.isInteger(phaseNumber)) return current;
      const normalAreas = current.areas.filter((area) => !area.isSecret);
      const targetIndex = phaseNumber - 1;
      if (targetIndex < 0 || targetIndex >= normalAreas.length) return current;
      const sourceIndex = normalAreas.indexOf(current.areas[index]);
      if (sourceIndex === targetIndex) return current;
      const [moved] = normalAreas.splice(sourceIndex, 1);
      normalAreas.splice(targetIndex, 0, moved);
      return { ...current, areas: [...normalAreas, ...current.areas.filter((area) => area.isSecret)] };
    });
  };
  const updateEncounter = (code: string, update: Partial<GameModeEncounter>) => {
    setEditor((current) => current && ({ ...current,
      encounters: { ...current.encounters,
        [code]: { ...current.encounters[code], ...update },
      },
    }));
  };
  const updateEnemy = (code: string, update: Partial<GameModeEncounter['enemy']>) => {
    setEditor((current) => current && ({ ...current,
      encounters: { ...current.encounters,
        [code]: { ...current.encounters[code],
          enemy: { ...current.encounters[code].enemy, ...update },
        },
      },
    }));
  };
  const selectNpc = (code: string, npc: GameModeNpcOption | null) => {
    updateEnemy(code, npc ? {
      npcId: npc.id, variantId: npc.variantId, name: npc.name, image: npc.image,
      maxVida: npc.vida, maxMana: npc.mana, maxEstamina: npc.estamina,
      defesa: npc.defesa, attackAttributeCode: null,
      custoManaAtaque: 0, custoEstaminaAtaque: 0,
      statusJson: null, inventarioJson: null, implantesJson: null,
      skillsJson: null, magiaJson: null,
      actions: npc.actions.filter((action) => action.executable)
        .slice(0, 1).map((action) => ({ tipo: action.tipo, idInstancia: action.idInstancia })),
    } : { npcId: null, variantId: null, actions: [], statusJson: null,
      inventarioJson: null, implantesJson: null, skillsJson: null, magiaJson: null });
  };
  const addEncounter = (npc?: GameModeNpcOption): string | null => {
    if (!editor || Object.keys(editor.encounters).length >= 80) return null;
    const number = nextEncounterNumber(editor);
    const code = `ENCONTRO_${number}`;
    setEditor((current) => {
      if (!current || current.encounters[code]) return current;
      const encounter = createEncounter(current, number);
      if (npc) {
        encounter.mapName = npc.name;
        encounter.enemy = { ...encounter.enemy,
          npcId: npc.id, variantId: npc.variantId, name: npc.name, image: npc.image,
          maxVida: npc.vida, maxMana: npc.mana, maxEstamina: npc.estamina,
          defesa: npc.defesa,
          actions: npc.actions.filter((action) => action.executable).slice(0, 1)
            .map((action) => ({ tipo: action.tipo, idInstancia: action.idInstancia })),
        };
      }
      return { ...current, encounters: { ...current.encounters, [code]: encounter } };
    });
    return code;
  };
  const uploadEnemyImage = async (code: string, file: File) => {
    setBusy(true); setError(null);
    try {
      const asset = await saveAsset({ imageFile: file, type: 'jogo', entityName: code, mesaId });
      updateEnemy(code, { image: asset.path });
    } catch (reason) {
      setError(getApiErrorMessage(reason, 'Não foi possível enviar a imagem do personagem.'));
    } finally { setBusy(false); }
  };
  const uploadAreaImage = async (index: number, file: File, target: 'area' | 'base' | number = 'area') => {
    if (!editor) return;
    setBusy(true); setError(null);
    try {
      const asset = await saveAsset({ imageFile: file, type: 'jogo', entityName: editor.areas[index].code, mesaId });
      if (target === 'base') updateArea(index, { baseImage: asset.path });
      else if (target === 'area') updateArea(index, { image: asset.path });
      else {
        const options = [...editor.areas[index].options];
        options[target] = { ...options[target], image: asset.path };
        updateArea(index, { options });
      }
    } catch (reason) {
      setError(getApiErrorMessage(reason, 'Não foi possível enviar a imagem da área.'));
    } finally { setBusy(false); }
  };
  const updatePower = (id: string, update: Partial<GameModePowerOption>) =>
    setEditor((current) => current && ({ ...current,
      powerCatalog: current.powerCatalog.map((power) => power.id === id ? { ...power, ...update } : power),
    }));
  const uploadPowerImage = async (id: string, file: File) => {
    setBusy(true); setError(null);
    try {
      const asset = await saveAsset({ imageFile: file, type: 'jogo', entityName: id, mesaId });
      updatePower(id, { image: asset.path });
    } catch (reason) {
      setError(getApiErrorMessage(reason, 'Não foi possível enviar a imagem do poder.'));
    } finally { setBusy(false); }
  };
  const removeRoute = (areaIndex: number, optionIndex: number) => {
    setEditor((current) => {
      if (!current || current.areas[areaIndex]?.options.length <= 1) return current;
      if (!current.areas[areaIndex].options[optionIndex]) return current;
      const areas = current.areas.map((area, index) => index === areaIndex
        ? { ...area, options: area.options.filter((_, routeIndex) => routeIndex !== optionIndex),
          finalOption: area.finalOption === `ROTA:${optionIndex}` ? 'ALEATORIO' :
            area.finalOption?.startsWith('ROTA:') && Number(area.finalOption.slice(5)) > optionIndex
              ? `ROTA:${Number(area.finalOption.slice(5)) - 1}` : area.finalOption }
        : area);
      return { ...current, areas };
    });
  };
  const removeEncounter = (code: string) => setEditor((current) => {
    if (!current || Object.keys(current.encounters).length <= 1 ||
      current.areas.some((area) => area.options.some((option) =>
        option.encounterCode === code || option.encounterCodes?.includes(code)))) return current;
    const encounters = { ...current.encounters };
    delete encounters[code];
    return { ...current, encounters };
  });

  return {
    editor, saved, npcs, restOptions, systemVersions, selectedSystemVersion, loading, busy, changed,
    games, selectedGameCode, newGameName, newGameDescription, newGameBanner,
    setNewGameName, setNewGameDescription, setNewGameBanner,
    selectGame: (code: string) => { if (!changed && !busy)
      void load(mesaId ? undefined : selectedSystemVersion ?? undefined, code); },
    uploadBanner: async (file: File) => {
      setBusy(true); setError(null);
      try {
        const asset = await saveAsset({ imageFile: file, type: 'jogo', entityName: 'banner', mesaId });
        setNewGameBanner(asset.path);
      } catch (reason) {
        setError(getApiErrorMessage(reason, 'Não foi possível enviar o banner.'));
      } finally { setBusy(false); }
    },
    createGame: () => run(() => createGameAdventure({ idMesa: mesaId,
      idSistemaVersao: mesaId
        ? systemVersions.find((version) => version.current)?.id
        : selectedSystemVersion ?? undefined, nome: newGameName,
      descricao: newGameDescription, banner: newGameBanner ?? '' }), 'Jogo criado como rascunho.'),
    error, notice, load,
    selectSystemVersion: (id: number) => { if (!changed && !busy)
      void load(id, selectedGameCode ?? undefined); },
    updateArea, moveArea, updateEncounter, updateEnemy, selectNpc, uploadAreaImage, uploadEnemyImage,
    updatePower, uploadPowerImage,
    addPower: (type: GameModePowerOption['type']) => setEditor((current) => current && current.powerCatalog.length < 40
      ? { ...current, powerCatalog: [...current.powerCatalog, {
        id: crypto.randomUUID(), type, name: '', description: null, image: null,
        minLevel: 1, requirements: null,
      }] } : current),
    removePower: (id: string) => setEditor((current) => current && ({ ...current,
      powerCatalog: current.powerCatalog.filter((power) => power.id !== id),
    })),
    addEncounter,
    removeRoute, removeEncounter,
    updatePlayerDamage: (code: string, update: Partial<GameModeEditor['playerDamageByResult'][string]>) =>
      setEditor((current) => current && ({ ...current,
        playerDamageByResult: { ...current.playerDamageByResult,
          [code]: { ...(current.playerDamageByResult[code] ?? { multiplier: 0, bonus: 0 }), ...update },
        },
      })),
    updateFallback: (update: Partial<GameModeEditor['fallbackAction']>) =>
      setEditor((current) => current && ({ ...current,
        fallbackAction: { ...current.fallbackAction, ...update },
      })),
    updateSaleDiscount: (value: number) =>
      setEditor((current) => current && ({ ...current,
        saleDiscountPercent: Math.max(0, Math.min(100, Math.trunc(value || 0))),
      })),
    updateStartingCurrency: (value: number) =>
      setEditor((current) => current && ({ ...current,
        startingCurrency: Math.max(0, Math.min(1_000_000_000, Math.trunc(value || 0))),
      })),
    updateRepairProtectionAtBase: (value: boolean) =>
      setEditor((current) => current && ({ ...current, repairProtectionAtBase: value })),
    updateProtectedDeposit: (field: 'protectedDepositSlots' | 'protectedDepositCost', value: number) =>
      setEditor(current => current && ({ ...current, [field]: Math.max(0, Math.min(
        field === 'protectedDepositSlots' ? 1000 : 1_000_000_000, Math.trunc(value || 0))) })),
    addRoute: (areaIndex: number) => setEditor((current) => {
      if (!current || current.areas[areaIndex]?.options.length >= 20) return current;
      return { ...current,
        areas: current.areas.map((entry, index) => index === areaIndex
          ? { ...entry, options: [...entry.options, {
            type: 'COMBATE' as const, encounterCode: '', weight: 1,
          }] } : entry),
      };
    }),
    addArea: () => setEditor((current) => {
      if (!current || current.areas.filter((area) => !area.isSecret).length >= 5) return current;
      let next = current.areas.length + 1;
      while (current.areas.some((area) => area.code === `FASE_${next}`)) next++;
      return { ...current,
        areas: [...current.areas.filter((area) => !area.isSecret), {
          code: `FASE_${next}`, name: `Área ${next}`, image: null, isSecret: false,
          useBase: true, baseName: 'Base', baseImage: null, baseRestType: restOptions.find((rest) => rest.executable)?.type ?? 'SIMPLES', nodeCount: 18,
          finalOption: 'ALEATORIO',
          options: [{ type: 'COMBATE' as const, encounterCode: '', weight: 1 }],
        }, ...current.areas.filter((area) => area.isSecret)] };
    }),
    addSecretArea: () => setEditor((current) => {
      if (!current || current.areas.filter((area) => area.isSecret).length >= 4) return current;
      let next = current.areas.filter((area) => area.isSecret).length + 1;
      while (current.areas.some((area) => area.code === `SEGREDO_${next}`)) next++;
      return { ...current, areas: [...current.areas, {
        code: `SEGREDO_${next}`, name: `Área secreta ${next}`, image: null, isSecret: true,
        isSecretFinal: false,
        useBase: true, baseName: 'Base', baseImage: null, baseRestType: restOptions.find((rest) => rest.executable)?.type ?? 'SIMPLES', nodeCount: 18, finalOption: 'ALEATORIO',
        options: [{ type: 'COMBATE' as const, encounterCode: '', weight: 1 }],
      }] };
    }),
    removeArea: (index: number) => setEditor((current) => {
      if (!current || (!current.areas[index]?.isSecret &&
        current.areas.filter((area) => !area.isSecret).length <= 1) ||
        current.areas.some((area) => area.options.some((option) =>
          option.secretAreaCode === current.areas[index]?.code))) return current;
      const areas = current.areas.filter((_, areaIndex) => areaIndex !== index);
      return { ...current, areas };
    }),
    createDraft: () => run(() => selectedGameCode ? createGameAdventureDraft(selectedGameCode, mesaId)
      : createGameModeDraft(selectedSystemVersion ?? undefined), 'Rascunho criado.'),
    adaptGame: () => selectedGameCode && run(async () => {
      const adapted = await adaptGameAdventure(selectedGameCode, mesaId);
      const [candidates, rests] = await Promise.all([
        getGameModeNpcs(adapted.idSistemaVersao, mesaId),
        getGameModeRestOptions(adapted.idSistemaVersao, mesaId),
      ]);
      setNpcs(candidates); setRestOptions(rests);
      return adapted;
    }, 'Jogo adaptado em um novo rascunho. Revise NPCs, loot e descansos antes de publicar.'),
    cloneDraft: (sourceVersionId: number) => selectedSystemVersion &&
      run(() => cloneGameModeDraft(sourceVersionId, selectedSystemVersion),
        'Jogo copiado para um novo rascunho. Revise os descansos, NPCs e ações antes de publicar.'),
    save: () => editor && run(() => saveGameAdventureDraft(editor.idGameModeVersion,
      { areas: editor.areas, encounters: editor.encounters,
        fallbackAction: editor.fallbackAction,
        playerDamageByResult: editor.playerDamageByResult,
        saleDiscountPercent: editor.saleDiscountPercent,
        startingCurrency: editor.startingCurrency,
        repairProtectionAtBase: editor.repairProtectionAtBase,
        protectedDepositSlots: editor.protectedDepositSlots ?? 0, protectedDepositCost: editor.protectedDepositCost ?? 0,
        powerCatalog: editor.powerCatalog }, mesaId), 'Rascunho salvo.'),
    publish: () => editor && run(async () => {
      if (changed) await saveGameAdventureDraft(editor.idGameModeVersion,
        { areas: editor.areas, encounters: editor.encounters,
          fallbackAction: editor.fallbackAction,
          playerDamageByResult: editor.playerDamageByResult,
          saleDiscountPercent: editor.saleDiscountPercent,
          startingCurrency: editor.startingCurrency,
          repairProtectionAtBase: editor.repairProtectionAtBase,
          protectedDepositSlots: editor.protectedDepositSlots ?? 0, protectedDepositCost: editor.protectedDepositCost ?? 0,
          powerCatalog: editor.powerCatalog }, mesaId);
      return publishGameAdventureDraft(editor.idGameModeVersion, mesaId);
    }, 'Nova versão publicada. Runs existentes continuam com sua versão anterior.'),
  };
};
