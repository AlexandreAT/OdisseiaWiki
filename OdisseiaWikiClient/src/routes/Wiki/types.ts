import { Page } from '../../models/Pages';

export type WikiSearchEntityType = 'pages' | 'characters' | 'cities' | 'races' | 'items';

export interface WikiSearchItem {
  id: string;
  type: WikiSearchEntityType;
  title: string;
  description?: string;
  image?: string;
  createdAt?: string;
  route: string;
  searchTerms?: string[];
}

export type WikiSearchSortOption = 'name' | 'createdAt';

export type WikiSearchGroups = Record<WikiSearchEntityType, WikiSearchItem[]>;

export const WIKI_SEARCH_GROUP_ORDER: WikiSearchEntityType[] = [
  'pages',
  'characters',
  'cities',
  'races',
  'items',
];

export const WIKI_SEARCH_GROUP_LABELS: Record<WikiSearchEntityType, string> = {
  pages: 'Páginas',
  characters: 'Personagens',
  cities: 'Cidades',
  races: 'Raças',
  items: 'Itens',
};

export const createEmptyWikiSearchGroups = (): WikiSearchGroups => ({
  pages: [],
  characters: [],
  cities: [],
  races: [],
  items: [],
});

export interface WikiContextualBlock {
  id: string;
  targetId: string;
  title: string;
  type: string;
  blockIndex: number;
  level?: 1 | 2;
}

export interface WikiSidebarSection {
  title: string;
  icon?: React.ReactNode;
  blocks: WikiContextualBlock[];
  expanded?: boolean;
}

export interface WikiContentState {
  page: Page | null;
  loading: boolean;
  error: string | null;
}

export interface WikiSearchState {
  query: string;
  results: WikiSearchGroups;
  loading: boolean;
  error: string | null;
  warning: string | null;
}
