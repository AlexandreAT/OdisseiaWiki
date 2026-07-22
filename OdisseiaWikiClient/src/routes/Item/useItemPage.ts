import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Item } from '../../models/Itens';
import { PageDto } from '../../models/Pages';
import { getItemById } from '../../services/itensService';
import { getPagesReferencingEntity } from '../../services/pageService';
import { mapToItem } from '../../utils/mapItem';
import { loadItemPreview } from '../../utils/itemPreview';
import { ItemDetailModal, ItemPageModal } from './ItemPage.types';

const comparePages = (left: PageDto, right: PageDto) => (
  left.titulo.localeCompare(right.titulo, 'pt-BR', { sensitivity: 'base' })
);

const hasRichTextContent = (value: unknown): boolean => {
  if (typeof value === 'string') return value.trim().length > 0;
  if (!value || typeof value !== 'object') return false;
  if ('text' in value && typeof value.text === 'string' && value.text.trim()) return true;
  if ('content' in value && Array.isArray(value.content)) return value.content.some(hasRichTextContent);
  return false;
};

export const useItemPage = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [relatedPages, setRelatedPages] = useState<PageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<ItemPageModal>(null);
  const [selectedDetail, setSelectedDetail] = useState<ItemDetailModal | null>(null);
  const [imageOpen, setImageOpen] = useState(false);

  useEffect(() => {
    let active = true;

    if (!id?.trim()) {
      setError('O identificador do item é inválido.');
      setLoading(false);
      return undefined;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      setItem(null);
      setRelatedPages([]);

      const previewItem = loadItemPreview(id);
      if (previewItem) {
        setItem(previewItem);

        if (previewItem.idItemBase) {
          try {
            const pagesResult = await getPagesReferencingEntity('Item', previewItem.idItemBase);
            if (active && pagesResult.sucesso !== false && Array.isArray(pagesResult.pages)) {
              setRelatedPages(
                pagesResult.pages
                  .filter((page) => page.visivel !== false)
                  .sort(comparePages)
              );
            }
          } catch {
            // A visualizaÃ§Ã£o local do item continua disponÃ­vel mesmo sem referÃªncias remotas.
          }
        }

        if (active) setLoading(false);
        return;
      }

      const [itemResult, pagesResult] = await Promise.allSettled([
        getItemById(id),
        getPagesReferencingEntity('Item', id),
      ]);

      if (!active) return;

      if (itemResult.status === 'rejected') {
        setError('Não foi possível carregar este item. Ele pode não existir ou não estar visível.');
        setLoading(false);
        return;
      }

      const mappedItem = mapToItem(itemResult.value);
      setItem(mappedItem);

      if (pagesResult.status === 'fulfilled'
        && pagesResult.value.sucesso !== false
        && Array.isArray(pagesResult.value.pages)) {
        setRelatedPages(
          pagesResult.value.pages
            .filter((page) => page.visivel !== false)
            .sort(comparePages)
        );
      }

      setLoading(false);
    };

    load().catch(() => {
      if (!active) return;
      setError('Não foi possível carregar este item. Tente novamente.');
      setLoading(false);
    });

    return () => { active = false; };
  }, [id]);

  const closeModal = useCallback(() => setActiveModal(null), []);
  const closeDetail = useCallback(() => setSelectedDetail(null), []);

  return {
    item,
    relatedPages,
    loading,
    error,
    activeModal,
    selectedDetail,
    imageOpen,
    hasDescription: hasRichTextContent(item?.descricao),
    setActiveModal,
    closeModal,
    setSelectedDetail,
    closeDetail,
    setImageOpen,
  };
};
