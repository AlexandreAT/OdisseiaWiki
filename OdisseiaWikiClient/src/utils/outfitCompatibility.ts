import type { SistemaItemEscopoRuntime, SistemaItensConfig } from '../models/SistemaRpg';
import { normalizeSystemItemCode } from './systemItemFormCatalog';
import { normalizeTrajeTipo } from '../constants';

const code = (value: unknown) => {
  const normalized = normalizeSystemItemCode(value);
  return /^\d/.test(normalized) ? `C_${normalized}` : normalized;
};
export interface OutfitArchetype {
  scope: SistemaItemEscopoRuntime; path: string; location: number[]; category: string;
}

export function outfitArchetypes(types: SistemaItemEscopoRuntime[], includeInactive = false): OutfitArchetype[] {
  const scopeCode = (scope: SistemaItemEscopoRuntime) => code(scope.codigo) ||
    (includeInactive ? code(scope.codigoCaminho?.split('/').at(-1)) : '');
  return types.flatMap((type, ti) => scopeCode(type) !== 'TRAJE' || !includeInactive && !type.ativo ? []
    : type.filhos.flatMap((category, ci) => !includeInactive && !category.ativo ? []
      : category.filhos.flatMap((scope, ai) => !scopeCode(scope) || !includeInactive && !scope.ativo ? []
        : [{ scope, path: `TRAJE/${scopeCode(category)}/${scopeCode(scope)}`, location: [ti, ci, ai], category: scopeCode(category) }])));
}

const allows = (from: OutfitArchetype, to: OutfitArchetype) => from.scope.arquetiposCompativeis == null ||
  from.scope.arquetiposCompativeis.some(path => path.trim().toUpperCase() === to.path);

export const outfitCompatibilitySelection = (from: OutfitArchetype, all: OutfitArchetype[]) =>
  all.filter(to => allows(from, to) && allows(to, from)).map(to => to.path);

/** Keep path-based links stable while editing codes; deleted targets are removed. */
export function reconcileOutfitLinks(before: SistemaItemEscopoRuntime[], after: SistemaItemEscopoRuntime[], renamed = false) {
  // Keep a last valid path while a code input is temporarily empty during typing.
  const rememberPaths = (scopes: SistemaItemEscopoRuntime[], previous: SistemaItemEscopoRuntime[], parent = ''): SistemaItemEscopoRuntime[] =>
    scopes.map((scope, index) => {
      const segment = code(scope.codigo) || code(previous[index]?.codigoCaminho?.split('/').at(-1)) || code(previous[index]?.codigo);
      const path = parent ? `${parent}/${segment}` : segment;
      return { ...scope, codigoCaminho: path, filhos: rememberPaths(scope.filhos, previous[index]?.filhos ?? [], path) };
    });
  if (renamed) after = rememberPaths(after, before);
  const old = outfitArchetypes(before, true), next = outfitArchetypes(after, true);
  const valid = new Set(next.map(entry => entry.path));
  const renames = new Map(renamed ? old.flatMap(entry => {
    const replacement = next.find(candidate => candidate.location.join('.') === entry.location.join('.'));
    return replacement ? [[entry.path, replacement.path] as const] : [];
  }) : []);
  const walk = (scopes: SistemaItemEscopoRuntime[]): SistemaItemEscopoRuntime[] => scopes.map(scope => ({ ...scope,
    ...(scope.arquetiposCompativeis == null ? {} : { arquetiposCompativeis: [...new Set(scope.arquetiposCompativeis
      .map(path => renames.get(path) ?? path).filter(path => valid.has(path)))] }), filhos: walk(scope.filhos),
  }));
  return walk(after);
}

/** A pairing is one rule, not two independent settings: update both ends together. */
export function setOutfitCompatibility(types: SistemaItemEscopoRuntime[], location: number[], selected: string[]) {
  const all = outfitArchetypes(types, true), source = all.find(entry => entry.location.join('.') === location.join('.'));
  if (!source) return types;
  const chosen = new Set(selected.filter(path => all.some(entry => entry.path === path)));
  const patches = new Map<string, string[]>();
  for (const entry of all) {
    if (entry.path === source.path) { patches.set(entry.path, [...chosen]); continue; }
    const current = new Set(entry.scope.arquetiposCompativeis ?? all.map(candidate => candidate.path));
    if (chosen.has(entry.path)) current.add(source.path); else current.delete(source.path);
    patches.set(entry.path, [...current]);
  }
  const walk = (scopes: SistemaItemEscopoRuntime[], path: number[] = []): SistemaItemEscopoRuntime[] => scopes.map((scope, index) => {
    const at = [...path, index], entry = all.find(candidate => candidate.location.join('.') === at.join('.'));
    return { ...scope, ...(entry ? { arquetiposCompativeis: patches.get(entry.path) } : {}), filhos: walk(scope.filhos, at) };
  });
  return walk(types);
}

interface OutfitEntry {
  idInstancia: string; name: string; tipo: string; subtype: string; outfitArchetype?: string; outfitCategory?: string;
}

export function outfitCompatibilityError(candidate: OutfitEntry, entries: OutfitEntry[], equipped: string[], catalog: SistemaItensConfig): string | null {
  if (candidate.tipo !== 'ITEM' || candidate.subtype !== 'traje') return null;
  const all = outfitArchetypes(catalog.tipos);
  const configured = catalog.regrasTrajeConfiguradas || outfitArchetypes(catalog.tipos, true)
    .some(entry => entry.scope.arquetiposCompativeis != null);
  if (!configured) return null;
  const known = [...(catalog.arquetiposTrajeConhecidos ?? []),
    ...outfitArchetypes(catalog.tipos, true).map(entry => entry.path)];
  const resolve = (item: OutfitEntry) => {
    const find = (archetype: string) => all.filter(entry => code(entry.scope.codigo) === archetype &&
      (!code(item.outfitCategory) || entry.category === code(item.outfitCategory)));
    let matches = find(code(item.outfitArchetype));
    // An explicit custom code wins; aliases only bridge old inventory copies.
    if (!matches.length) {
      if (known.some(path => {
        const parts = path.split('/');
        return parts.length === 3 && code(parts[2]) === code(item.outfitArchetype) &&
          (!code(item.outfitCategory) || code(parts[1]) === code(item.outfitCategory));
      })) return null;
      const legacy = normalizeTrajeTipo(item.outfitArchetype);
      if (legacy) matches = find(code(legacy));
    }
    return matches.length === 1 ? matches[0] : null;
  };
  const from = resolve(candidate);
  if (!from) return `${candidate.name}: escolha uma subcategoria de traje válida nesta versão do Sistema.`;
  for (const item of entries.filter(entry => entry.tipo === 'ITEM' && entry.subtype === 'traje' &&
    entry.idInstancia !== candidate.idInstancia && equipped.includes(entry.idInstancia))) {
    const to = resolve(item);
    if (!to) return `${item.name}: escolha uma subcategoria de traje válida nesta versão do Sistema.`;
    if (!allows(from, to) || !allows(to, from)) return `${candidate.name} e ${item.name} não podem ser usados juntos neste Sistema.`;
  }
  return null;
}
