import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import CloseIcon from '@mui/icons-material/Close';
import { AnimatePresence } from 'framer-motion';
import { GiAbstract021, GiMagicSwirl, GiProcessor } from 'react-icons/gi';
import { MdAutoFixHigh, MdInventory2, MdOutlineBackpack } from 'react-icons/md';
import { Item } from '../../models/Itens';
import { Magia } from '../../models/Magias';
import { Skills } from '../../models/Skills';
import { normalizeImagePath } from '../../routes/Wiki/utils/imagePathHelper';
import characterBackgroundVideo from '../../assets/backgroundLinesScifiAnimation.mp4';
import {
  getInventarioItems,
  getProtesesItems,
  isEmptyItemRow,
  replaceItemSection,
} from '../../utils/itemInventorySections';
import { CharacterExplodedViewProps, ExplodedViewLayout, ExplodedViewTab } from './CharacterExplodedView.types';
import {
  getEntryKey,
  getExplodedMeta,
  getInventoryWeight,
  isFilledEntry,
  withExplodedMeta,
} from './characterExplodedView.utils';
import {
  Capacity,
  CharacterIdentity,
  CloseButton,
  Content,
  EquipmentColumn,
  EquipmentSearchItem,
  EquipmentSearchList,
  EquipmentSearchPanel,
  Header,
  InventoryArea,
  InventoryAreaBody,
  InventoryAreaHeader,
  ModalBackground,
  OrganizeButton,
  Overlay,
  Shell,
  ShellHudFrame,
  Summary,
  SummaryMetric,
  TabButton,
  Tabs,
} from './CharacterExplodedView.style';
import { FreeInventoryCanvas, FreeInventoryEntry } from './FreeInventoryCanvas';
import { OrganizedInventoryEntry, OrganizedInventoryGrid } from './OrganizedInventoryGrid';
import { EquipmentMannequin } from './EquipmentMannequin';
import { getEquipmentSlotLabel } from './equipmentSlots';

type ExplodedDomainEntry = Item | Skills | Magia;
type ExplodedViewEntry = FreeInventoryEntry & OrganizedInventoryEntry & {
  source: ExplodedDomainEntry;
};

const TAB_LABELS: Record<ExplodedViewTab, string> = {
  items: 'Itens',
  prostheses: 'Próteses',
  skills: 'Skills',
  spells: 'Magias',
};

const TAB_ICONS: Record<ExplodedViewTab, React.ReactNode> = {
  items: <MdInventory2 />,
  prostheses: <GiProcessor />,
  skills: <GiAbstract021 />,
  spells: <GiMagicSwirl />,
};

const TAB_THEME: Record<ExplodedViewTab, { color: string; clearColor: string }> = {
  items: { color: 'var(--neonBlue)', clearColor: 'var(--clearneonBlue)' },
  prostheses: { color: 'var(--neonPurple)', clearColor: 'var(--clearneonPurple)' },
  skills: { color: 'var(--neonCyan)', clearColor: 'var(--clearneonCyan)' },
  spells: { color: 'var(--neonPurple)', clearColor: 'var(--clearneonPurple)' },
};

export const CharacterExplodedView = ({
  open,
  initialTab = 'items',
  onClose,
  theme,
  neon,
  character,
  items,
  setItems,
  skills,
  setSkills,
  spells,
  setSpells,
  onOpenItem,
}: CharacterExplodedViewProps) => {
  const [tab, setTab] = useState<ExplodedViewTab>(initialTab);
  const [layout, setLayout] = useState<ExplodedViewLayout>('free');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const dialogRef = useRef<HTMLElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const transientEntryKeysRef = useRef(new WeakMap<object, string>());

  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    setSelectedSlot(null);
    setSearch('');
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => dialogRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
      )].filter((element) => !element.hidden && element.getClientRects().length > 0);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [initialTab, open]);

  const inventoryItems = useMemo(() => getInventarioItems(items).filter((item) => !isEmptyItemRow(item)), [items]);
  const prostheses = useMemo(() => getProtesesItems(items).filter((item) => !isEmptyItemRow(item)), [items]);
  const filledSkills = useMemo(() => skills.filter(isFilledEntry), [skills]);
  const filledSpells = useMemo(() => spells.filter(isFilledEntry), [spells]);
  const tabEntries: ExplodedDomainEntry[] = tab === 'items'
    ? inventoryItems
    : tab === 'prostheses'
      ? prostheses
      : tab === 'skills'
        ? filledSkills
        : filledSpells;
  const tabEntryKeys = useMemo(() => {
    const seenKeys = new Map<string, number>();
    return tabEntries.map((entry, index) => {
      let baseKey = getEntryKey(entry, index);
      if (!entry.id && !getExplodedMeta(entry).clientKey) {
        const objectEntry = entry as object;
        baseKey = transientEntryKeysRef.current.get(objectEntry) ?? crypto.randomUUID();
        transientEntryKeysRef.current.set(objectEntry, baseKey);
      }
      const occurrence = seenKeys.get(baseKey) ?? 0;
      seenKeys.set(baseKey, occurrence + 1);
      return `${tab}:${occurrence === 0 ? baseKey : `${baseKey}-${occurrence}`}`;
    });
  }, [tab, tabEntries]);
  const viewEntries = useMemo<ExplodedViewEntry[]>(() => {
    return tabEntries.map((entry, index) => {
    const image = 'imagem' in entry ? normalizeImagePath(entry.imagem) : '';
    return {
      id: tabEntryKeys[index],
      key: tabEntryKeys[index],
      name: entry.nome,
      image: image || undefined,
      eyebrow: entry.tipo,
      equipped: Boolean(getExplodedMeta(entry).equippedSlot),
      position: getExplodedMeta(entry).position,
      source: entry,
    };
  });
  }, [tabEntries, tabEntryKeys]);
  // A capacidade da ficha mede a mochila. Próteses instaladas têm sua própria
  // seção e não entram na mesma soma usada pela PersonagemPage.
  const weight = getInventoryWeight(inventoryItems);
  const capacity = Math.max(0, Number(character.loadCapacity) || 0);
  const percentage = capacity > 0 ? Math.min(100, (weight / capacity) * 100) : 0;

  const updateTabEntries = useCallback((updated: ExplodedDomainEntry[]) => {
    if (tab === 'items' || tab === 'prostheses') {
      setItems(replaceItemSection(
        items,
        tab === 'prostheses' ? 'proteses' : 'inventario',
        updated as Item[],
        true,
      ));
      return;
    }

    if (tab === 'skills') {
      const empty = skills.filter((entry) => !isFilledEntry(entry));
      setSkills([...(updated as Skills[]), ...empty]);
      return;
    }
    const empty = spells.filter((entry) => !isFilledEntry(entry));
    setSpells([...(updated as Magia[]), ...empty]);
  }, [items, setItems, setSkills, setSpells, skills, spells, tab]);

  const handlePositionsChange = useCallback((positions: Record<string, { x: number; y: number; rotation?: number }>) => {
    updateTabEntries(tabEntries.map((entry, index) => {
      const position = positions[tabEntryKeys[index]];
      if (!position) return entry;

      const existingMeta = getExplodedMeta(entry);
      const transientKey = tabEntryKeys[index].replace(`${tab}:`, '');
      return withExplodedMeta(entry, {
        position,
        clientKey: existingMeta.clientKey ?? transientKey,
      });
    }));
  }, [tab, tabEntries, tabEntryKeys, updateTabEntries]);

  const openEntry = useCallback((entry: ExplodedViewEntry) => {
    if (tab !== 'items' && tab !== 'prostheses') return;
    onOpenItem?.(entry.source as Item);
  }, [onOpenItem, tab]);

  const equippedBySlot = useMemo(() => new Map(
    items.flatMap((item) => {
      const slot = getExplodedMeta(item).equippedSlot;
      return slot ? [[slot, item] as const] : [];
    }),
  ), [items]);

  const equipCandidates = useMemo(() => {
    if (!selectedSlot) return [];
    const source = selectedSlot.startsWith('implant-') ? prostheses : inventoryItems;
    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');
    return source.filter((item) => (
      !normalizedSearch || item.nome.toLocaleLowerCase('pt-BR').includes(normalizedSearch)
    ));
  }, [inventoryItems, prostheses, search, selectedSlot]);

  const equipItem = (selected: Item) => {
    if (!selectedSlot) return;
    setItems(items.map((item) => {
      const isSelected = item === selected;
      const meta = getExplodedMeta(item);
      if (meta.equippedSlot === selectedSlot && !isSelected) {
        return withExplodedMeta(item, { equippedSlot: undefined });
      }
      return isSelected ? withExplodedMeta(item, { equippedSlot: selectedSlot }) : item;
    }));
  };

  const removeEquipped = () => {
    if (!selectedSlot) return;
    setItems(items.map((item) => getExplodedMeta(item).equippedSlot === selectedSlot
      ? withExplodedMeta(item, { equippedSlot: undefined })
      : item));
  };

  const supportsEquipment = tab === 'items' || tab === 'prostheses';
  const tabTheme = TAB_THEME[tab];
  const frameColor = neon === 'on' ? tabTheme.clearColor : tabTheme.color;
  // This full-page workspace must sit above the form's floating save actions,
  // while leaving the global header outside its interactive area.
  const root = document.body;

  return createPortal(
    <AnimatePresence>
      {open && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        >
          <Shell
            ref={dialogRef}
            tabIndex={-1}
            $theme={theme}
            $neon={neon}
            $accent={frameColor}
            $clearAccent={tabTheme.clearColor}
            initial={{ opacity: 0, scale: .94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: .96, y: 10 }}
            transition={{ type: 'spring', stiffness: 190, damping: 24 }}
            role="dialog"
            aria-modal="true"
            aria-label="Vista explodida do personagem"
          >
            <ModalBackground aria-hidden="true">
              <video src={characterBackgroundVideo} autoPlay loop muted playsInline />
            </ModalBackground>
            <ShellHudFrame neon={neon === 'on'} color={frameColor} aria-hidden="true" />
            <Header>
              <Tabs role="tablist" aria-label="Categorias da vista explodida">
                {(Object.keys(TAB_LABELS) as ExplodedViewTab[]).map((value) => (
                  <TabButton
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={tab === value}
                    $active={tab === value}
                    $color={neon === 'on' ? TAB_THEME[value].clearColor : TAB_THEME[value].color}
                    $clearColor={TAB_THEME[value].clearColor}
                    onClick={() => {
                      setTab(value);
                      setSelectedSlot(null);
                      setSearch('');
                    }}
                  >
                    {TAB_ICONS[value]}
                    {TAB_LABELS[value]}
                  </TabButton>
                ))}
              </Tabs>
              <OrganizeButton
                type="button"
                $active={layout === 'organized'}
                onClick={() => setLayout((current) => current === 'free' ? 'organized' : 'free')}
              >
                <MdAutoFixHigh /> {layout === 'free' ? 'Organizar inventário' : 'Voltar ao modo livre'}
              </OrganizeButton>
              <CloseButton type="button" onClick={onClose} aria-label="Fechar vista explodida"><CloseIcon /></CloseButton>
            </Header>

            <Content $simple={!supportsEquipment}>
              <Summary neon={neon === 'on'} color={frameColor}>
                <h2>Vista explodida</h2>
                <Capacity>
                  <strong>{weight.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} / {capacity || '—'} kg</strong>
                  <span>{Math.round(percentage)}%</span>
                  <div className="track"><div className="fill" style={{ width: `${percentage}%` }} /></div>
                </Capacity>
                <SummaryMetric>
                  <MdOutlineBackpack />
                  <div><span>Itens totais</span><strong>{inventoryItems.length + prostheses.length}</strong></div>
                </SummaryMetric>
                <CharacterIdentity>
                  {character.image ? <img src={normalizeImagePath(character.image)} alt={character.name} /> : <div className="placeholder" />}
                  <div>
                    <h3>{character.name || 'Novo personagem'}</h3>
                    <p>Raça: <b>{character.race || 'Não informada'}</b></p>
                    <p>Sistema: <b>{character.system || 'Não resolvido'}{character.version ? ` · v${character.version}` : ''}</b></p>
                    <p>Mesa: <b>{character.table || 'Não informada'}</b></p>
                  </div>
                </CharacterIdentity>
              </Summary>

              <InventoryArea neon={neon === 'on'} color={frameColor} aria-label={`${TAB_LABELS[tab]} do personagem`}>
                <InventoryAreaHeader>
                  <h2>Organização do inventário</h2>
                  <span>{layout === 'free' ? 'Mapa livre' : 'Grade organizada'}</span>
                </InventoryAreaHeader>
                <InventoryAreaBody>
                {layout === 'free' ? (
                  <FreeInventoryCanvas
                    entries={viewEntries}
                    theme={theme}
                    neon={neon}
                    accent={tabTheme.color}
                    clearAccent={tabTheme.clearColor}
                    emptyMessage="Nenhum registro preenchido nesta categoria."
                    onPositionsChange={handlePositionsChange}
                    onEntryClick={openEntry}
                  />
                ) : (
                  <OrganizedInventoryGrid
                    entries={viewEntries}
                    emptyMessage="Nenhum registro preenchido nesta categoria."
                    onReorder={(updated) => updateTabEntries(updated.map(({ source }) => source))}
                    onEntryClick={openEntry}
                  />
                )}
                </InventoryAreaBody>
              </InventoryArea>

              {supportsEquipment ? (
                <EquipmentColumn
                  neon={neon === 'on'}
                  color={frameColor}
                  data-search-open={Boolean(selectedSlot)}
                >
                  <EquipmentMannequin
                    mode={tab === 'prostheses' ? 'prostheses' : 'items'}
                    selectedSlot={selectedSlot}
                    equippedBySlot={equippedBySlot}
                    onSelectSlot={(slot) => {
                      setSelectedSlot(slot);
                      setSearch('');
                    }}
                  />
                  <AnimatePresence>
                    {selectedSlot && (
                      <EquipmentSearchPanel
                        initial={{ opacity: 0, x: 22 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 22 }}
                      >
                        <h3>Equipar — {getEquipmentSlotLabel(selectedSlot)}</h3>
                        <input
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Buscar na mochila..."
                          aria-label="Buscar item na mochila"
                        />
                        <EquipmentSearchList>
                          {equippedBySlot.has(selectedSlot) && (
                            <EquipmentSearchItem type="button" onClick={removeEquipped}>
                              <div className="placeholder" />
                              <div><strong>Remover equipamento</strong><small>Liberar este slot</small></div>
                            </EquipmentSearchItem>
                          )}
                          {equipCandidates.map((item, index) => (
                            <EquipmentSearchItem key={getEntryKey(item, index)} type="button" onClick={() => equipItem(item)}>
                              {item.imagem ? <img src={normalizeImagePath(item.imagem)} alt="" /> : <div className="placeholder" />}
                              <div><strong>{item.nome}</strong><small>{item.tipo}</small></div>
                              {getExplodedMeta(item).equippedSlot && <small>Equipado</small>}
                            </EquipmentSearchItem>
                          ))}
                        </EquipmentSearchList>
                      </EquipmentSearchPanel>
                    )}
                  </AnimatePresence>
                </EquipmentColumn>
              ) : null}
            </Content>
          </Shell>
        </Overlay>
      )}
    </AnimatePresence>,
    root,
  );
};
