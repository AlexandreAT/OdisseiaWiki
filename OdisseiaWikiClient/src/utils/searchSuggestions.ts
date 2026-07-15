const normalizeSearchText = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const isSubsequence = (value: string, query: string): boolean => {
  let queryIndex = 0;

  for (const character of value) {
    if (character === query[queryIndex]) queryIndex += 1;
    if (queryIndex === query.length) return true;
  }

  return false;
};

const getMatchPriority = (value: string, query: string): number => {
  if (!query) return 0;
  if (value === query) return 0;
  if (value.startsWith(query)) return 1;
  if (value.includes(query)) return 2;
  if (isSubsequence(value, query)) return 3;
  return Number.POSITIVE_INFINITY;
};

export const getRankedSuggestions = <T,>(
  items: readonly T[],
  query: string,
  maxResults = 5,
  getLabel: (item: T) => string = (item) => String(item),
): T[] => {
  if (maxResults <= 0) return [];

  const normalizedQuery = normalizeSearchText(query);

  return items
    .map((item, originalIndex) => {
      const label = getLabel(item);
      const normalizedLabel = normalizeSearchText(label);

      return {
        item,
        label,
        originalIndex,
        priority: getMatchPriority(normalizedLabel, normalizedQuery),
      };
    })
    .filter(({ priority }) => Number.isFinite(priority))
    .sort((first, second) => (
      first.priority - second.priority
      || first.label.localeCompare(second.label, 'pt-BR', { sensitivity: 'base' })
      || first.originalIndex - second.originalIndex
    ))
    .slice(0, maxResults)
    .map(({ item }) => item);
};

export const getSuggestionDisplayLabel = (suggestion: string): string => {
  const separatorIndex = suggestion.indexOf('|');
  return separatorIndex >= 0
    ? suggestion.slice(separatorIndex + 1)
    : suggestion;
};
