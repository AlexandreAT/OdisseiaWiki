import { Item } from '../models/Itens';

export const isImplante = (item: Item) => item.tipo === 'implante';
export const getInventarioItems = (itens: Item[]) => itens.filter((item) => !isImplante(item));
export const getProtesesItems = (itens: Item[]) => itens.filter(isImplante);

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
