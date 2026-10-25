import catalogue from './systemHelp.pt-BR.json';
import type { FieldHelpContent } from '../components/Generic/FieldHelp/FieldHelp.types';
import type { SistemaModuloKey } from '../models/SistemaRpg';

interface Entry { title: string; text: string; aliases?: string[] }
interface Module { title: string; text: string; fields: Record<string, Entry>; sections: Record<string, Entry> }
const modules: Record<string, Module> = catalogue.modules;
const common: Record<string, Entry> = catalogue.common;
const normalize = (text: string) => text.trim().replace(/\s*\*$/, '').toLocaleLowerCase('pt-BR');

export const systemHelpCatalogue = catalogue;

// The catalogue is static. Build its exact-key/alias indexes once, not once per
// field on every keystroke. Stable entries also let contextual help skip renders.
const moduleIndexes = new Map(Object.entries(modules).map(([moduleKey, module]) => {
  const exact = new Map<string, FieldHelpContent>();
  const aliases = new Map<string, FieldHelpContent>();
  for (const [key, entry] of Object.entries({ ...module.sections, ...module.fields })) {
    const content = { id: `odisseia.${moduleKey}.${key}`, ...entry };
    exact.set(key, content);
    for (const alias of entry.aliases ?? []) {
      const normalized = normalize(alias);
      if (!aliases.has(normalized)) aliases.set(normalized, content);
    }
  }
  return [moduleKey, { exact, aliases, name: normalize(module.title),
    heading: { id: `odisseia.${moduleKey}`, title: module.title, text: module.text } }];
}));

const commonKeys = new Map<string, { order: number; content: FieldHelpContent }>();
const commonAliases = new Map<string, { order: number; content: FieldHelpContent }>();
Object.entries(common).forEach(([key, entry], order) => {
  const indexed = { order, content: { id: `odisseia.comum.${key}`, ...entry } };
  commonKeys.set(key, indexed);
  for (const alias of entry.aliases ?? []) {
    const normalized = normalize(alias);
    if (!commonAliases.has(normalized)) commonAliases.set(normalized, indexed);
  }
});

export const getSystemHelp = (moduleKey: SistemaModuloKey, target: string): FieldHelpContent | undefined => {
  const module = moduleIndexes.get(moduleKey);
  if (!module) return undefined;
  const normalized = normalize(target);
  if (target === '$module' || normalized === module.name) return module.heading;
  const exact = module.exact.get(target) ?? module.aliases.get(normalized);
  if (exact) return exact;
  const commonKey = target.split('.').slice(-1)[0] ?? target;
  const byKey = commonKeys.get(commonKey);
  const byAlias = commonAliases.get(normalized);
  return (!byAlias || byKey && byKey.order <= byAlias.order ? byKey : byAlias)?.content;
};
