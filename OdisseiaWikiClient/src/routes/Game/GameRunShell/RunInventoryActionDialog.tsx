import CloseIcon from '@mui/icons-material/Close';
import type { PropsWithChildren } from 'react';
import { RunOverlayDialog } from './GameRunShell.style';
import type { RunInventoryEntry } from './runInventoryEntries';
import { ActionDialogBody, ActionDialogClose, ActionDialogFrame, ActionDialogHeader, ActionDialogMeta } from './RunInventoryActionDialog.style';

interface Props {
  entry: RunInventoryEntry;
  neon: boolean;
  onClose: () => void;
  aboveModal?: boolean;
}

export function RunInventoryActionDialog({ entry, neon, onClose, aboveModal = false, children }: PropsWithChildren<Props>) {
  return <RunOverlayDialog open onClose={onClose} maxWidth="xs" fullWidth
    aria-labelledby="run-inventory-action-title" sx={aboveModal ? { zIndex: 11000 } : undefined}
    onKeyDownCapture={aboveModal ? (event) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); }
    } : undefined}>
    <ActionDialogFrame neon={neon}>
      <ActionDialogHeader>
        <div>
          <h3 id="run-inventory-action-title">{entry.name}</h3>
          {(entry.weight !== null || entry.value !== null) && <ActionDialogMeta>
            {entry.weight !== null && <span>{entry.weight.toLocaleString('pt-BR')} kg</span>}
            {entry.value !== null && <span>Valor {entry.value.toLocaleString('pt-BR')}</span>}
          </ActionDialogMeta>}
        </div>
        <ActionDialogClose type="button" aria-label="Fechar opções" onClick={onClose}><CloseIcon /></ActionDialogClose>
      </ActionDialogHeader>
      <ActionDialogBody>{children}</ActionDialogBody>
    </ActionDialogFrame>
  </RunOverlayDialog>;
}
