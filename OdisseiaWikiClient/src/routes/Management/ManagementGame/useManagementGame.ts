import { useCallback, useEffect, useState } from 'react';
import type { GameModeArea, GameModeEditor, GameModeEncounter, GameModeNpcOption, GameModeRestOption, GameModeSystemVersion } from '../../../models/GameModeManagement';
import { saveAsset } from '../../../services/assetsService';
import {
  cloneGameModeDraft, createGameModeDraft, getGameModeEditor, getGameModeNpcs, getGameModeRestOptions, getGameModeSystemVersions,
  publishGameModeDraft, saveGameModeDraft,
} from '../../../services/gameModeManagementService';
import { getApiErrorMessage } from '../../../utils/apiError';

const copy = (editor: GameModeEditor): GameModeEditor => structuredClone(editor);
const nextEncounterNumber = (editor: GameModeEditor, after = 0) => {
  let number = Object.keys(editor.encounters).length + 1 + after;
  while (editor.encounters[`ENCONTRO_${number}`]) number++;
  return number;
};
const createEncounter = (editor: GameModeEditor, number: number): GameModeEncounter => ({
  mapName: `Encontro ${number}`,
  configured: false,
  xpReward: 0,
  enemy: { name: `Inimigo ${number}`, image: null, npcId: null, variantId: null,
    attributes: {}, attackAttributeCode: null, maxVida: 100, defesa: 0,
    maxMana: 0, maxEstamina: 0, custoManaAtaque: 0, custoEstaminaAtaque: 0,
    quantity: 1, actions: [] },
  damageByResult: Object.fromEntries(editor.attackOutcomeCodes.map((code) =>
    [code, editor.encounters[Object.keys(editor.encounters)[0]]?.damageByResult[code] ?? 0])),
});

export const useManagementGame = () => {
  const [saved, setSaved] = useState<GameModeEditor | null>(null);
  const [editor, setEditor] = useState<GameModeEditor | null>(null);
  const [npcs, setNpcs] = useState<GameModeNpcOption[]>([]);
  const [restOptions, setRestOptions] = useState<GameModeRestOption[]>([]);
  const [systemVersions, setSystemVersions] = useState<GameModeSystemVersion[]>([]);
  const [selectedSystemVersion, setSelectedSystemVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const changed = !!saved && !!editor && JSON.stringify({ areas: saved.areas, encounters: saved.encounters,
    fallbackAction: saved.fallbackAction, playerDamageByResult: saved.playerDamageByResult,
    saleDiscountPercent: saved.saleDiscountPercent, repairProtectionAtBase: saved.repairProtectionAtBase }) !==
    JSON.stringify({ areas: editor.areas, encounters: editor.encounters,
      fallbackAction: editor.fallbackAction, playerDamageByResult: editor.playerDamageByResult,
      saleDiscountPercent: editor.saleDiscountPercent, repairProtectionAtBase: editor.repairProtectionAtBase });

  const load = useCallback(async (versionId?: number) => {
    setLoading(true); setError(null);
    try {
      const versions = await getGameModeSystemVersions();
      setSystemVersions(versions);
      const selected = versionId ?? versions.find((item) => item.current)?.id ?? versions[0]?.id;
      setSelectedSystemVersion(selected ?? null);
      if (!selected) throw new Error('Nenhuma versão publicada ou arquivada do Sistema foi encontrada.');
      const [value, candidates, rests] = await Promise.all([
        getGameModeEditor(selected), getGameModeNpcs(selected).catch(() => []),
        getGameModeRestOptions(selected).catch(() => []),
      ]);
      setNpcs(candidates);
      setRestOptions(rests);
      setSaved(value); setEditor(copy(value));
    } catch (reason) {
      setSaved(null); setEditor(null);
      setError(getApiErrorMessage(reason, 'Não foi possível carregar o jogo.'));
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const run = async (action: () => Promise<GameModeEditor>, success: string) => {
    setBusy(true); setError(null); setNotice(null);
    try {
      const value = await action();
      setSaved(value); setEditor(copy(value)); setSelectedSystemVersion(value.idSistemaVersao);
      setNotice(success);
    } catch (reason) {
      setError(getApiErrorMessage(reason, 'Não foi possível salvar a configuração.'));
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
      const asset = await saveAsset({ imageFile: file, type: 'jogo', entityName: code });
      updateEnemy(code, { image: asset.path });
    } catch (reason) {
      setError(getApiErrorMessage(reason, 'Não foi possível enviar a imagem do personagem.'));
    } finally { setBusy(false); }
  };
  const uploadAreaImage = async (index: number, file: File, target: 'area' | 'base' | number = 'area') => {
    if (!editor) return;
    setBusy(true); setError(null);
    try {
      const asset = await saveAsset({ imageFile: file, type: 'jogo', entityName: editor.areas[index].code });
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
    error, notice, load,
    selectSystemVersion: (id: number) => { if (!changed && !busy) void load(id); },
    updateArea, moveArea, updateEncounter, updateEnemy, selectNpc, uploadAreaImage, uploadEnemyImage,
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
    updateRepairProtectionAtBase: (value: boolean) =>
      setEditor((current) => current && ({ ...current, repairProtectionAtBase: value })),
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
    createDraft: () => run(() => createGameModeDraft(selectedSystemVersion ?? undefined), 'Rascunho criado.'),
    cloneDraft: (sourceVersionId: number) => selectedSystemVersion &&
      run(() => cloneGameModeDraft(sourceVersionId, selectedSystemVersion),
        'Jogo copiado para um novo rascunho. Revise os descansos, NPCs e ações antes de publicar.'),
    save: () => editor && run(() => saveGameModeDraft(editor.idGameModeVersion,
      { areas: editor.areas, encounters: editor.encounters,
        fallbackAction: editor.fallbackAction,
        playerDamageByResult: editor.playerDamageByResult,
        saleDiscountPercent: editor.saleDiscountPercent,
        repairProtectionAtBase: editor.repairProtectionAtBase }), 'Rascunho salvo.'),
    publish: () => editor && run(async () => {
      if (changed) await saveGameModeDraft(editor.idGameModeVersion,
        { areas: editor.areas, encounters: editor.encounters,
          fallbackAction: editor.fallbackAction,
          playerDamageByResult: editor.playerDamageByResult,
          saleDiscountPercent: editor.saleDiscountPercent,
          repairProtectionAtBase: editor.repairProtectionAtBase });
      return publishGameModeDraft(editor.idGameModeVersion);
    }, 'Nova versão publicada. Runs existentes continuam com sua versão anterior.'),
  };
};
