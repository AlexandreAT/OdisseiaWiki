import { Item } from '../../models/Itens';
import { Magia } from '../../models/Magias';
import { Skills } from '../../models/Skills';

export type ExplodedViewTab = 'items' | 'prostheses' | 'skills' | 'spells';
export type ExplodedViewLayout = 'free' | 'organized';

export interface ExplodedCharacterSummary {
  name: string;
  image?: string;
  race?: string;
  system?: string;
  version?: string;
  table?: string;
  loadCapacity?: number;
}

export interface CharacterExplodedViewProps {
  open: boolean;
  initialTab?: ExplodedViewTab;
  onClose: () => void;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  character: ExplodedCharacterSummary;
  items: Item[];
  setItems: (items: Item[]) => void;
  skills: Skills[];
  setSkills: (skills: Skills[]) => void;
  spells: Magia[];
  setSpells: (spells: Magia[]) => void;
  onOpenItem?: (item: Item) => void;
  tableName?: string;
}
