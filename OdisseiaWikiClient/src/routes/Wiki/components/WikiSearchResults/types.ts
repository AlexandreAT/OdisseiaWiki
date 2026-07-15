import { WikiSearchGroups, WikiSearchItem } from '../../types';

export interface WikiSearchResultsProps {
  results: WikiSearchGroups;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  onResultSelect: (item: WikiSearchItem) => void;
}
