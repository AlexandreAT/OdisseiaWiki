import { WikiSearchEntityType, WikiSearchGroups, WikiSearchItem } from '../../types';

export interface WikiHeaderProps {
  onSearch: (query: string) => void;
  getSuggestionGroups: (query: string) => WikiSearchGroups;
  onSuggestionSelect: (item: WikiSearchItem) => void;
  onGroupSelect: (group: WikiSearchEntityType) => void;
  suggestionsLoading?: boolean;
  suggestionsError?: string | null;
  suggestionsWarning?: string | null;
}
