import { SearchResultItem } from "../../../../../services/infoLoreService";

export interface SearchFormErrors {
  termo?: string;
}

export interface GroupedResults {
  cidades: SearchResultItem[];
  personagens: SearchResultItem[];
  itens: SearchResultItem[];
  infoLores: SearchResultItem[];
  racas: SearchResultItem[];
}

export type EntityType = "Cidade" | "Personagem" | "Item" | "InfoLore" | "Raca";

export interface CardProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  item: SearchResultItem;
  onEdit?: (item: SearchResultItem) => void;
  onDelete?: (item: SearchResultItem) => void;
}
