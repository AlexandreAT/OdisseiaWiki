import type { RunInventoryEntry } from './runInventoryEntries';
import { InventoryTypeFilters } from './RunInventory.style';

interface Props {
  entries: RunInventoryEntry[];
  value: string;
  onChange: (value: string) => void;
}

const labels: Record<string, string> = {
  arma: 'Armas', consumiveis: 'Consumíveis', armadura: 'Armaduras',
  acessorio: 'Acessórios', ataque: 'Ataque', defesa: 'Defesa', suporte: 'Suporte',
};

export function RunInventoryTypeFilter({ entries, value, onChange }: Props) {
  const types = [...new Set(entries.map((entry) => entry.subtype).filter(Boolean))].sort();
  if (types.length === 0) return null;
  return <InventoryTypeFilters aria-label="Filtrar inventário por tipo">
    <button type="button" aria-pressed={!value} onClick={() => onChange('')}>Todos</button>
    {types.map((type) => <button key={type} type="button" aria-pressed={value === type}
      onClick={() => onChange(type)}>{labels[type] ?? `${type.charAt(0).toLocaleUpperCase('pt-BR')}${type.slice(1)}`}</button>)}
  </InventoryTypeFilters>;
}
