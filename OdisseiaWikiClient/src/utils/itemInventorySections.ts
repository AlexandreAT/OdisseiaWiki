import { Item } from '../models/Itens';

export const isImplante = (item: Item) => item.tipo === 'implante';
export const getInventarioItems = (itens: Item[]) => itens.filter((item) => !isImplante(item));
export const getProtesesItems = (itens: Item[]) => itens.filter(isImplante);

const hasMeaningfulValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.some(hasMeaningfulValue);
  if (typeof value === 'object') return Object.values(value).some(hasMeaningfulValue);
  return true;
};

export const isEmptyItemRow = (item: Item): boolean => (
  !item.idItemBase
  && !item.nome?.trim()
  && !hasMeaningfulValue(item.descricao)
  && !hasMeaningfulValue(item.efeito)
  && !hasMeaningfulValue(item.imagem)
  && !hasMeaningfulValue(item.atributos)
  && !hasMeaningfulValue(item.tags)
  && !hasMeaningfulValue(item.peso)
  && !hasMeaningfulValue(item.discricao)
);

export const addOrReplaceEmptyItem = (items: Item[], selectedItem: Item): Item[] => {
  const nextItem: Item = {
    ...selectedItem,
    id: crypto.randomUUID(),
    idItemBase: selectedItem.idItemBase ?? selectedItem.id,
    quantidade: 1,
  };
  const selectedIsImplante = isImplante(nextItem);
  const emptyIndex = items.findIndex((item) => (
    isImplante(item) === selectedIsImplante && isEmptyItemRow(item)
  ));

  if (emptyIndex < 0) return [...items, nextItem];

  const updated = [...items];
  updated[emptyIndex] = nextItem;
  return updated;
};

export const getProtesesTableItems = (itens: Item[]): Item[] => {
  const proteses = getProtesesItems(itens);

  return proteses.length > 0
    ? proteses
    : [{ nome: '', tipo: 'implante', quantidade: 1 } satisfies Item];
};

export const replaceItemSection = (
  itens: Item[],
  section: 'inventario' | 'proteses',
  updatedItems: Item[],
) => [
  ...itens.filter((item) => section === 'proteses' ? !isImplante(item) : isImplante(item)),
  ...updatedItems,
];
