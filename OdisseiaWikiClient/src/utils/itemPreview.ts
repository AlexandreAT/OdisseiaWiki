import { Item, ItemTipo } from '../models/Itens';

const PREVIEW_PREFIX = 'odisseia:item-preview:';
const PREVIEW_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const VALID_ITEM_TYPES: ItemTipo[] = [
  'arma',
  'traje',
  'consumiveis',
  'acessorio',
  'implante',
  'outro',
];

interface StoredItemPreview {
  createdAt: number;
  item: Item;
}

const finiteNumber = (value: unknown, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

export const normalizeItemPreview = (item: Item, previewId?: string): Item => ({
  ...item,
  id: item.id ?? previewId,
  nome: item.nome?.trim() || 'Item sem nome',
  tipo: VALID_ITEM_TYPES.includes(item.tipo) ? item.tipo : 'outro',
  quantidade: finiteNumber(item.quantidade, 0),
  peso: finiteNumber(item.peso, 0),
  discricao: finiteNumber(item.discricao, 0),
  atributos: item.atributos && typeof item.atributos === 'object' ? item.atributos : {},
  tags: Array.isArray(item.tags) ? item.tags.filter((tag) => Boolean(tag?.trim())) : [],
  imagem: item.imagem?.trim() || undefined,
});

const removeExpiredPreviews = () => {
  const now = Date.now();

  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith(PREVIEW_PREFIX)) continue;

    try {
      const stored = JSON.parse(localStorage.getItem(key) ?? '') as Partial<StoredItemPreview>;
      if (!stored.createdAt || now - stored.createdAt > PREVIEW_MAX_AGE_MS) {
        localStorage.removeItem(key);
      }
    } catch {
      localStorage.removeItem(key);
    }
  }
};

export const openItemPreview = (item: Item) => {
  removeExpiredPreviews();

  const previewId = `preview_${crypto.randomUUID()}`;
  const storedPreview: StoredItemPreview = {
    createdAt: Date.now(),
    item: normalizeItemPreview(item, previewId),
  };
  localStorage.setItem(`${PREVIEW_PREFIX}${previewId}`, JSON.stringify(storedPreview));

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  const previewUrl = `${basePath}/item/${encodeURIComponent(previewId)}`;
  const previewLink = document.createElement('a');
  previewLink.href = previewUrl;
  previewLink.target = '_blank';
  previewLink.rel = 'noopener noreferrer';
  previewLink.click();
};

export const loadItemPreview = (previewId: string): Item | null => {
  if (!previewId.startsWith('preview_')) return null;

  try {
    const rawPreview = localStorage.getItem(`${PREVIEW_PREFIX}${previewId}`);
    if (!rawPreview) return null;

    const stored = JSON.parse(rawPreview) as Partial<StoredItemPreview>;
    if (!stored.item || !stored.createdAt || Date.now() - stored.createdAt > PREVIEW_MAX_AGE_MS) {
      localStorage.removeItem(`${PREVIEW_PREFIX}${previewId}`);
      return null;
    }

    return normalizeItemPreview(stored.item, previewId);
  } catch {
    localStorage.removeItem(`${PREVIEW_PREFIX}${previewId}`);
    return null;
  }
};
