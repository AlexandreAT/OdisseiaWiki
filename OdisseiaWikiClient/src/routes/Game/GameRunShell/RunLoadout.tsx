import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useMemo, useState } from 'react';
import type { GameRunActionSelection, GameRunConsumeItemResult, GameRunDto, GameRunConditionOriginRequest } from '../../../models/GameRun';
import type { ConfiguracaoCombateSistema } from '../../../models/SistemaRpg';
import { obterConfiguracaoCombateSistemaRpg } from '../../../services/sistemasRpgService';
import { CyberButton } from '../../../components/Generic/HighlightButton/HighlightButton';
import { GameEyebrow, GameHint, GameNotice, GameSectionTitle } from '../GameShared.style';
import { RunOverlayDialog, RunPanel } from './GameRunShell.style';
import { InventoryClose, InventoryHeader, InventoryToggle } from './RunInventory.style';
import { BurstShotQuantity, EquippedGear, LoadoutActions, LoadoutAttackPreview, LoadoutBody, LoadoutCarry, LoadoutColumn, LoadoutDefenseNote, LoadoutDefensePanel, LoadoutDefenseStats, LoadoutEmpty, LoadoutGrid, LoadoutLimitNotice, LoadoutModalActions, LoadoutNote, LoadoutSectionTitle, LoadoutSlots, LoadoutTabs } from './RunLoadout.style';
import { RunInventoryCard } from './RunInventoryCard';
import { RunInventoryActionDialog } from './RunInventoryActionDialog';
import { RunConditionOriginEditor } from './RunConditionOriginEditor';
import { RunResourceBar } from './RunResourceBar/RunResourceBar';
import { RunConsumableAction } from './RunConsumableAction';
import { RunInventoryTypeFilter } from './RunInventoryTypeFilter';
import { describeConsumableResult, isUsableConsumable } from './runConsumableUtils';
import { maxRunAttackQuantity, parseRunInventoryEntries, runAdditionalAttackStaminaCost, runAttackStaminaCost, runConfiguredAttackLimit, runInventoryKey, runInventoryTabs, runSystemQuantityLimit, stackRunConsumables, type RunInventoryEntry, type RunInventoryKind } from './runInventoryEntries';

type Kind = RunInventoryKind;
type Entry = RunInventoryEntry;
interface Props {
  run: GameRunDto; theme: 'light' | 'dark'; neon: 'on' | 'off'; saving: boolean; busy: boolean;
  error?: string | null; onSave: (actions: GameRunActionSelection[]) => Promise<boolean>;
  onUseItem: (itemId: string, quantity?: number) => Promise<GameRunConsumeItemResult | null>;
  onDropItem: (itemId: string) => Promise<boolean>;
  onEquipDefense: (itemId: string, equipped: boolean) => Promise<boolean>;
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

export function RunLoadout({ run, theme, neon, saving, busy, error, onSave, onUseItem, onDropItem, onEquipDefense, onConfigureCondition, usingItemId, onClose }: Props) {
  const all = useMemo(() => stackRunConsumables([
    ...parseRunInventoryEntries(run.estadoAtual.inventario, 'ITEM'), ...parseRunInventoryEntries(run.estadoAtual.implantes, 'PROTESE'),
    ...parseRunInventoryEntries(run.estadoAtual.magia, 'MAGIA'), ...parseRunInventoryEntries(run.estadoAtual.skills, 'SKILL'),
  ]), [run.estadoAtual.inventario, run.estadoAtual.implantes, run.estadoAtual.magia, run.estadoAtual.skills]);
  const byKey = useMemo(() => new Map(all.map((entry) => [key(entry), entry])), [all]);
  const [tab, setTab] = useState<Kind>('ITEM');
  const [typeFilter, setTypeFilter] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [draftRange, setDraftRange] = useState<GameRunActionSelection['alcance']>(null);
  const [draftCount, setDraftCount] = useState(1);
  const [lastUse, setLastUse] = useState<string | null>(null);
  const [dropPending, setDropPending] = useState(false);
  const [actions, setActions] = useState<GameRunActionSelection[]>(run.acoesEquipadas ?? []);
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
  useEffect(() => { setActions(run.acoesEquipadas ?? []); }, [run.acoesEquipadas]);
  const canEdit = run.status === 'Ativa' && run.noAtualId === null && !saving && !busy;
  const canDrop = run.status === 'Ativa' && run.noAtualId === null && !busy && !saving;
  const changed = JSON.stringify(actions) !== JSON.stringify(run.acoesEquipadas ?? []);
  const tabItems = all.filter((entry) => entry.tipo === tab);
  const items = tabItems.filter((entry) => !typeFilter || entry.subtype === typeFilter);
  const active = selected ? byKey.get(selected) : undefined;
  const powerAction = active?.tipo === 'MAGIA' || active?.tipo === 'SKILL';
  const utilityConfiguration = Boolean(active && !active.hasDeclaredTest &&
    (active.tipo !== 'ITEM' || ['consumiveis', 'outro'].includes(active.subtype)) &&
    (Object.values(active.restore).some((value) => value > 0) || active.useConditions.length > 0));
  const attackConfiguration = powerAction || active?.tipo === 'PROTESE' ||
    (active?.tipo === 'ITEM' && (active.subtype === 'arma' ||
      (active.subtype === 'outro' && active.damageByRange.base > 0) ||
      active.hitConditions.length > 0)) || utilityConfiguration;
  const defensiveEquipment = active?.tipo === 'ITEM' && (active.subtype === 'traje' || active.subtype === 'outro') &&
    Object.values(active.defense).some((value) => value > 0);
  const systemQuantityLimit = active ? runSystemQuantityLimit(active, combatRules) : null;
  const itemQuantityLimit = active?.quantityLimits.filter((limit) => limit.source === 'Item')
    .sort((left, right) => left.max - right.max)[0];
  const configuredMax = active ? runConfiguredAttackLimit(active, combatRules) : 0;
  const currentStamina = Math.max(0, Number(run.estadoAtual.status?.status?.estamina) || 0);
  const maximumStamina = run.estadoAtual.status?.status?.estaminaMaxima;
  const maxAttacks = utilityConfiguration ? active?.quantity ? 1 : 0 : active ? maxRunAttackQuantity(active, currentStamina,
    combatRules?.estaminaPorAtaqueAdicional ?? 0, systemQuantityLimit?.max) : 0;
  // A mensagem de estamina não pode herdar os limites do item/Sistema.
  const staminaMax = active ? maxRunAttackQuantity({ ...active, maxAttacks: 100 }, currentStamina,
    combatRules?.estaminaPorAtaqueAdicional ?? 0) : 0;
  const effectiveCount = draftCount;
  const burstTens = active?.ranged && active.fireMode === 'RAJADA' && active.ammoPerUse % 10 === 0
    ? active.ammoPerUse / 10 : 0;
  const baseDamage = active ? active.damageByRange[
    draftRange === 'MEDIA' ? 'media' : draftRange === 'LONGA' ? 'longa' : active.ranged ? 'curta' : 'base'] : 0;
  const systemAdditionalStamina = combatRules?.estaminaPorAtaqueAdicional ?? 0;
  const staminaCost = active && combatRules
    ? runAttackStaminaCost(active, effectiveCount, systemAdditionalStamina) : null;
  const equipped = active && actions.some((entry) => key(entry) === selected);
  const attackCount = actions.filter((action) => action.tipo !== 'DESCANSO').length;
  const hasRest = actions.some((action) => action.tipo === 'DESCANSO');
  const equippedGear = all.filter((entry) =>
    entry.tipo === 'ITEM' && entry.defenseEquipped &&
      (entry.subtype === 'traje' || entry.subtype === 'outro') &&
      Object.values(entry.defense).some((value) => value > 0) ||
    entry.tipo === 'PROTESE' && actions.some((action) => key(action) === key(entry)));
  const choose = (entry: Entry) => {
    const saved = actions.find((action) => key(action) === key(entry));
    setTab(entry.tipo);
    setDraftRange(saved?.alcance ?? null);
    setDraftCount(saved?.quantidadeAtaques ?? 1);
    setSelected(key(entry));
    setDropPending(false);
  };
  const updateAction = (change: Partial<GameRunActionSelection>) => {
    if (equipped) setActions((current) => current.map((action) =>
      key(action) === selected ? { ...action, ...change } : action));
  };
  const updateCount = (count: number) => {
    const quantity = Math.min(maxAttacks, Math.max(1, Math.trunc(Number.isFinite(count) ? count : 1)));
    setDraftCount(quantity);
    updateAction({ quantidadeAtaques: quantity });
  };
  const status = run.estadoAtual.status?.status;
  const capacityValue = status?.capacidadeCarga;
  const parsedCapacity = capacityValue == null ? NaN : Number(capacityValue);
  const capacity = Number.isFinite(parsedCapacity) ? parsedCapacity : null;
  const weight = run.estadoAtual.carga?.pesoAtual ?? all
    .filter((entry) => entry.tipo === 'ITEM')
    .reduce((sum, entry) => sum + (entry.weight ?? 0), 0);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onDragEnd = ({ active: dragged, over }: DragEndEvent) => {
    if (!over || !canEdit || dragged.id === over.id) return;
    const from = actions.findIndex((entry) => key(entry) === dragged.id);
    const to = actions.findIndex((entry) => key(entry) === over.id);
    if (from >= 0 && to >= 0) setActions(arrayMove(actions, from, to));
  };
  const saveActions = () => {
    if (!combatRules) return;
    const invalid = actions.find((action) => {
      const entry = byKey.get(key(action));
      return entry && (action.quantidadeAtaques ?? 1) > runConfiguredAttackLimit(entry, combatRules);
    });
    if (invalid) {
      const entry = byKey.get(key(invalid))!;
      setTab(entry.tipo);
      choose(entry);
      return;
    }
    void onSave(actions);
  };

  return <RunOverlayDialog open onClose={changed || saving ? undefined : onClose}
    aria-labelledby="run-loadout-title" maxWidth="lg" fullWidth>
    <RunPanel neon={neon === 'on'}>
      <InventoryHeader><div><GameEyebrow>Equipamento da jornada</GameEyebrow>
        <GameSectionTitle id="run-loadout-title">Inventário da run</GameSectionTitle></div>
        <InventoryClose type="button" disabled={changed || saving} aria-label="Fechar inventário" onClick={onClose}><CloseIcon /></InventoryClose>
      </InventoryHeader>
      {error && <GameNotice $danger role="alert">{error}</GameNotice>}
      {!combatRules && !rulesError && <GameHint>Carregando regras de combate...</GameHint>}
      {rulesError && <GameNotice $danger role="alert">Não foi possível carregar as regras de combate desta versão do Sistema. Reabra o inventário para tentar novamente.</GameNotice>}
      {lastUse && <GameNotice role="status">{lastUse}</GameNotice>}
      <LoadoutBody>
        <LoadoutColumn aria-label="Itens disponíveis">
          <LoadoutTabs role="tablist" aria-label="Tipo de inventário">
            {runInventoryTabs.map(({ type, label }) => <button key={type} type="button" role="tab"
              aria-selected={tab === type} onClick={() => { setTab(type); setTypeFilter(''); setSelected(null); setDropPending(false); }}>{label}</button>)}
          </LoadoutTabs>
          <RunInventoryTypeFilter entries={tabItems} value={typeFilter}
            onChange={(next) => { setTypeFilter(next); setSelected(null); setDropPending(false); }} />
          <LoadoutGrid data-run-inventory-grid>{items.map((item) => <RunInventoryCard key={key(item)} entry={item}
            selected={selected === key(item)}
            equipped={item.defenseEquipped || actions.some((action) => key(action) === key(item))}
            neon={neon === 'on'} onSelect={() => { choose(item); setDropPending(false); }} />)}</LoadoutGrid>
          {items.length === 0 && <GameHint>Nenhuma opção nesta categoria.</GameHint>}
          {active && <RunInventoryActionDialog entry={active} neon={neon === 'on'} onClose={() => setSelected(null)}>
            {active.conditions.map((condition) => <RunConditionOriginEditor
              key={`${active.tipo}:${active.idInstancia}:${condition.index}`} entry={active}
              condition={condition} systemVersionId={run.idSistemaVersao} theme={theme} neon={neon}
              results={[...new Map((combatRules?.resultadosDado ?? []).map((row) =>
                [row.codigoResultado, { value: row.codigoResultado, label: row.nomeResultado || row.codigoResultado }])).values()]}
              disabled={!canEdit || changed} busy={usingItemId === active.idInstancia}
              onSave={async (origin) => {
                const ok = await onConfigureCondition(origin);
                if (ok) setSelected(null);
                return ok;
              }} />)}
            {defensiveEquipment && <LoadoutDefensePanel aria-label="Defesas do equipamento">
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
              {powerAction && !utilityConfiguration && <GameHint>Uma execução por ação. O combate exige teste e dano executáveis na versão publicada do Sistema.</GameHint>}
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
                ? `Tiros por turno (rajadas de ${active.ammoPerUse} · máx. ${maxAttacks * active.ammoPerUse})`
                : `${active.ranged ? 'Tiros' : 'Golpes'} por turno (máx. ${maxAttacks})`}
                {burstTens > 0 ? <BurstShotQuantity>
                  <input type="number" min={burstTens} step={burstTens}
                    max={Math.max(burstTens, maxAttacks * burstTens)} value={effectiveCount * burstTens}
                    aria-label="Dezenas de tiros por turno" disabled={!canEdit || maxAttacks < 1 || !combatRules}
                    onChange={(event) => updateCount(Number(event.target.value) / burstTens)} />
                  <span aria-hidden="true">0</span>
                </BurstShotQuantity> : <input type="number" min={1} max={Math.max(1, maxAttacks)} value={effectiveCount}
                  disabled={!canEdit || maxAttacks < 1 || !combatRules}
                  onChange={(event) => updateCount(Number(event.target.value))} />}
              </label>
              </>}
              {!utilityConfiguration && <LoadoutAttackPreview aria-live="polite">
                <span>Uma rolagem</span>
                <span>Dano base <strong>{baseDamage > 0 ? (baseDamage * effectiveCount).toLocaleString('pt-BR') : '—'}</strong></span>
                {active.ranged && <span>{active.fireMode === 'RAJADA' ? 'Rajadas' : 'Tiros'} <strong>{effectiveCount}</strong></span>}
                {active.ranged && active.controlsAmmo && <span>Munição <strong>{active.ammoPerUse * effectiveCount}</strong></span>}
                {!powerAction && <span>Estamina <strong>{staminaCost === null ? '—' : staminaCost.toLocaleString('pt-BR')}</strong></span>}
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
              <LoadoutLimitNotice $danger={draftCount > active.availableUses}
                role={draftCount > active.availableUses ? 'alert' : 'status'}>
                <strong>Item:</strong> restam {active.availableUses} {active.availableUses === 1 ? 'uso' : 'usos'} até o próximo descanso.
              </LoadoutLimitNotice>}
            {attackConfiguration && !utilityConfiguration && active && staminaMax < configuredMax && <LoadoutLimitNotice $danger={draftCount > staminaMax}
              role={draftCount > staminaMax ? 'alert' : 'status'}>
              <strong>Personagem:</strong> estamina atual {currentStamina}
              {typeof maximumStamina === 'number' && maximumStamina > 0
                ? `/${maximumStamina}` : ''}; o primeiro uso custa{' '}
              {runAttackStaminaCost(active, 1, systemAdditionalStamina)}. Isso permite até{' '}
              {staminaMax} {staminaMax === 1 ? 'uso' : 'usos'} nesta ação.
            </LoadoutLimitNotice>}
            {isUsableConsumable(active) && !dropPending && <RunConsumableAction key={active.idInstancia} entry={active} run={run} theme={theme} neon={neon}
              disabled={!canEdit || changed} using={usingItemId === active.idInstancia}
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
                  setActions(equipped
                    ? actions.filter((entry) => key(entry) !== selected)
                    : [...actions, { tipo: active.tipo, idInstancia: active.idInstancia,
                      alcance: draftRange, quantidadeAtaques: effectiveCount,
                      modoDisparo: null }]);
                  setSelected(null);
                }} />}
              {defensiveEquipment && <CyberButton theme={theme} neon={neon}
                colorType={active.defenseEquipped ? 'secondary' : 'primary'}
                width="calc(100% - 15px)" height="40px"
                text={active.defenseEquipped ? 'Retirar defesa' : 'Equipar defesa'}
                disabled={!canEdit || changed || usingItemId === active.idInstancia}
                loading={usingItemId === active.idInstancia}
                onClick={() => void onEquipDefense(active.idInstancia, !active.defenseEquipped).then((ok) => {
                  if (ok) setSelected(null);
                })} />}
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
                  remove={() => setActions(actions.filter((candidate) => key(candidate) !== key(action)))} />;
              })}</LoadoutSlots>
            </SortableContext>
          </DndContext>
          {!hasRest && <InventoryToggle type="button" disabled={!canEdit}
            onClick={() => setActions([...actions, { tipo: 'DESCANSO', idInstancia: 'descanso-simples', quantidadeAtaques: 1 }])}>
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
            {entry.tipo === 'PROTESE' && (entry.ranged || entry.maxAttacks > 1) &&
              <button type="button" disabled={!canEdit || changed} onClick={() => choose(entry)}
                aria-label={`Configurar ${entry.name}`} title={`Configurar ${entry.name}`}>
                <SettingsOutlinedIcon fontSize="small" /></button>}
            <button type="button" disabled={!canEdit || changed}
              onClick={() => {
                if (entry.tipo === 'ITEM') void onEquipDefense(entry.idInstancia, false);
                else void onSave(actions.filter((action) => key(action) !== key(entry)));
              }} aria-label={`Retirar ${entry.name}`} title={`Retirar ${entry.name}`}>
              <DeleteOutlineIcon fontSize="small" /></button>
          </li>)}</EquippedGear>
          {equippedGear.length === 0 && <LoadoutEmpty><strong>Nada equipado aqui.</strong> Trajes, próteses e outros itens de defesa aparecerão nesta lista.</LoadoutEmpty>}
        </LoadoutColumn>
      </LoadoutBody>
      {changed && <LoadoutActions><CyberButton theme={theme} neon={neon} colorType="secondary"
        width="140px" text="Desfazer" disabled={saving}
        onClick={() => setActions(run.acoesEquipadas ?? [])} />
        <CyberButton theme={theme} neon={neon} width="180px" text="Salvar ataques"
          loading={saving} disabled={!canEdit || !combatRules} onClick={saveActions} /></LoadoutActions>}
    </RunPanel>
  </RunOverlayDialog>;
}
