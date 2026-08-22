import type { PersonagemVisibilidade, TipoPersonagemVisibilidade } from '../../models/PersonagemVisibilidade';

export interface CharacterVisibilityModalProps {
  open: boolean;
  characterId: number | null | undefined;
  characterType: TipoPersonagemVisibilidade;
  characterName?: string;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  onClose: () => void;
  onSaved?: (visibilidade: PersonagemVisibilidade) => void;
}
