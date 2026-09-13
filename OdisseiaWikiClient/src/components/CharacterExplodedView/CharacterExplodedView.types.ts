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
  /** Catálogo usado para recuperar o peso de entradas antigas que só guardam o idItemBase. */
  itemCatalog?: Item[];
  setItems: (items: Item[]) => void;
  skills: Skills[];
  setSkills: (skills: Skills[]) => void;
  spells: Magia[];
  setSpells: (spells: Magia[]) => void;
  /** Limites efetivos do sistema para a ficha atual; zero ou ausente significa sem limite configurado. */
  skillLimit?: number | null;
  magicLimit?: number | null;
  onOpenItem?: (item: Item) => void;
  tableName?: string;
}
