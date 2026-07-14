import { Modal } from '../Modal/Modal';
import { ListModalEmpty, ListModalGrid, ListModalTitle } from './ListModal.style';
import { ListModalProps } from './ListModal.types';

export const ListModal = <T,>({
  title,
  items,
  color,
  emptyMessage,
  onClose,
  renderItem,
}: ListModalProps<T>) => (
  <Modal title={<ListModalTitle>{title}</ListModalTitle>} theme="dark" neon="on" showFooter={false} onClose={onClose} width="900px">
    {items.length > 0 ? (
      <ListModalGrid $color={color}>
        {items.map(renderItem)}
      </ListModalGrid>
    ) : (
      <ListModalEmpty>{emptyMessage}</ListModalEmpty>
    )}
  </Modal>
);
