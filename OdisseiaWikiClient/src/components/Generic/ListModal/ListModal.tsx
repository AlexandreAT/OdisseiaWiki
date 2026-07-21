import { Modal } from '../Modal/Modal';
import { ListModalEmpty, ListModalGrid, ListModalTitle, ListModalViewport } from './ListModal.style';
import { ListModalProps } from './ListModal.types';

const formatCyberpunkTitle = (value: string) => (
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
);

export const ListModal = <T,>({
  title,
  items,
  color,
  emptyMessage,
  onClose,
  renderItem,
  columns = 2,
  width = '900px',
  maxVisibleRows,
  itemHeight,
  theme = 'dark',
  neon = 'on',
}: ListModalProps<T>) => (
  <Modal
    title={<ListModalTitle $theme={theme}>{formatCyberpunkTitle(title)}</ListModalTitle>}
    theme={theme}
    neon={neon}
    showFooter={false}
    onClose={onClose}
    width={width}
  >
    {items.length > 0 ? (
      <ListModalViewport $maxVisibleRows={maxVisibleRows} $itemHeight={itemHeight}>
        <ListModalGrid $color={color} $columns={columns} $itemHeight={itemHeight}>
          {items.map(renderItem)}
        </ListModalGrid>
      </ListModalViewport>
    ) : (
      <ListModalEmpty>{emptyMessage}</ListModalEmpty>
    )}
  </Modal>
);
