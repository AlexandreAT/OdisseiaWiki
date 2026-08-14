import { CharacterExplodedViewMeta, Item } from '../../models/Itens';

export const EXPLODED_META_KEY = '__vistaExplodida';

type WithAttributes = { id?: string; atributos?: object };

export const getExplodedMeta = (entry: WithAttributes): CharacterExplodedViewMeta => {
  const raw = (entry.atributos as Record<string, unknown> | undefined)?.[EXPLODED_META_KEY];
  return raw && typeof raw === 'object' ? raw : {};
};

export const withExplodedMeta = <T extends WithAttributes>(
  entry: T,
  patch: Partial<CharacterExplodedViewMeta>,
): T => ({
  ...entry,
  atributos: {
    ...((entry.atributos ?? {}) as object),
    [EXPLODED_META_KEY]: {
      ...getExplodedMeta(entry),
      ...(!entry.id && !getExplodedMeta(entry).clientKey
        ? { clientKey: crypto.randomUUID() }
        : {}),
      ...patch,
    },
  },
});

export const getEntryKey = (entry: { id?: string; nome?: string }, index: number) =>
  entry.id || getExplodedMeta(entry as WithAttributes).clientKey || `${entry.nome || 'registro'}-${index}`;

export const isFilledEntry = (entry: { nome?: string }) => Boolean(entry.nome?.trim());

export const getInventoryWeight = (items: Item[]) => items.reduce(
  (sum, item) => sum + (Number(item.peso) || 0) * Math.max(1, Number(item.quantidade) || 1),
  0,
);

export const seededPosition = (index: number) => ({
  x: 5 + ((index * 19) % 72),
  y: 8 + ((index * 23) % 68),
  rotation: ((index * 7) % 13) - 6,
});

export const isItemCompatibleWithSlot = (item: Item, slot: string) => {
  const attributes = (item.atributos ?? {}) as Record<string, unknown>;
  const normalizedSlot = slot.replace(/^implant-/, '');
  const normalizeValue = (value: unknown) => String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');

  if (item.tipo === 'implante') {
    if (!slot.startsWith('implant-')) return false;
    const bodyPart = normalizeValue(attributes.parteCorpo);
    const side = normalizeValue(attributes.lado);
    const sideCompatible = !side || side === 'ambos' || side === 'nao-se-aplica'
      || (normalizedSlot.includes('left') && side === 'esquerdo')
      || (normalizedSlot.includes('right') && side === 'direito')
      || normalizedSlot === 'head-top' || normalizedSlot.includes('torso');
    if (!sideCompatible) return false;
    if (!bodyPart || bodyPart === 'outro') return true;
    if (bodyPart === 'ocular') return normalizedSlot.includes('head');
    if (bodyPart === 'mao') return normalizedSlot.includes('hand');
    if (bodyPart === 'braco') return normalizedSlot.includes('shoulder') || normalizedSlot.includes('forearm');
    if (bodyPart === 'pe') return normalizedSlot.includes('foot');
    if (bodyPart === 'perna') return normalizedSlot.includes('thigh') || normalizedSlot.includes('lower-leg');
    if (bodyPart === 'corpo') return normalizedSlot.includes('torso');
    return true;
  }
  if (slot.startsWith('implant-')) return false;

  const declaredSlot = normalizeValue(attributes.slot);
  if (declaredSlot) {
    if (normalizedSlot.includes('head')) return /cabeca|ocular|rosto|head/.test(declaredSlot);
    if (normalizedSlot.includes('hand')) return /mao|hand/.test(declaredSlot);
    if (normalizedSlot.includes('foot')) return /pe|foot/.test(declaredSlot);
    if (normalizedSlot.includes('torso')) return /corpo|torso|peito/.test(declaredSlot);
    if (normalizedSlot.includes('shoulder')) return /ombro|shoulder|braco/.test(declaredSlot);
    if (normalizedSlot.includes('forearm')) return /antebraco|forearm|braco/.test(declaredSlot);
    if (normalizedSlot.includes('thigh')) return /coxa|thigh|perna/.test(declaredSlot);
    if (normalizedSlot.includes('lower-leg')) return /canela|perna|leg/.test(declaredSlot);
  }

  if (item.tipo === 'traje') return normalizedSlot.includes('torso') || normalizedSlot.includes('shoulder');
  if (item.tipo === 'acessorio') return normalizedSlot.includes('torso-extra');
  if (item.tipo === 'arma') return normalizedSlot.includes('hand') || normalizedSlot.includes('shoulder');
  return normalizedSlot.includes('torso-extra');
};
