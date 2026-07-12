import { Item } from '../models/Itens';

export const isImplante = (item: Item) => item.tipo === 'implante';
export const getInventarioItems = (itens: Item[]) => itens.filter((item) => !isImplante(item));
export const getProtesesItems = (itens: Item[]) => itens.filter(isImplante);

export const replaceItemSection = (
  itens: Item[],
  section: 'inventario' | 'proteses',
  updatedItems: Item[],
) => [
  ...itens.filter((item) => section === 'proteses' ? !isImplante(item) : isImplante(item)),
  ...updatedItems,
];
