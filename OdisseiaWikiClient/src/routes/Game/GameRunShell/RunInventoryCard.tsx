import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { normalizeImagePath } from '../../Wiki/utils/imagePathHelper';
import { LoadoutCard, LoadoutCardCaption, LoadoutCardContent, LoadoutCardCorner, LoadoutCardMedia } from './RunLoadout.style';
import { runInventoryKey, type RunInventoryEntry } from './runInventoryEntries';
import { CheckBox } from '../../../components/Generic/CheckBox/CheckBox';
import { InventoryCardSelection, SelectableInventoryCard } from './RunInventoryCardSelection.style';

interface Props {
  entry: RunInventoryEntry;
  selected: boolean;
  equipped?: boolean;
  neon: boolean;
  onSelect: () => void;
  selection?: { checked: boolean; disabled?: boolean; label?: string; onChange: (checked: boolean) => void };
}

export function RunInventoryCard({ entry, selected, equipped = false, neon, onSelect, selection }: Props) {
  const image = normalizeImagePath(entry.image ?? undefined);
  const typeLabel = entry.tipo === 'ITEM'
    ? entry.subtype === 'consumiveis' ? 'Consumível' : entry.subtype === 'traje' ? 'Traje'
      : entry.subtype === 'outro' ? 'Outro' : 'Item'
    : entry.tipo === 'PROTESE' ? 'Prótese' : entry.tipo === 'MAGIA' ? 'Magia' : 'Skill';
  const card = <LoadoutCard type="button" $neon={neon} aria-pressed={selected}
    data-action-equipped={equipped ? 'true' : undefined}
    title={entry.name} onClick={onSelect} data-entry-id={runInventoryKey(entry)}>
    <LoadoutCardCorner $position="top-right" $neon={neon} aria-hidden="true" />
    <LoadoutCardCorner $position="bottom-left" $neon={neon} aria-hidden="true" />
    <LoadoutCardContent>
      <LoadoutCardMedia>
        {image ? <img src={image} alt="" loading="lazy" /> : <Inventory2OutlinedIcon aria-hidden="true" />}
      </LoadoutCardMedia>
      <LoadoutCardCaption>
        <strong>{entry.name}</strong>
        <small>{typeLabel}{entry.tipo === 'ITEM' ? ` · ${entry.quantity} un.` : ''}
          {entry.defenseEquipped ? ' · defesa equipada' : ''}</small>
      </LoadoutCardCaption>
    </LoadoutCardContent>
  </LoadoutCard>;
  return selection ? <SelectableInventoryCard>{card}
    <InventoryCardSelection>
      <CheckBox neon={neon ? 'on' : 'off'} label={selection.label ?? `Selecionar ${entry.name}`} title={selection.label ?? `Selecionar ${entry.name}`}
        checked={selection.checked} disabled={selection.disabled} onChange={selection.onChange} width="20px" height="20px" />
    </InventoryCardSelection>
  </SelectableInventoryCard> : card;
}
