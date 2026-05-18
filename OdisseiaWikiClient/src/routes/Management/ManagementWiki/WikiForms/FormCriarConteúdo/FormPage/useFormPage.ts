import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { PageDto, PageBlock, CreatePageWithBlocksDto, PageBlockType, PageBlockDto } from '../../../../../../models/Pages';
import { createPage, updatePage } from '../../../../../../services/pageService';
import { saveAsset } from '../../../../../../services/assetsService';

interface UseFormPageProps {
  initialPage?: PageDto;
  initialBlocks?: PageBlock[];
  pageId?: number;
}

const generateTempId = () => {
  return `block_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

const extractErrorMessage = (error: any): string => {
  const responseData = error?.response?.data;
  console.log("🚀 ~ extractErrorMessage ~ responseData:", responseData)

  if (!responseData) return 'Erro ao salvar página';
  if (typeof responseData === 'string') return responseData;

  if (typeof responseData === 'object') {
    if (typeof responseData.title === 'string' && responseData.title.trim()) {
      return responseData.title;
    }

    if (typeof responseData.mensagemErro === 'string' && responseData.mensagemErro.trim()) {
      return responseData.mensagemErro;
    }

    if (responseData.errors && typeof responseData.errors === 'object') {
      const firstErrorArray = Object.values(responseData.errors).find(
        (value) => Array.isArray(value) && value.length > 0
      ) as string[] | undefined;

      if (firstErrorArray?.[0]) {
        return firstErrorArray[0];
      }
    }
  }

  return 'Erro ao salvar página';
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
      conteudo: tipo === PageBlockType.RICH_TEXT ? { content: [] } : {},
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
        dataCriacao: initialPage?.dataCriacao,
      };

      const payload: CreatePageWithBlocksDto = {
        page: pageData,
        blocks: blocksForApi,
      };

      console.log("🚀 ~ handleSubmit ~ payload:", payload);

      const result = pageId
        ? await updatePage(pageId, payload)
        : await createPage(payload);

        if (!result.sucesso) {
        toast.error(result.mensagemErro || "Erro ao salvar página");
        return;
        }

        toast.success("Página salva com sucesso!");
    } catch (err: any) {
      toast.error(extractErrorMessage(err));
    }
  }, [validateForm, coverImageUrl, coverImageFile, slug, titulo, descricao, visivel, blocks, pageId, initialPage?.dataCriacao]);

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
