import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import MemoryOutlinedIcon from '@mui/icons-material/MemoryOutlined';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import styled from 'styled-components';
import { InventoryToggle } from './RunInventory.style';
import type { RunInventoryKind } from './runInventoryEntries';

const content = {
  ITEM: { title: 'Nenhum item na mochila', description: 'Os itens que você carregar nesta jornada aparecerão aqui.', Icon: Inventory2OutlinedIcon },
  PROTESE: { title: 'Nenhuma prótese no inventário', description: 'Próteses disponíveis para instalar aparecem aqui.', Icon: MemoryOutlinedIcon },
  MAGIA: { title: 'Nenhuma magia disponível', description: 'Magias da ficha ou aprendidas nesta jornada aparecem aqui.', Icon: AutoFixHighIcon },
  SKILL: { title: 'Nenhuma skill disponível', description: 'As skills disponíveis para este personagem aparecem aqui.', Icon: AutoAwesomeOutlinedIcon },
} as const;

export const InventoryEmptyState = styled.div`
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px 16px;
  text-align: center;
  border: 1px dashed color-mix(in srgb, var(--inventory-accent, var(--clearneonBlue)) 22%, transparent);
  background: radial-gradient(ellipse at center, color-mix(in srgb, var(--inventory-accent, var(--clearneonBlue)) 6%, transparent), transparent 75%);
  > svg { font-size: 2rem; color: var(--inventory-accent, var(--clearneonBlue)); opacity: .7;
    filter: drop-shadow(0 0 5px var(--inventory-glow, transparent)); }
  strong { font: 500 .82rem 'Orbitron', sans-serif; line-height: 1.5;
    color: var(--inventory-accent, var(--clearneonBlue)); overflow-wrap: anywhere; }
  p { margin: 0; max-width: 34ch; color: var(--lightGrey); font-size: .8rem; line-height: 1.6; }
  @media (max-width: 700px) { min-height: 140px; padding: 20px 12px; }
`;

export function RunInventoryEmptyState({ kind, filtered = false, onClearFilter }: {
  kind: RunInventoryKind; filtered?: boolean; onClearFilter: () => void;
}) {
  const { title, description, Icon } = content[kind];
  return <InventoryEmptyState data-run-inventory-grid role="status" aria-atomic="true">
    <Icon aria-hidden="true" />
    <strong>{filtered ? 'Nenhum resultado neste filtro' : title}</strong>
    <p>{filtered ? 'Tente outro tipo para ver o que há no inventário.' : description}</p>
    {filtered && <InventoryToggle type="button" onClick={onClearFilter}>Limpar filtro</InventoryToggle>}
  </InventoryEmptyState>;
}
