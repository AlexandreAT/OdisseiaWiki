import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameRunActionSelection, GameRunConsumeItemResult, GameRunDto, GameRunConditionOriginRequest } from '../../../models/GameRun';
import type { ConfiguracaoCombateSistema } from '../../../models/SistemaRpg';
import { obterConfiguracaoCombateSistemaRpg } from '../../../services/sistemasRpgService';
import { CyberButton } from '../../../components/Generic/HighlightButton/HighlightButton';
import { GameEyebrow, GameHint, GameNotice, GameSectionTitle } from '../GameShared.style';
import { InventoryThemeDialog, InventoryThemePanel } from './RunInventoryTheme.style';
import { inventoryThemeStyle } from '../../../utils/inventoryTheme';
import { InventoryClose, InventoryHeader, InventoryToggle } from './RunInventory.style';
import { EquippedGear, LoadoutAttackPreview, LoadoutBody, LoadoutCarry, LoadoutColumn, LoadoutDefenseNote, LoadoutDefensePanel, LoadoutDefenseStats, LoadoutEmpty, LoadoutGrid, LoadoutLimitNotice, LoadoutModalActions, LoadoutNote, LoadoutSectionTitle, LoadoutSlots } from './RunLoadout.style';
import { RunInventoryCard } from './RunInventoryCard';
import { RunInventoryActionDialog } from './RunInventoryActionDialog';
import { RunProsthesisBonuses } from './RunProsthesisBonuses';
import { RunConditionOriginEditor } from './RunConditionOriginEditor';
import { RunResourceBar } from './RunResourceBar/RunResourceBar';
import { RunConsumableAction } from './RunConsumableAction';
import { RunInventoryTypeFilter } from './RunInventoryTypeFilter';
import { RunInventoryTabs } from './RunInventoryTabs';
import { RunInventoryEmptyState } from './RunInventoryEmptyState';
import { useRunOutfitCompatibility } from './useRunOutfitCompatibility';
import { useRunInventoryAutoSave } from './useRunInventoryAutoSave';
import { describeConsumableResult, isUsableConsumable } from './runConsumableUtils';
import { maxRunAttackQuantity, parseRunInventoryEntries, runAdditionalAttackStaminaCost, runAttackStaminaCost, runConfiguredAttackLimit, runInventoryKey, runSystemQuantityLimit, stackRunConsumables, type RunInventoryEntry, type RunInventoryKind } from './runInventoryEntries';

type Kind = RunInventoryKind;
type Entry = RunInventoryEntry;
interface Props {
  run: GameRunDto; theme: 'light' | 'dark'; neon: 'on' | 'off'; saving: boolean; busy: boolean;
  error?: string | null; onSave: (actions: GameRunActionSelection[], defenseIds?: string[]) => Promise<boolean>;
  onUseItem: (itemId: string, quantity?: number) => Promise<GameRunConsumeItemResult | null>;
  onDropItem: (itemId: string) => Promise<boolean>;
  onConfigureCondition: (origin: Omit<GameRunConditionOriginRequest, 'revisaoEsperada' | 'chaveIdempotencia'>) => Promise<boolean>;
  usingItemId: string | null; onClose: () => void;
}
const key = runInventoryKey;

function SortableSlot({ entry, index, disabled, configure, remove }: {
  entry: Pick<GameRunActionSelection, 'tipo' | 'idInstancia'> & { name: string };
  index: number; disabled: boolean; configure?: () => void; remove: () => void;
}) {
  const sortable = useSortable({ id: key(entry), disabled });
  return <li ref={sortable.setNodeRef} style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }}>
    <strong>{index + 1}</strong><span>{entry.name}</span>
    {configure && <button type="button" disabled={disabled} onClick={configure}
      aria-label={`Configurar ${entry.name}`} title={`Configurar ${entry.name}`}>
      <SettingsOutlinedIcon fontSize="small" />
    </button>}
    <button type="button" disabled={disabled} onClick={remove} aria-label={`Remover ${entry.name}`}><DeleteOutlineIcon fontSize="small" /></button>
    <button type="button" data-drag="true" disabled={disabled} ref={sortable.setActivatorNodeRef}
      {...sortable.attributes} {...sortable.listeners} aria-label={`Arrastar ${entry.name}`}><DragIndicatorIcon fontSize="small" /></button>
  </li>;
}

export function RunLoadout({ run, theme, neon, saving, busy, error, onSave, onUseItem, onDropItem, onConfigureCondition, usingItemId, onClose }: Props) {
  const outfitRules = useRunOutfitCompatibility(run.idSistemaVersao);
  const [equipmentError, setEquipmentError] = useState<string | null>(null);
  const storedEntries = useMemo(() => stackRunConsumables([
    ...parseRunInventoryEntries(run.estadoAtual.inventario, 'ITEM'), ...parseRunInventoryEntries(run.estadoAtual.implantes, 'PROTESE'),
    ...parseRunInventoryEntries(run.estadoAtual.magia, 'MAGIA'), ...parseRunInventoryEntries(run.estadoAtual.skills, 'SKILL'),
  ]), [run.estadoAtual.inventario, run.estadoAtual.implantes, run.estadoAtual.magia, run.estadoAtual.skills]);
  const defenseIds = storedEntries.filter(entry => entry.defenseEquipped && (entry.tipo === 'PROTESE' ||
    entry.tipo === 'ITEM' && (entry.subtype === 'traje' || entry.subtype === 'outro' && Object.values(entry.defense).some(value => value > 0))))
    .map(entry => entry.idInstancia).sort();
  const all = storedEntries;
  const byKey = useMemo(() => new Map(all.map(entry => [key(entry), entry])), [all]);
  const [tab, setTab] = useState<Kind>('ITEM');
  const [typeFilter, setTypeFilter] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const selectedRef = useRef(selected);
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  const [draftRange, setDraftRange] = useState<GameRunActionSelection['alcance']>(null);
  const [draftCount, setDraftCount] = useState(1);
  const [lastUse, setLastUse] = useState<string | null>(null);
  const [dropPending, setDropPending] = useState(false);
  const actions = run.acoesEquipadas ?? [];
  const [combatRules, setCombatRules] = useState<ConfiguracaoCombateSistema | null>(null);
  const [rulesError, setRulesError] = useState(false);
  useEffect(() => {
    let active = true;
    setCombatRules(null);
    setRulesError(false);
    void obterConfiguracaoCombateSistemaRpg(run.idSistemaVersao).then((rules) => {
      if (active) setCombatRules(rules);
    }).catch(() => { if (active) setRulesError(true); });
    return () => { active = false; };
  }, [run.idSistemaVersao]);
  const available = run.status === 'Ativa' && run.noAtualId === null && !saving && !busy;
  const autoSave = useRunInventoryAutoSave(available, onSave);
  const canEdit = available && !autoSave.pending;
  const canDrop = canEdit;
  const tabItems = all.filter((entry) => entry.tipo === tab);
  const items = tabItems.filter((entry) => !typeFilter || entry.subtype === typeFilter);
  const active = selected ? byKey.get(selected) : undefined;
  const powerAction = active?.tipo === 'MAGIA' || active?.tipo === 'SKILL';
  const utilityConfiguration = Boolean(active && active.tipo !== 'PROTESE' && !active.hasDeclaredTest &&
    (active.tipo !== 'ITEM' || ['consumiveis', 'outro'].includes(active.subtype)) &&
    (Object.values(active.restore).some((value) => value > 0) || active.useConditions.length > 0));
  const attackConfiguration = powerAction || active?.tipo === 'PROTESE' && active.hasDeclaredTest ||
    (active?.tipo === 'ITEM' && (active.subtype === 'arma' ||
      (active.subtype === 'outro' && active.damageByRange.base > 0) ||
      active.hitConditions.length > 0)) || utilityConfiguration;
  const defensiveEquipment = active?.tipo === 'PROTESE' || active?.tipo === 'ITEM' &&
    (active.subtype === 'traje' || active.subtype === 'outro' && Object.values(active.defense).some((value) => value > 0));
  const systemQuantityLimit = active ? runSystemQuantityLimit(active, combatRules) : null;
  const itemQuantityLimit = active?.quantityLimits.filter((limit) => limit.source === 'Item')
    .sort((left, right) => left.max - right.max)[0];
  const configuredMax = active ? runConfiguredAttackLimit(active, combatRules) : 0;
  const currentStamina = Math.max(0, Number(run.estadoAtual.status?.status?.estamina) || 0);
  const maximumStamina = run.estadoAtual.status?.status?.estaminaMaxima;
  const manaMax = powerAction && (active?.manaPerUse ?? 0) > 0
    ? Math.floor((run.estadoAtual.status?.status?.mana ?? 0) / active!.manaPerUse!) : 100;
  const maxAttacks = utilityConfiguration ? active?.quantity ? 1 : 0 : active ? Math.min(manaMax, maxRunAttackQuantity(active, currentStamina,
    combatRules?.estaminaPorAtaqueAdicional ?? 0, systemQuantityLimit?.max)) : 0;
  // A mensagem de estamina não pode herdar os limites do item/Sistema.
  const staminaMax = active ? maxRunAttackQuantity({ ...active, maxAttacks: 100 }, currentStamina,
    combatRules?.estaminaPorAtaqueAdicional ?? 0) : 0;
  const effectiveCount = draftCount;
  const baseDamage = active?.areaDamage ?? (active ? active.damageByRange[
    draftRange === 'MEDIA' ? 'media' : draftRange === 'LONGA' ? 'longa' : active.ranged ? 'curta' : 'base'] : 0);
  const systemAdditionalStamina = combatRules?.estaminaPorAtaqueAdicional ?? 0;
  const staminaCost = active && combatRules
    ? runAttackStaminaCost(active, effectiveCount, systemAdditionalStamina) : null;
  const equipped = active && actions.some((entry) => key(entry) === selected);
  const attackCount = actions.filter((action) => action.tipo !== 'DESCANSO').length;
  const hasRest = actions.some((action) => action.tipo === 'DESCANSO');
  const equippedGear = all.filter((entry) =>
    entry.tipo === 'ITEM' && entry.defenseEquipped &&
      (entry.subtype === 'traje' || entry.subtype === 'outro' && Object.values(entry.defense).some((value) => value > 0)) ||
    entry.tipo === 'PROTESE' && (entry.defenseEquipped || actions.some((action) => key(action) === key(entry))));
  const choose = (entry: Entry) => {
    setEquipmentError(null);
    const saved = actions.find((action) => key(action) === key(entry));
    setTab(entry.tipo);
    setDraftRange(saved?.alcance ?? null);
    setDraftCount(saved?.quantidadeAtaques ?? 1);
    setSelected(key(entry));
    setDropPending(false);
  };
  const updateAction = (change: Partial<GameRunActionSelection>) => {
    if (!equipped) return;
    const saved = actions.find(action => key(action) === selected)!;
    if (Object.entries(change).every(([field, value]) => saved[field as keyof GameRunActionSelection] === value)) return;
    void autoSave.save(actions.map(action => key(action) === selected ? { ...action, ...change } : action), defenseIds)
      .then(ok => {
        if (!ok && selectedRef.current === key(saved)) {
          setDraftCount(saved.quantidadeAtaques ?? 1);
          setDraftRange(saved.alcance ?? null);
        }
      });
  };
  const updateCount = (count: number) => {
    const quantity = Math.min(maxAttacks, Math.max(1, Math.trunc(Number.isFinite(count) ? count : 1)));
    setDraftCount(quantity);
  };
  const status = run.estadoAtual.status?.status;
  const capacityValue = status?.capacidadeCarga;
  const parsedCapacity = capacityValue == null ? NaN : Number(capacityValue);
  const capacity = Number.isFinite(parsedCapacity) ? parsedCapacity : null;
  const weight = run.estadoAtual.carga?.pesoAtual ?? all
    .filter((entry) => entry.tipo === 'ITEM' || entry.tipo === 'PROTESE')
    .reduce((sum, entry) => sum + (entry.weight ?? 0), 0);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onDragEnd = ({ active: dragged, over }: DragEndEvent) => {
    if (!over || !canEdit || dragged.id === over.id) return;
    const from = actions.findIndex((entry) => key(entry) === dragged.id);
    const to = actions.findIndex((entry) => key(entry) === over.id);
    if (from >= 0 && to >= 0) void autoSave.save(arrayMove(actions, from, to), defenseIds);
  };

  return <InventoryThemeDialog open onClose={autoSave.pending || saving ? undefined : onClose} style={inventoryThemeStyle(tab, neon === 'on')}
    aria-labelledby="run-loadout-title" maxWidth="lg" fullWidth>
    <InventoryThemePanel neon={neon === 'on'} color="var(--inventory-accent)">
      <InventoryHeader><div><GameEyebrow>Equipamento da jornada</GameEyebrow>
        <GameSectionTitle id="run-loadout-title">Inventário da run</GameSectionTitle></div>
        <InventoryClose type="button" disabled={autoSave.pending || saving} aria-label="Fechar inventário" onClick={onClose}><CloseIcon /></InventoryClose>
      </InventoryHeader>
      {(error || autoSave.error) && <GameNotice $danger role="alert" style={{ whiteSpace: 'pre-line' }}>{error || autoSave.error}</GameNotice>}
      {autoSave.pending && <GameHint role="status">Atualizando inventário...</GameHint>}
      {!combatRules && !rulesError && <GameHint>Carregando regras de combate...</GameHint>}
      {rulesError && <GameNotice $danger role="alert">Não foi possível carregar as regras de combate desta versão do Sistema. Reabra o inventário para tentar novamente.</GameNotice>}
      {lastUse && <GameNotice role="status">{lastUse}</GameNotice>}
      <LoadoutBody>
        <LoadoutColumn aria-label="Itens disponíveis">
          <RunInventoryTabs value={tab} neon={neon === 'on'}
            onChange={type => { setTab(type); setTypeFilter(''); setSelected(null); setDropPending(false); }} />
          <RunInventoryTypeFilter entries={tabItems} value={typeFilter}
            onChange={(next) => { setTypeFilter(next); setSelected(null); setDropPending(false); }} />
          {items.length > 0 ? <LoadoutGrid data-run-inventory-grid>{items.map((item) => <RunInventoryCard key={key(item)} entry={item}
            selected={selected === key(item)}
            equipped={item.defenseEquipped || actions.some((action) => key(action) === key(item))}
            neon={neon === 'on'} onSelect={() => { choose(item); setDropPending(false); }} />)}</LoadoutGrid>
            : <RunInventoryEmptyState kind={tab} filtered={!!typeFilter && tabItems.length > 0} onClearFilter={() => setTypeFilter('')} />}
          {active && <RunInventoryActionDialog entry={active} neon={neon === 'on'} onClose={() => setSelected(null)}>
            {equipmentError && <GameNotice $danger role="alert">{equipmentError}</GameNotice>}
            {outfitRules.failed && <CyberButton theme={theme} neon={neon} text="Recarregar regras dos trajes" onClick={outfitRules.retry} />}
            <RunProsthesisBonuses entry={active} />
            {active.conditions.map((condition) => <RunConditionOriginEditor
              key={`${active.tipo}:${active.idInstancia}:${condition.index}`} entry={active}
              condition={condition} systemVersionId={run.idSistemaVersao} theme={theme} neon={neon}
              results={[...new Map((combatRules?.resultadosDado ?? []).map((row) =>
                [row.codigoResultado, { value: row.codigoResultado, label: row.nomeResultado || row.codigoResultado }])).values()]}
              disabled={!canEdit} busy={usingItemId === active.idInstancia}
              onSave={onConfigureCondition} />)}
            {defensiveEquipment && Object.values(active.defense).some(value => value > 0) && <LoadoutDefensePanel aria-label="Defesas do equipamento">
              <strong>Defesas do equipamento</strong>
              {active.defense.protecao > 0 && <RunResourceBar label="Proteção restante"
                value={active.defenseRemaining.protecao} max={active.defense.protecao} tone="protection" />}
              {(active.defense.armadura > 0 || active.defense.escudo > 0) && <LoadoutDefenseStats>
                {active.defense.armadura > 0 && <span>Armadura <b>{active.defense.armadura}</b></span>}
                {active.defense.escudo > 0 && <span>Escudo restante
                  <b>{active.defenseRemaining.escudo} / {active.defense.escudo}</b></span>}
              </LoadoutDefenseStats>}
              {active.defense.protecao > 0 &&
                <LoadoutDefenseNote>{run.configuracaoModo.repairProtectionAtBase !== false
                  ? 'Ao passar pela Base, a proteção deste item é reparada.'
                  : 'A Base não repara a proteção nesta versão do jogo.'}</LoadoutDefenseNote>}
            </LoadoutDefensePanel>}
            {attackConfiguration && <>
              {utilityConfiguration && <GameHint>Usa uma vez por ciclo, sem teste de acerto, e segue para a próxima ação. Consumíveis gastam uma unidade da mochila e só voltam a ser usados depois de percorrer as outras ações.</GameHint>}
              {powerAction && !utilityConfiguration && <>
                <GameHint>Usa o teste, dano e efeitos configurados nesta magia ou skill.</GameHint>
                {active.maxAttacks > 1 && <label>Ataques por turno (máx. {maxAttacks})
                  <input type="number" min={1} max={Math.max(1, maxAttacks)} value={effectiveCount}
                    disabled={!canEdit || maxAttacks < 1 || !combatRules}
                    onBlur={() => updateAction({ quantidadeAtaques: draftCount })}
                    onChange={event => updateCount(Number(event.target.value))} />
                </label>}
              </>}
              {!powerAction && !utilityConfiguration && <>
              <label>Alcance
                <select value={draftRange ?? ''} disabled={!canEdit} onChange={(event) => {
                  const alcance = event.target.value ? event.target.value as 'CURTA' | 'MEDIA' | 'LONGA' : null;
                  setDraftRange(alcance);
                  updateAction({ alcance });
                }}>
                  <option value="">Automático</option><option value="CURTA">Curta</option>
                  <option value="MEDIA">Média</option><option value="LONGA">Longa</option>
                </select>
              </label>
              <label>{active.ranged && active.fireMode === 'RAJADA'
                ? `Rajadas por turno (máx. ${maxAttacks})`
                : `${active.ranged ? 'Tiros' : 'Golpes'} por turno (máx. ${maxAttacks})`}
                <input type="number" min={1} max={Math.max(1, maxAttacks)} value={effectiveCount}
                  disabled={!canEdit || maxAttacks < 1 || !combatRules}
                  onBlur={() => updateAction({ quantidadeAtaques: draftCount })}
                  onChange={(event) => updateCount(Number(event.target.value))} />
              </label>
              {active.ranged && active.controlsAmmo && <GameHint>Cada {active.fireMode === 'RAJADA' ? 'rajada' : 'tiro'} gasta {active.ammoPerUse} de munição. A recarga não é bloqueada pelo limite de ataques.</GameHint>}
              </>}
              {!utilityConfiguration && <LoadoutAttackPreview aria-live="polite">
                <span>Uma rolagem</span>
                <span>{active.areaDamage ? 'Dano base por inimigo' : 'Dano base'} <strong>{baseDamage > 0 ? (baseDamage * effectiveCount).toLocaleString('pt-BR') : '—'}</strong></span>
                {active.ranged && <span>{active.fireMode === 'RAJADA' ? 'Rajadas' : 'Tiros'} <strong>{effectiveCount}</strong></span>}
                {active.ranged && active.controlsAmmo && <span>Munição <strong>{active.ammoPerUse * effectiveCount}</strong></span>}
                <span>Estamina <strong>{staminaCost === null ? '—' : staminaCost.toLocaleString('pt-BR')}</strong></span>
                {powerAction && <span>Mana <strong>{((active.manaPerUse ?? 0) * effectiveCount).toLocaleString('pt-BR')}</strong></span>}
              </LoadoutAttackPreview>}
              {utilityConfiguration && active && <LoadoutAttackPreview aria-live="polite">
                <span>Sem dado de acerto</span>
                {active.tipo === 'ITEM' && <span>Na mochila <strong>{active.quantity}</strong></span>}
                {Object.entries(active.restore).filter(([, value]) => value > 0).map(([resource, value]) =>
                  <span key={resource}>+{resource} <strong>{value.toLocaleString('pt-BR')}</strong></span>)}
                {active.useConditions.length > 0 && <span>Efeito <strong>{active.useConditions.join(', ')}</strong></span>}
              </LoadoutAttackPreview>}
              {!utilityConfiguration && active.ranged && combatRules && <GameHint>
                {runAdditionalAttackStaminaCost(active, systemAdditionalStamina) === 0
                  ? 'Esta versão do Sistema e este item não cobram estamina por disparo/rajada adicional.'
                  : `Cada ${active.fireMode === 'RAJADA' ? 'rajada' : 'tiro'} adicional custa ${runAdditionalAttackStaminaCost(active, systemAdditionalStamina)} de estamina (Sistema: ${systemAdditionalStamina}${active.staminaPerUse > systemAdditionalStamina ? `; Item: ${active.staminaPerUse}` : ''}).`}
              </GameHint>}
            </>}
            {attackConfiguration && !utilityConfiguration && itemQuantityLimit && <LoadoutLimitNotice $danger={draftCount > itemQuantityLimit.max}
              role={draftCount > itemQuantityLimit.max ? 'alert' : 'status'}>
              <strong>Item:</strong> {itemQuantityLimit.reason} permite até {itemQuantityLimit.max} {itemQuantityLimit.max === 1 ? 'uso' : 'usos'} por ação.
            </LoadoutLimitNotice>}
            {attackConfiguration && !utilityConfiguration && systemQuantityLimit && <LoadoutLimitNotice $danger={draftCount > systemQuantityLimit.max}
              role={draftCount > systemQuantityLimit.max ? 'alert' : 'status'}>
              <strong>Sistema:</strong> {systemQuantityLimit.reason} permite até {systemQuantityLimit.max} {systemQuantityLimit.max === 1 ? 'uso' : 'usos'} por ação.
            </LoadoutLimitNotice>}
            {attackConfiguration && !utilityConfiguration && active?.availableUses !== null && active?.availableUses !== undefined && active.availableUses < configuredMax &&
              <LoadoutLimitNotice $danger={false} role="status">
                <strong>Item:</strong> {active.availableUses === 0 ? 'arma em pausa' : `restam ${active.availableUses} ${active.availableUses === 1 ? 'uso' : 'usos'} até a pausa`}. Depois de percorrer as próximas ações, a arma volta a funcionar.
              </LoadoutLimitNotice>}
            {attackConfiguration && !utilityConfiguration && active && staminaMax < configuredMax && <LoadoutLimitNotice $danger={draftCount > staminaMax}
              role={draftCount > staminaMax ? 'alert' : 'status'}>
              <strong>Personagem:</strong> estamina atual {currentStamina}
              {typeof maximumStamina === 'number' && maximumStamina > 0
                ? `/${maximumStamina}` : ''}; o primeiro uso custa{' '}
              {runAttackStaminaCost(active, 1, systemAdditionalStamina)}. Isso permite até{' '}
              {staminaMax} {staminaMax === 1 ? 'uso' : 'usos'} nesta ação.
            </LoadoutLimitNotice>}
            {powerAction && !utilityConfiguration && manaMax < configuredMax && <LoadoutLimitNotice $danger={draftCount > manaMax}>
              <strong>Personagem:</strong> a mana atual permite até {manaMax} usos nesta ação.
            </LoadoutLimitNotice>}
            {isUsableConsumable(active) && !dropPending && <RunConsumableAction key={active.idInstancia} entry={active} run={run} theme={theme} neon={neon}
              disabled={!canEdit} using={usingItemId === active.idInstancia}
              onUse={(quantity) => void onUseItem(active.idInstancia, quantity).then((result) => {
                if (result) { setLastUse(describeConsumableResult(result)); setSelected(null); }
              })}
              dropButton={active.tipo === 'ITEM' && !defensiveEquipment && !attackConfiguration ? <CyberButton theme={theme} neon={neon}
                colorType="secondary" width="calc(100% - 15px)" height="40px" text="Deixar item"
                disabled={!canDrop} onClick={() => setDropPending(true)} /> : undefined} />}
            {!dropPending && (attackConfiguration || defensiveEquipment ||
              (active.tipo === 'ITEM' && !isUsableConsumable(active))) && <LoadoutModalActions>
              {attackConfiguration && <CyberButton theme={theme} neon={neon}
                colorType={equipped ? 'secondary' : 'primary'}
                width="calc(100% - 15px)" height="40px" text={equipped ? 'Desequipar' : 'Equipar'}
                disabled={!canEdit || (!equipped && (!combatRules || maxAttacks === 0 || attackCount >= 5))}
                onClick={() => {
                  const nextDefenseIds = active.tipo === 'PROTESE' ? equipped
                    ? defenseIds.filter(id => id !== active.idInstancia) : [...new Set([...defenseIds, active.idInstancia])]
                    : defenseIds;
                  void autoSave.save(equipped
                    ? actions.filter((entry) => key(entry) !== selected)
                    : [...actions, { tipo: active.tipo, idInstancia: active.idInstancia,
                      alcance: draftRange, quantidadeAtaques: effectiveCount,
                      modoDisparo: null }], nextDefenseIds).then(ok => {
                        if (ok) setSelected(current => current === key(active) ? null : current);
                      });
                }} />}
              {defensiveEquipment && !(active.tipo === 'PROTESE' && attackConfiguration) && <CyberButton theme={theme} neon={neon}
                colorType={active.defenseEquipped ? 'secondary' : 'primary'}
                width="calc(100% - 15px)" height="40px"
                text={active.tipo === 'PROTESE' ? active.defenseEquipped ? 'Retirar prótese' : 'Instalar prótese'
                  : active.defenseEquipped ? 'Retirar defesa' : 'Equipar defesa'}
                disabled={!canEdit}
                onClick={() => {
                  const conflict = active.defenseEquipped ? null : outfitRules.check(active, all, defenseIds);
                  if (conflict) { setEquipmentError(conflict); return; }
                  setEquipmentError(null);
                  void autoSave.save(actions, active.defenseEquipped ? defenseIds.filter(id => id !== active.idInstancia)
                    : [...defenseIds, active.idInstancia]).then(ok => {
                      if (ok) setSelected(current => current === key(active) ? null : current);
                    });
                }} />}
              {active.tipo === 'ITEM' && (!isUsableConsumable(active) || defensiveEquipment || attackConfiguration) &&
                <CyberButton theme={theme} neon={neon}
                colorType="secondary" width="calc(100% - 15px)" height="40px" text="Deixar item"
                disabled={!canDrop} onClick={() => setDropPending(true)} />}
            </LoadoutModalActions>}
            {active.tipo === 'ITEM' && dropPending && <>
              <GameNotice $danger>Deixar {active.name} remove esta cópia da run e do loadout. A ficha original não muda.</GameNotice>
              <LoadoutModalActions>
                <CyberButton theme={theme} neon={neon} colorType="secondary" width="calc(100% - 15px)" height="40px" text="Cancelar"
                  onClick={() => setDropPending(false)} />
                <CyberButton theme={theme} neon={neon} width="calc(100% - 15px)" height="40px" text="Confirmar descarte"
                  disabled={!canDrop} loading={usingItemId === active.idInstancia}
                  onClick={() => void onDropItem(active.idInstancia).then((ok) => {
                    if (ok) { setLastUse(`${active.name} deixado para trás.`); setSelected(null); setDropPending(false); }
                  })} />
              </LoadoutModalActions>
            </>}
          </RunInventoryActionDialog>}
        </LoadoutColumn>
        <LoadoutColumn aria-label="Ordem de ataque">
          <LoadoutSectionTitle>Ações equipadas <span>{attackCount}/5</span></LoadoutSectionTitle>
          <LoadoutNote>Arraste para escolher a prioridade. Ataques e utilitários seguem esta ordem no combate.</LoadoutNote>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={actions.map(key)} strategy={verticalListSortingStrategy}>
              <LoadoutSlots>{actions.map((action, index) => {
                const entry = action.tipo === 'DESCANSO'
                  ? { ...action, name: 'Descanso curto' }
                  : byKey.get(key(action));
                return entry && <SortableSlot key={key(action)} entry={entry} index={index}
                  disabled={!canEdit} configure={action.tipo === 'DESCANSO' ? undefined : () => {
                    const selectedEntry = byKey.get(key(action));
                    if (selectedEntry) choose(selectedEntry);
                  }}
                  remove={() => {
                    void autoSave.save(actions.filter((candidate) => key(candidate) !== key(action)),
                      action.tipo === 'PROTESE' ? defenseIds.filter(id => id !== action.idInstancia) : defenseIds);
                  }} />;
              })}</LoadoutSlots>
            </SortableContext>
          </DndContext>
          {!hasRest && <InventoryToggle type="button" disabled={!canEdit}
            onClick={() => void autoSave.save([...actions, { tipo: 'DESCANSO', idInstancia: 'descanso-simples', quantidadeAtaques: 1 }], defenseIds)}>
            Adicionar descanso
          </InventoryToggle>}
          {attackCount === 0 && <LoadoutEmpty><strong>Nenhum ataque equipado.</strong> Você usará o ataque de reserva no combate.</LoadoutEmpty>}
          <LoadoutCarry><span>Carga da mochila</span><strong>{weight.toLocaleString('pt-BR')} kg{capacity !== null ? ` / ${capacity.toLocaleString('pt-BR')} kg` : ''}</strong></LoadoutCarry>
          <LoadoutNote>O limite de skills e magias segue as regras do seu Sistema.</LoadoutNote>
          {run.estadoAtual.carga?.sobrecarregado && <GameNotice $danger>
            {run.estadoAtual.carga.penalidadePercentual > 0
              ? `Sobrepeso: estamina máxima reduzida em ${run.estadoAtual.carga.penalidadePercentual}% pela condição configurada no Sistema.`
              : 'Sobrepeso: este Sistema não configura redução de estamina para o excesso de carga.'}
            {' '}Deixe itens no inventário para remover o excesso.
          </GameNotice>}
        </LoadoutColumn>
        <LoadoutColumn aria-label="Equipamentos da run">
          <LoadoutSectionTitle>Itens equipados</LoadoutSectionTitle>
          <EquippedGear>{equippedGear.map((entry) => <li key={key(entry)}>
            <strong>{entry.tipo === 'PROTESE' ? 'Prót.' : entry.subtype === 'traje' ? 'Traje' : 'Outro'}</strong>
            <span>{entry.name}{entry.defenseEquipped && entry.defense.protecao > 0 &&
              <small> · Proteção {entry.defenseRemaining.protecao}/{entry.defense.protecao}</small>}</span>
            {(entry.defense.protecao > 0 || entry.tipo === 'PROTESE' && entry.hasDeclaredTest) &&
              <button type="button" disabled={!canEdit} onClick={() => choose(entry)}
                aria-label={`Configurar ${entry.name}`} title={`Configurar ${entry.name}`}>
                <SettingsOutlinedIcon fontSize="small" /></button>}
            <button type="button" disabled={!canEdit}
              onClick={() => {
                void autoSave.save(entry.tipo === 'PROTESE' ? actions.filter(action => key(action) !== key(entry)) : actions,
                  defenseIds.filter(id => id !== entry.idInstancia));
              }} aria-label={`Retirar ${entry.name}`} title={`Retirar ${entry.name}`}>
              <DeleteOutlineIcon fontSize="small" /></button>
          </li>)}</EquippedGear>
          {equippedGear.length === 0 && <LoadoutEmpty><strong>Nada equipado aqui.</strong> Trajes, próteses e outros itens de defesa aparecerão nesta lista.</LoadoutEmpty>}
        </LoadoutColumn>
      </LoadoutBody>
    </InventoryThemePanel>
  </InventoryThemeDialog>;
}
