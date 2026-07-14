import { Item } from '../models/Itens';

type ItemImageSource = Partial<Item> & {
  url?: string;
  itemBase?: Partial<Item>;
  baseItem?: Partial<Item>;
};

export const getItemImage = (item: ItemImageSource, itemBase?: Partial<Item>): string | undefined => (
  item.imagem
  ?? item.url
  ?? item.itemBase?.imagem
  ?? item.baseItem?.imagem
  ?? itemBase?.imagem
);
