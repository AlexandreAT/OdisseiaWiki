import { Page } from '../../models/Pages';

export interface WikiContextualBlock {
  id: string;
  title: string;
  type: string;
  blockIndex: number;
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
  results: Page[];
  loading: boolean;
  error: string | null;
}
