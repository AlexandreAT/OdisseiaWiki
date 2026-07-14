import { ReactNode } from 'react';

export interface ListModalProps<T> {
  title: string;
  items: T[];
  color: string;
  emptyMessage: string;
  onClose: () => void;
  renderItem: (item: T, index: number) => ReactNode;
}
