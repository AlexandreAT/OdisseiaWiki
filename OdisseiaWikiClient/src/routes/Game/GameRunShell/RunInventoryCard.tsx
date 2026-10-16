import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { normalizeImagePath } from '../../Wiki/utils/imagePathHelper';
import { LoadoutCard, LoadoutCardCaption, LoadoutCardCorner, LoadoutCardMedia } from './RunLoadout.style';
import { runInventoryKey, type RunInventoryEntry } from './runInventoryEntries';

interface Props {
  entry: RunInventoryEntry;
  selected: boolean;
  equipped?: boolean;
  neon: boolean;
  onSelect: () => void;
}

export function RunInventoryCard({ entry, selected, equipped = false, neon, onSelect }: Props) {
  const image = normalizeImagePath(entry.image ?? undefined);
  const typeLabel = entry.tipo === 'ITEM'
    ? entry.subtype === 'consumiveis' ? 'Consumível' : entry.subtype === 'traje' ? 'Traje'
      : entry.subtype === 'outro' ? 'Outro' : 'Item'
    : entry.tipo === 'PROTESE' ? 'Prótese' : entry.tipo === 'MAGIA' ? 'Magia' : 'Skill';
  return <LoadoutCard type="button" $neon={neon} aria-pressed={selected}
    data-action-equipped={equipped ? 'true' : undefined}
    title={entry.name} onClick={onSelect} data-entry-id={runInventoryKey(entry)}>
    <LoadoutCardCorner $position="top-right" $neon={neon} aria-hidden="true" />
    <LoadoutCardCorner $position="bottom-left" $neon={neon} aria-hidden="true" />
    <LoadoutCardMedia>
      {image ? <img src={image} alt="" loading="lazy" /> : <Inventory2OutlinedIcon aria-hidden="true" />}
    </LoadoutCardMedia>
    <LoadoutCardCaption>
      <strong>{entry.name}</strong>
      <small>{typeLabel}{entry.tipo === 'ITEM' ? ` · ${entry.quantity} un.` : ''}
        {entry.defenseEquipped ? ' · defesa equipada' : ''}</small>
    </LoadoutCardCaption>
  </LoadoutCard>;
}
