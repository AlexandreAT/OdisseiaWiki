import React from 'react';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import SaveIcon from '@mui/icons-material/Save';
import {
  FloatingActions,
  FloatingSaveButton,
  SyncIconBadge,
} from '../../../../Hub/UserCharacters/CharacterEdit/CharacterEdit.style';

interface EntityEditFloatingActionsProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  synced: boolean;
  saving: boolean;
  onSave: () => void;
}

export const EntityEditFloatingActions: React.FC<EntityEditFloatingActionsProps> = ({
  theme,
  neon,
  synced,
  saving,
  onSave,
}) => (
  <FloatingActions>
    <SyncIconBadge
      theme={theme}
      neon={neon}
      synced={synced}
      title={synced ? 'Todas as alterações estão salvas' : 'Existem alterações não salvas'}
    >
      {synced ? <CloudDoneIcon className="icon" /> : <CloudOffIcon className="icon" />}
    </SyncIconBadge>
    <FloatingSaveButton
      type="button"
      theme={theme}
      neon={neon}
      onClick={onSave}
      title="Salvar alterações e continuar editando"
      aria-label="Salvar alterações e continuar editando"
      disabled={saving}
    >
      <SaveIcon className="icon" />
    </FloatingSaveButton>
  </FloatingActions>
);
