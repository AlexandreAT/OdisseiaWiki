import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CloseIcon from '@mui/icons-material/Close';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useMemo, useState } from 'react';
import type { GameRunConsumeItemResult, GameRunDto, GameRunConditionOriginRequest } from '../../../models/GameRun';
import { CyberButton } from '../../../components/Generic/HighlightButton/HighlightButton';
import { obterConfiguracaoCombateSistemaRpg } from '../../../services/sistemasRpgService';
import { normalizeImagePath } from '../../Wiki/utils/imagePathHelper';
import { GameEyebrow, GameHint, GameNotice, GameSectionTitle } from '../GameShared.style';
import { RunFooterActions } from './GameRunShell.style';
import { InventoryThemeDialog, InventoryThemePanel } from './RunInventoryTheme.style';
import { inventoryThemeStyle } from '../../../utils/inventoryTheme';
import { RunInventoryCard } from './RunInventoryCard';
import { RunInventoryActionDialog } from './RunInventoryActionDialog';
import { RunConditionOriginEditor } from './RunConditionOriginEditor';
import { RunConsumableAction } from './RunConsumableAction';
import { RunInventoryTypeFilter } from './RunInventoryTypeFilter';
import { RunInventoryTabs } from './RunInventoryTabs';
import { RunInventoryEmptyState } from './RunInventoryEmptyState';
import { useRunOutfitCompatibility } from './useRunOutfitCompatibility';
import { describeConsumableResult, isUsableConsumable } from './runConsumableUtils';
import {
  InventoryContent, InventoryControls, InventoryGroup, InventoryHeader, InventoryImage,
  InventoryItem, InventoryItemInfo, InventoryList, InventorySaveActions, InventoryClose, OtherInventoryList,
} from './RunInventory.style';
import { LoadoutGrid, LoadoutItemActions } from './RunLoadout.style';
import { parseRunInventoryEntries, runInventoryKey, stackRunConsumables, type RunInventoryKind } from './runInventoryEntries';

interface StoredItem {
  id: string | null;
  name: string;
  type: string;
  image: string | null;
  quantity: number;
  weight: number | null;
}

interface Props {
  run: GameRunDto;
  theme: 'light' | 'dark';
  neon: 'on' | 'off';
  saving: boolean;
  busy: boolean;
  error?: string | null;
  onSave: (order: string[]) => Promise<boolean>;
  onUseItem: (itemId: string, quantity?: number) => Promise<GameRunConsumeItemResult | null>;
  onDropItem: (itemId: string) => Promise<boolean>;
  onEquipDefense: (itemId: string, equipped: boolean) => Promise<boolean>;
  onConfigureCondition: (origin: Omit<GameRunConditionOriginRequest, 'revisaoEsperada' | 'chaveIdempotencia'>) => Promise<boolean>;
  usingItemId: string | null;
  onClose: () => void;
}

const asObject = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;

const field = (value: Record<string, unknown>, key: string): unknown =>
  Object.entries(value).find(([name]) => name.toLowerCase() === key.toLowerCase())?.[1];

const parseItems = (inventory: unknown): StoredItem[] => {
  let entries: unknown = inventory;
  if (!Array.isArray(entries)) {
    const wrapper = asObject(inventory);
    entries = wrapper && ['itens', 'inventario', 'items']
      .map((key) => field(wrapper, key))
      .find((value) => Array.isArray(value) && value.length > 0);
  }
  if (!Array.isArray(entries)) return [];

  return entries.flatMap((entry: unknown, index: number) => {
    const item = asObject(entry);
    if (!item) return [];
    const rawId = field(item, 'id');
    const rawName = field(item, 'nome');
    const rawType = field(item, 'tipo');
    const rawImage = field(item, 'imagem');
    const rawQuantity = field(item, 'quantidade');
    const rawWeight = field(item, 'peso');
    return [{
      id: (typeof rawId === 'string' || typeof rawId === 'number') && String(rawId).trim()
        ? String(rawId) : null,
      name: typeof rawName === 'string' && rawName.trim() ? rawName : `Item ${index + 1}`,
      type: typeof rawType === 'string' ? rawType.toLowerCase() : 'outro',
      image: typeof rawImage === 'string' && rawImage ? rawImage : null,
      quantity: typeof rawQuantity === 'number' && Number.isFinite(rawQuantity) ? rawQuantity : 1,
      weight: typeof rawWeight === 'number' && Number.isFinite(rawWeight) ? rawWeight : null,
    }];
  });
};

const itemDetails = (item: StoredItem) =>
  `${item.type === 'arma' ? 'Arma' : item.type} · ${item.quantity} un.${item.weight === null ? '' : ` · ${item.weight} kg`}`;

const ItemImage = ({ item }: { item: StoredItem }) => {
  const image = normalizeImagePath(item.image ?? undefined);
  return <InventoryImage aria-hidden="true">{image ? <img src={image} alt="" /> : <Inventory2OutlinedIcon />}</InventoryImage>;
};

const SortableWeapon = ({ item, index, disabled }: {
  item: StoredItem;
  index: number;
  disabled: boolean;
}) => {
  const sortable = useSortable({ id: item.id!, disabled });
  return <InventoryItem ref={sortable.setNodeRef}
    style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }}>
    <strong>{index + 1}</strong>
    <ItemImage item={item} />
    <InventoryItemInfo><strong>{item.name}</strong><small>{itemDetails(item)}</small></InventoryItemInfo>
    <InventoryControls>
      <button type="button" disabled={disabled} ref={sortable.setActivatorNodeRef}
        {...sortable.attributes} {...sortable.listeners} aria-label={`Arrastar ${item.name} para reordenar`}
        title="Arrastar para reordenar"><DragIndicatorIcon /></button>
    </InventoryControls>
  </InventoryItem>;
};

export const RunInventory = ({ run, theme, neon, saving, busy, error, onSave, onUseItem, onDropItem, onEquipDefense, onConfigureCondition, usingItemId, onClose }: Props) => {
  const outfitRules = useRunOutfitCompatibility(run.idSistemaVersao);
  const [equipmentError, setEquipmentError] = useState<string | null>(null);
  const [conditionResults, setConditionResults] = useState<{ value: string; label: string }[]>([]);
  useEffect(() => {
    let active = true;
    void obterConfiguracaoCombateSistemaRpg(run.idSistemaVersao).then((rules) => {
      if (active) setConditionResults([...new Map(rules.resultadosDado.map((row) =>
        [row.codigoResultado, { value: row.codigoResultado, label: row.nomeResultado || row.codigoResultado }])).values()]);
    }).catch(() => { if (active) setConditionResults([]); });
    return () => { active = false; };
  }, [run.idSistemaVersao]);
  const items = useMemo(() => parseItems(run.estadoAtual.inventario), [run.estadoAtual.inventario]);
  const allEntries = useMemo(() => stackRunConsumables([
    ...parseRunInventoryEntries(run.estadoAtual.inventario, 'ITEM'),
    ...parseRunInventoryEntries(run.estadoAtual.implantes, 'PROTESE'),
    ...parseRunInventoryEntries(run.estadoAtual.magia, 'MAGIA'),
    ...parseRunInventoryEntries(run.estadoAtual.skills, 'SKILL'),
  ]), [run.estadoAtual.inventario, run.estadoAtual.implantes, run.estadoAtual.magia, run.estadoAtual.skills]);
  const [tab, setTab] = useState<RunInventoryKind>('ITEM');
  const [typeFilter, setTypeFilter] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [lastUse, setLastUse] = useState<string | null>(null);
  const [dropPending, setDropPending] = useState(false);
  const tabEntries = allEntries.filter((entry) => entry.tipo === tab);
  const visibleEntries = tabEntries.filter((entry) => !typeFilter || entry.subtype === typeFilter);
  const selectedEntry = allEntries.find((entry) => runInventoryKey(entry) === selected);
  const weapons = useMemo(() => items.filter((item) => item.type === 'arma' && item.id), [items]);
  const weaponIds = useMemo(() => weapons.map((item) => item.id!), [weapons]);
  const duplicateIds = new Set(weaponIds).size !== weaponIds.length;
  const [order, setOrder] = useState<string[]>(() => run.ordemArmas?.length ? run.ordemArmas : weaponIds);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    setOrder(run.ordemArmas?.length ? run.ordemArmas : weaponIds);
  }, [run.ordemArmas, weaponIds]);

  const weaponById = useMemo(() => new Map(weapons.map((item) => [item.id!, item])), [weapons]);
  const otherItems = items.filter((item) => !item.id);
  const canEdit = run.status === 'Ativa' && run.noAtualId === null && !busy && !saving && !duplicateIds;
  const canConsume = run.status === 'Ativa' && run.noAtualId === null && !busy && !saving;
  const canDrop = run.status === 'Ativa' && run.noAtualId === null && !busy && !saving;
  const changed = JSON.stringify(order) !== JSON.stringify(run.ordemArmas?.length ? run.ordemArmas : weaponIds);
  const move = (from: number, to: number) => setOrder((current) => arrayMove(current, from, to));
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || !canEdit) return;
    const from = order.indexOf(String(active.id));
    const to = order.indexOf(String(over.id));
    if (from >= 0 && to >= 0) move(from, to);
  };

  return <InventoryThemeDialog open onClose={changed || saving ? undefined : onClose} style={inventoryThemeStyle(tab, neon === 'on')}
    aria-labelledby="run-inventory-title" maxWidth="md" fullWidth>
    <InventoryThemePanel neon={neon === 'on'} color="var(--inventory-accent)">
    <InventoryHeader>
      <div><GameEyebrow>Equipamento da jornada</GameEyebrow>
        <GameSectionTitle id="run-inventory-title">Inventário da run</GameSectionTitle></div>
      <InventoryClose type="button" disabled={changed || saving}
        title={changed ? 'Salve ou desfaça a ordem antes de fechar' : undefined}
        aria-label="Fechar inventário" onClick={onClose}>
        <CloseIcon />
      </InventoryClose>
    </InventoryHeader>
    {error && <GameNotice $danger role="alert">{error}</GameNotice>}
    {lastUse && <GameNotice role="status">{lastUse}</GameNotice>}
    <InventoryContent>
      <InventoryGroup>
        <RunInventoryTabs value={tab} neon={neon === 'on'}
          onChange={type => { setTab(type); setTypeFilter(''); setSelected(null); }} />
        <RunInventoryTypeFilter entries={tabEntries} value={typeFilter}
          onChange={(next) => { setTypeFilter(next); setSelected(null); }} />
        {visibleEntries.length > 0 ? <LoadoutGrid>{visibleEntries.map((entry) => <RunInventoryCard key={runInventoryKey(entry)}
          entry={entry} selected={selected === runInventoryKey(entry)}
          equipped={entry.defenseEquipped || (entry.tipo === 'ITEM' && entry.subtype === 'arma' && order.includes(entry.idInstancia))}
          neon={neon === 'on'}
          onSelect={() => { setSelected(runInventoryKey(entry)); setDropPending(false); setEquipmentError(null); }} />)}</LoadoutGrid>
          : <RunInventoryEmptyState kind={tab} filtered={!!typeFilter && tabEntries.length > 0} onClearFilter={() => setTypeFilter('')} />}
        {selectedEntry && <RunInventoryActionDialog entry={selectedEntry} neon={neon === 'on'} onClose={() => setSelected(null)}>
          {equipmentError && <GameNotice $danger role="alert">{equipmentError}</GameNotice>}
          {outfitRules.failed && <CyberButton theme={theme} neon={neon} text="Recarregar regras dos trajes" onClick={outfitRules.retry} />}
          {selectedEntry.conditions.map((condition) => <RunConditionOriginEditor
            key={`${selectedEntry.tipo}:${selectedEntry.idInstancia}:${condition.index}`}
            entry={selectedEntry} condition={condition} systemVersionId={run.idSistemaVersao} theme={theme} neon={neon} results={conditionResults}
            disabled={!canEdit || changed} busy={usingItemId === selectedEntry.idInstancia}
            onSave={async (origin) => {
              const ok = await onConfigureCondition(origin);
              if (ok) setSelected(null);
              return ok;
            }} />)}
          <RunConsumableAction key={selectedEntry.idInstancia} entry={selectedEntry} run={run} theme={theme} neon={neon} disabled={!canConsume || changed}
            using={usingItemId === selectedEntry.idInstancia}
            onUse={(quantity) => void onUseItem(selectedEntry.idInstancia, quantity).then((result) => {
              if (result) { setLastUse(describeConsumableResult(result)); setSelected(null); }
            })}
            dropButton={selectedEntry.tipo === 'ITEM' && !dropPending ? <CyberButton theme={theme} neon={neon}
              colorType="secondary" width="calc(100% - 15px)" height="40px" text="Deixar item"
              disabled={!canDrop} onClick={() => setDropPending(true)} /> : undefined} />
          {(selectedEntry.tipo === 'PROTESE' || selectedEntry.tipo === 'ITEM' && (selectedEntry.subtype === 'traje' || selectedEntry.subtype === 'outro' &&
            Object.values(selectedEntry.defense).some((value) => value > 0))) &&
            <LoadoutItemActions><CyberButton theme={theme} neon={neon}
              colorType={selectedEntry.defenseEquipped ? 'secondary' : 'primary'}
              width="calc(100% - 15px)" height="40px"
              text={selectedEntry.tipo === 'PROTESE' ? selectedEntry.defenseEquipped ? 'Retirar prótese' : 'Instalar prótese'
                : selectedEntry.defenseEquipped ? 'Retirar defesa' : 'Equipar defesa'}
              disabled={!canConsume || changed || usingItemId === selectedEntry.idInstancia}
              loading={usingItemId === selectedEntry.idInstancia}
              onClick={() => {
                const conflict = selectedEntry.defenseEquipped ? null : outfitRules.check(selectedEntry, allEntries,
                  allEntries.filter(entry => entry.defenseEquipped).map(entry => entry.idInstancia));
                if (conflict) { setEquipmentError(conflict); return; }
                setEquipmentError(null);
                void onEquipDefense(selectedEntry.idInstancia, !selectedEntry.defenseEquipped).then(ok => { if (ok) setSelected(null); });
              }} /></LoadoutItemActions>}
          {selectedEntry.subtype === 'arma' && <GameHint>Esta run usa a ordem de armas abaixo para os ataques.</GameHint>}
          {selectedEntry.tipo === 'ITEM' && (dropPending ? <>
            <GameNotice $danger>Deixar {selectedEntry.name} remove esta cópia da run, inclusive do loadout. A ficha original não muda.</GameNotice>
            <LoadoutItemActions><CyberButton theme={theme} neon={neon} colorType="secondary" width="calc(100% - 15px)" text="Cancelar"
              onClick={() => setDropPending(false)} />
            <CyberButton theme={theme} neon={neon} width="calc(100% - 15px)" text="Confirmar descarte"
              disabled={!canDrop} loading={usingItemId === selectedEntry.idInstancia}
              onClick={() => void onDropItem(selectedEntry.idInstancia).then((ok) => {
                if (ok) { setLastUse(`${selectedEntry.name} deixado para trás.`); setSelected(null); setDropPending(false); }
              })} /></LoadoutItemActions>
          </> : !isUsableConsumable(selectedEntry) && <CyberButton theme={theme} neon={neon} colorType="secondary" text="Deixar item"
            disabled={!canDrop} onClick={() => setDropPending(true)} />)}
        </RunInventoryActionDialog>}
      </InventoryGroup>
      {tab === 'ITEM' && <>
      <InventoryGroup>
        <h3>Prioridade das armas</h3>
        <p>Arraste as armas pelo ícone para definir a ordem de uso.</p>
        {weapons.length > 7 && <GameHint>Esta versão do combate executa no máximo sete armas. As demais continuam no inventário; a ordem salva define quais têm prioridade.</GameHint>}
        {items.some((item) => item.type === 'arma' && !item.id) &&
          <GameHint>Armas sem identificador aparecem abaixo para consulta, mas não entram no combate automático desta run.</GameHint>}
        {duplicateIds && <GameHint>Há armas com o mesmo identificador nesta cópia. Corrija a ficha antes de iniciar outra run para poder ordená-las.</GameHint>}
        {duplicateIds ? <OtherInventoryList>{weapons.map((item, index) => <li key={`${item.id}-${index}`}>
          <ItemImage item={item} />
          <InventoryItemInfo><strong>{item.name}</strong><small>{itemDetails(item)}</small></InventoryItemInfo>
        </li>)}</OtherInventoryList> : order.length === 0 ? <GameHint>Nenhuma arma com identificador nesta run.</GameHint> :
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={order} strategy={verticalListSortingStrategy}>
              <InventoryList>{order.map((id, index) => {
                const item = weaponById.get(id);
                return item && <SortableWeapon key={id} item={item} index={index} disabled={!canEdit} />;
              })}</InventoryList>
            </SortableContext>
          </DndContext>}
        {changed && <RunFooterActions>
          <GameHint>A nova ordem só valerá para os próximos combates após ser salva.</GameHint>
          <InventorySaveActions>
            <CyberButton theme={theme} neon={neon} colorType="secondary" width="140px"
              text="Desfazer" disabled={saving}
              onClick={() => setOrder(run.ordemArmas?.length ? run.ordemArmas : weaponIds)} />
            <CyberButton theme={theme} neon={neon} width="180px" text="Salvar ordem"
              loading={saving} disabled={!canEdit} onClick={() => void onSave(order)} />
          </InventorySaveActions>
        </RunFooterActions>}
      </InventoryGroup>
      {otherItems.length > 0 && <InventoryGroup>
        <h3>Itens sem identificador</h3>
        <OtherInventoryList>{otherItems.map((item, index) => <li key={`${item.id ?? 'sem-id'}-${index}`}>
          <ItemImage item={item} />
          <InventoryItemInfo><strong>{item.name}</strong><small>{itemDetails(item)}</small></InventoryItemInfo>
        </li>)}</OtherInventoryList>
      </InventoryGroup>}
      </>}
    </InventoryContent>
    </InventoryThemePanel>
  </InventoryThemeDialog>;
};
