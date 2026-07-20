import { useState, useCallback, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { PageDto, PageBlock, CreatePageWithBlocksDto, PageBlockType, PageBlockDto } from '../../../../../../models/Pages';
import { createPage, updatePage } from '../../../../../../services/pageService';
import { saveAsset } from '../../../../../../services/assetsService';
import { getApiErrorMessage } from '../../../../../../utils/apiError';

interface UseFormPageProps {
  initialPage?: PageDto;
  initialBlocks?: PageBlock[];
  pageId?: number;
}

const generateTempId = () => {
  return `block_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

const getDefaultContent = (tipo: PageBlockType): any => {
  switch (tipo) {
    case PageBlockType.RICH_TEXT:
      return { content: [] };
    case PageBlockType.RELATION:
      return [];
    default:
      return {};
  }
};

export const useFormPage = ({
  initialPage,
  initialBlocks = [],
  pageId,
}: UseFormPageProps = {}) => {
  // --- Dados da página ---
  const [titulo, setTitulo] = useState(initialPage?.titulo || '');
  const [slug, setSlug] = useState(initialPage?.slug || '');
  const slugManuallyEditedRef = useRef(Boolean(initialPage?.slug));
  const [descricao, setDescricao] = useState(initialPage?.descricao || '');
  const [coverImageUrl, setCoverImageUrl] = useState(initialPage?.coverImage || '');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [visivel, setVisivel] = useState(initialPage?.visivel ?? true);
  const [destaque, setDestaque] = useState(initialPage?.destaque ?? false);

  // --- Blocos ---
  const [blocks, setBlocks] = useState<PageBlock[]>(
    initialBlocks.length > 0
      ? initialBlocks.map((b, idx) => ({
        ...b,
        tempId: b.tempId || generateTempId(),
        ordem: idx,
      }))
      : []
  );

  // --- Erros ---
  const [tituloError, setTituloError] = useState('');
  const [slugError, setSlugError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialPage) {
      setTitulo(initialPage.titulo || '');
      setSlug(initialPage.slug || '');
      slugManuallyEditedRef.current = Boolean(initialPage.slug);
      setDescricao(initialPage.descricao || '');
      setCoverImageUrl(initialPage.coverImage || '');
      setVisivel(initialPage.visivel ?? true);
      setDestaque(initialPage.destaque ?? false);
    }
  }, [initialPage]);

  useEffect(() => {
    if (initialBlocks && initialBlocks.length > 0) {
      setBlocks(
        initialBlocks.map((b, idx) => ({
          ...b,
          tempId: b.tempId || generateTempId(),
          ordem: idx,
        }))
      );
    }
  }, [initialBlocks]);

  // --- Validações básicas ---
  const validateForm = useCallback((): boolean => {
    let isValid = true;

    if (!titulo.trim()) {
      setTituloError('Título é obrigatório');
      isValid = false;
    } else {
      setTituloError('');
    }

    if (!slug.trim()) {
      setSlugError('Slug é obrigatório');
      isValid = false;
    } else {
      setSlugError('');
    }

    if (blocks.length === 0) {
      toast.error('Adicione pelo menos um bloco à página');
      isValid = false;
    }

    return isValid;
  }, [titulo, slug, blocks.length]);

  // --- Gerenciamento de blocos ---
  const addBlock = useCallback((tipo: PageBlockType) => {
    setBlocks((currentBlocks) => [...currentBlocks, {
      tipo,
      conteudo: getDefaultContent(tipo),
      ordem: currentBlocks.length,
      tempId: generateTempId(),
    }]);
  }, []);

  const removeBlock = useCallback((tempId: string) => {
    setBlocks((currentBlocks) => currentBlocks.filter(b => b.tempId !== tempId)
      .map((b, idx) => ({ ...b, ordem: idx })));
  }, []);

  const updateBlock = useCallback((tempId: string, conteudo: any) => {
    setBlocks((currentBlocks) => currentBlocks.map(b =>
      b.tempId === tempId ? { ...b, conteudo } : b
    ));
  }, []);

  const moveBlock = useCallback((draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;

    setBlocks((currentBlocks) => {
      const draggedIndex = currentBlocks.findIndex((block) => block.tempId === draggedId);
      const targetIndex = currentBlocks.findIndex((block) => block.tempId === targetId);
      if (draggedIndex < 0 || targetIndex < 0 || draggedIndex === targetIndex) return currentBlocks;

      const reordered = [...currentBlocks];
      const [draggedBlock] = reordered.splice(draggedIndex, 1);
      reordered.splice(targetIndex, 0, draggedBlock);
      return reordered.map((block, index) => ({ ...block, ordem: index }));
    });
  }, []);

  const moveBlockUp = useCallback((tempId: string) => {
    const idx = blocks.findIndex(b => b.tempId === tempId);
    if (idx <= 0) return;

    const novosBlocos = [...blocks];
    [novosBlocos[idx], novosBlocos[idx - 1]] = [novosBlocos[idx - 1], novosBlocos[idx]];

    novosBlocos.forEach((b, i) => {
      b.ordem = i;
    });

    setBlocks(novosBlocos);
  }, [blocks]);

  const moveBlockDown = useCallback((tempId: string) => {
    const idx = blocks.findIndex(b => b.tempId === tempId);
    if (idx >= blocks.length - 1) return;

    const novosBlocos = [...blocks];
    [novosBlocos[idx], novosBlocos[idx + 1]] = [novosBlocos[idx + 1], novosBlocos[idx]];

    novosBlocos.forEach((b, i) => {
      b.ordem = i;
    });

    setBlocks(novosBlocos);
  }, [blocks]);

  // --- Auto-gerar slug ---
  const generateSlug = useCallback((text: string): string => {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }, []);

  const handleTituloChange = useCallback((newTitulo: string) => {
    setTitulo(newTitulo);
    if (!slugManuallyEditedRef.current) {
      setSlug(generateSlug(newTitulo));
    }
  }, [generateSlug]);

  const handleSlugChange = useCallback((newSlug: string) => {
    slugManuallyEditedRef.current = true;
    setSlug(newSlug);
  }, []);

  // --- Submit ---
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validateForm()) {
      return { success: false };
    }

    setIsSubmitting(true);
    try {
      let coverImagePath = coverImageUrl;

      // Fazer upload da cover image se necessário
      if (coverImageFile) {
        const result = await saveAsset({
          imageFile: coverImageFile,
          type: "pages",
          entityName: slug,
        });
        coverImagePath = result.path;
      }

      // Preparar blocos sem tempId para envio
      const blocksForApi: PageBlockDto[] = blocks.map(b => ({
        tipo: b.tipo,
        conteudo: b.conteudo,
        ordem: b.ordem,
      }));

      const pageData: PageDto = {
        idPage: pageId,
        titulo,
        slug,
        descricao,
        coverImage: coverImagePath || undefined,
        visivel,
        destaque,
        dataCriacao: initialPage?.dataCriacao,
      };

      const payload: CreatePageWithBlocksDto = {
        page: pageData,
        blocks: blocksForApi,
      };

      const result = pageId
        ? await updatePage(pageId, payload)
        : await createPage(payload);

        if (!result.sucesso) {
        toast.error(result.mensagemErro || "Erro ao salvar página");
        return { success: false };
        }

        toast.success("Página salva com sucesso!");
        return { success: true };
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Erro ao salvar página'));
      return { success: false };
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, coverImageUrl, coverImageFile, slug, titulo, descricao, visivel, destaque, blocks, pageId, initialPage?.dataCriacao]);

  return {
    // Dados da página
    titulo,
    setTitulo: handleTituloChange,
    slug,
    setSlug: handleSlugChange,
    descricao,
    setDescricao,
    coverImageUrl,
    setCoverImageUrl,
    coverImageFile,
    setCoverImageFile,
    visivel,
    setVisivel,
    destaque,
    setDestaque,
    generateSlug,

    // Blocos
    blocks,
    addBlock,
    removeBlock,
    updateBlock,
    moveBlock,
    moveBlockUp,
    moveBlockDown,

    // Erros
    tituloError,
    setTituloError,
    slugError,
    setSlugError,
    isSubmitting,

    // Submit
    handleSubmit,
  };
};
