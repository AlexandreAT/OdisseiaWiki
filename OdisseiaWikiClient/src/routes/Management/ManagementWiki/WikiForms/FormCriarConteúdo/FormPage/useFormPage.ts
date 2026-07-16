import { useState, useCallback, useEffect } from 'react';
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

  useEffect(() => {
    if (initialPage) {
      setTitulo(initialPage.titulo || '');
      setSlug(initialPage.slug || '');
      setDescricao(initialPage.descricao || '');
      setCoverImageUrl(initialPage.coverImage || '');
      setVisivel(initialPage.visivel ?? true);
      setDestaque(initialPage.destaque ?? false);
    }
  }, [initialPage]);

  useEffect(() => {
    console.log("🚀 ~ useFormPage ~ initialBlocks:", initialBlocks)
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
    const novoBloco: PageBlock = {
      tipo,
      conteudo: getDefaultContent(tipo),
      ordem: blocks.length,
      tempId: generateTempId(),
    };

    setBlocks([...blocks, novoBloco]);
  }, [blocks]);

  const removeBlock = useCallback((tempId: string) => {
    const novosBlocos = blocks.filter(b => b.tempId !== tempId)
      .map((b, idx) => ({ ...b, ordem: idx }));
    setBlocks(novosBlocos);
  }, [blocks]);

  const updateBlock = useCallback((tempId: string, conteudo: any) => {
    setBlocks(blocks.map(b =>
      b.tempId === tempId ? { ...b, conteudo } : b
    ));
  }, [blocks]);

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
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }, []);

  const handleTituloChange = useCallback((newTitulo: string) => {
    setTitulo(newTitulo);
    // Auto-gerar slug se estiver vazio
    if (!slug) {
      setSlug(generateSlug(newTitulo));
    }
  }, [slug, generateSlug]);

  // --- Submit ---
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validateForm()) {
      return;
    }

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
        return;
        }

        toast.success("Página salva com sucesso!");
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Erro ao salvar página'));
    }
  }, [validateForm, coverImageUrl, coverImageFile, slug, titulo, descricao, visivel, destaque, blocks, pageId, initialPage?.dataCriacao]);

  return {
    // Dados da página
    titulo,
    setTitulo: handleTituloChange,
    slug,
    setSlug,
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
    moveBlockUp,
    moveBlockDown,

    // Erros
    tituloError,
    setTituloError,
    slugError,
    setSlugError,

    // Submit
    handleSubmit,
  };
};
