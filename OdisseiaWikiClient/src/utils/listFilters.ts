import type { SearchResultItem } from '../services/infoLoreService';

export type EntityFilter = SearchResultItem['tipoEntidade'] | 'Todos';
export type FlagFilter = 'all' | 'yes' | 'no';
export interface WikiListFilters {
  entity: EntityFilter;
  visibility: FlagFilter;
  featured: FlagFilter;
}
export type CharacterOrder = 'name' | 'date';
export type CharacterFilter = 'none' | 'race' | 'city' | 'mesa';
export interface CharacterListFilters {
  orderBy: CharacterOrder;
  filterBy: CharacterFilter;
  filterValue: string;
}

export const WIKI_LIST_FILTERS_KEY = 'odisseia.management.wiki.filters.v1';
export const DEFAULT_WIKI_FILTERS: WikiListFilters = { entity: 'Todos', visibility: 'all', featured: 'all' };
export const DEFAULT_CHARACTER_FILTERS: CharacterListFilters = { orderBy: 'name', filterBy: 'none', filterValue: '' };
const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object'
  ? value as Record<string, unknown> : {};
const flag = (value: unknown): FlagFilter => value === 'yes' || value === 'no' ? value : 'all';

export function normalizeWikiFilters(value: unknown): WikiListFilters {
  const saved = object(value);
  const entity = ['Todos', 'Cidade', 'Personagem', 'Item', 'InfoLore', 'Raca', 'Page'].includes(String(saved.entity))
    ? saved.entity as EntityFilter : 'Todos';
  return { entity, visibility: flag(saved.visibility), featured: flag(saved.featured) };
}

export function normalizeCharacterFilters(value: unknown): CharacterListFilters {
  const saved = object(value);
  const filterBy = ['race', 'city', 'mesa'].includes(String(saved.filterBy)) ? saved.filterBy as CharacterFilter : 'none';
  return {
    orderBy: saved.orderBy === 'date' ? 'date' : 'name',
    filterBy,
    filterValue: filterBy !== 'none' && /^\d+$/.test(String(saved.filterValue)) && Number(saved.filterValue) > 0
      ? String(saved.filterValue) : '',
  };
}

export const characterFiltersKey = (userId: number) => `odisseia.hub.characters.filters.v1:${userId}`;
export function filterWikiResults(items: SearchResultItem[], filters: WikiListFilters) {
  const matches = (value: boolean | undefined, choice: FlagFilter) => choice === 'all' || Boolean(value) === (choice === 'yes');
  return items.filter(item => (filters.entity === 'Todos' || item.tipoEntidade === filters.entity)
    && matches(item.visivel, filters.visibility) && matches(item.destaque, filters.featured));
}

const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
export function matchesCharacterSearch(character: { nome: string; racaNome?: string | null; cidadeNome?: string | null; mesaNome?: string | null }, query: string) {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  const text = normalizeSearch([character.nome, character.racaNome, character.cidadeNome, character.mesaNome].filter(Boolean).join(' '));
  return words.every(word => text.includes(word));
}

interface FilterableCharacter {
  nome: string;
  idraca?: number | string;
  idcidade?: number | string;
  idmesa?: number | string;
  dataCriacao?: string;
  racaNome?: string | null;
  cidadeNome?: string | null;
  mesaNome?: string | null;
}
export function filterCharacterResults<T extends FilterableCharacter>(characters: T[], filters: CharacterListFilters, query: string): T[] {
  const selectedId = Number(filters.filterValue);
  const filtered = characters.filter(character => {
    if (!matchesCharacterSearch(character, query)) return false;
    if (filters.filterBy === 'none' || !selectedId) return true;
    const id = filters.filterBy === 'race' ? character.idraca
      : filters.filterBy === 'city' ? character.idcidade : character.idmesa;
    return Number(id) === selectedId;
  });
  return filtered.sort((a, b) => filters.orderBy === 'date'
    ? (new Date(b.dataCriacao || 0).getTime() || 0) - (new Date(a.dataCriacao || 0).getTime() || 0)
    : a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
}
