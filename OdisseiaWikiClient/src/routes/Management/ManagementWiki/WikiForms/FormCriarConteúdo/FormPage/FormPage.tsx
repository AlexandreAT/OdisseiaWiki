
import React, { useState } from 'react';
import { FormPageProps } from './FormPage.type';
import { useFormPage } from './useFormPage';
import { PageBlockType } from '../../../../../../models/Pages';
import { CyberButton } from '../../../../../../components/Generic/HighlightButton/HighlightButton';
import { InputText } from '../../../../../../components/Generic/InputText/InputText';
import { TextArea } from '../../../../../../components/Generic/TextArea/TextArea';
import { VisibilityToggle } from '../../../../../../components/Generic/VisibilityToggle';
import { FeaturedToggle } from '../../../../../../components/Generic/FeaturedToggle';
import { ImageUploader } from '../../../../../../components/Generic/ImageUploader/ImageUploader';
import type { CropPreset, CropResult } from '../../../../../../components/Generic/ImageUploader/types';
import {
  RichTextBlockEditor,
  ImageBlockEditor,
  GalleryBlockEditor,
  InfoLoreBlockEditor,
  RelationBlockEditor,
} from './PageBlockComponents';
import {
  FormPageContainer,
  SectionHeader,
  SectionTitle,
  GridInputs,
  FullWidthInput,
  PageVisibilityControls,
  SlugField,
  SlugInfoButton,
  SlugInfoPopover,
  BlocksContainer,
  BlockItem,
  BlockHeader,
  BlockTitle,
  BlockActions,
  IconButton,
  DragHandle,
  DragPreview,
  BlockContent,
  AddBlockContainer,
  BlockTypeSelector,
  BlockTypeButton,
  ActionButtonsContainer,
  EmptyBlocksMessage,
  BlocksValidationMessage,
} from './FormPage.style';
import { BiTrash, BiPlus, BiMoveVertical, BiInfoCircle } from 'react-icons/bi';
import { EntityEditFloatingActions } from '../../FormBuscarConteúdo/EntityEditFloatingActions';
import { revealFirstValidationError } from '../../../../../../utils/formValidationFeedback';
import { useEntityEditSync } from '../../../../../../hooks/useEntityEditSync';

const BLOCK_TYPES: PageBlockType[] = [
  PageBlockType.RICH_TEXT,
  PageBlockType.IMAGE,
  PageBlockType.GALLERY,
  PageBlockType.INFOLORE,
  PageBlockType.RELATION,
];

const blockTypeLabels: Record<PageBlockType, string> = {
  [PageBlockType.RICH_TEXT]: 'Texto Rico',
  [PageBlockType.IMAGE]: 'Imagem',
  [PageBlockType.GALLERY]: 'Galeria',
  [PageBlockType.INFOLORE]: 'InfoLore',
  [PageBlockType.RELATION]: 'Referência',
};

export const FormPage: React.FC<FormPageProps> = ({
  theme,
  neon,
  initialPage,
  initialBlocks,
  pageId,
  onSaveSuccess,
}) => {
  const {
    titulo,
    setTitulo,
    slug,
    setSlug,
    descricao,
    setDescricao,

    setCoverImageFile,
    visivel,
    setVisivel,
    destaque,
    setDestaque,

    blocks,
    addBlock,
    removeBlock,
    updateBlock,
    moveBlock,
    moveBlockUp,
    moveBlockDown,
    tituloError,
    setTituloError,
    slugError,
    setSlugError,
    blocksError,
    handleSubmit,
    isSubmitting,
  } = useFormPage({
    initialPage,
    initialBlocks,
    pageId,
  });

  const [selectedBlockType, setSelectedBlockType] = useState<PageBlockType | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState(initialPage?.coverImage || '');
  const [showSlugInfo, setShowSlugInfo] = useState(false);
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [dragPointer, setDragPointer] = useState({ x: 0, y: 0 });
  const draggingBlockIdRef = React.useRef<string | null>(null);
  const dragPointerRef = React.useRef({ x: 0, y: 0 });
  const autoScrollFrameRef = React.useRef<number | null>(null);
  const slugInfoRef = React.useRef<HTMLDivElement>(null);
  const persistInFlightRef = React.useRef(false);
  const blocksContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (blocksError) revealFirstValidationError(blocksContainerRef.current);
  }, [blocksError]);

  React.useEffect(() => {
    if (!showSlugInfo) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!slugInfoRef.current?.contains(event.target as Node)) setShowSlugInfo(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowSlugInfo(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [showSlugInfo]);

  const snapshot = React.useMemo(() => JSON.stringify({
    titulo,
    slug,
    descricao,
    coverImageUrl,
    visivel,
    destaque,
    blocks,
  }), [titulo, slug, descricao, coverImageUrl, visivel, destaque, blocks]);
  const { isSynced, markSaved } = useEntityEditSync({
    snapshot,
    identity: pageId,
    enabled: Boolean(pageId),
  });

  const persist = async (stayOnPage: boolean, e?: React.FormEvent) => {
    e?.preventDefault();
    if (persistInFlightRef.current) return;
    persistInFlightRef.current = true;
    try {
      const result = await handleSubmit();
      if (!result?.success) return;

      markSaved();
      await onSaveSuccess?.({ stayOnPage });
    } finally {
      persistInFlightRef.current = false;
    }
  };

  const stopDragging = () => {
    if (autoScrollFrameRef.current !== null) {
      cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
    }
    draggingBlockIdRef.current = null;
    setDraggingBlockId(null);
  };

  React.useEffect(() => () => {
    if (autoScrollFrameRef.current !== null) cancelAnimationFrame(autoScrollFrameRef.current);
  }, []);

  const moveDraggedBlockAtPoint = (draggedId: string, x: number, y: number) => {
    const targetBlock = document
      .elementFromPoint(x, y)
      ?.closest<HTMLElement>('[data-block-id]');
    const targetId = targetBlock?.dataset.blockId;
    if (targetId && targetId !== draggedId) moveBlock(draggedId, targetId);
  };

  const startAutoScroll = (draggedId: string) => {
    const tick = () => {
      if (draggingBlockIdRef.current !== draggedId) return;

      const { x, y } = dragPointerRef.current;
      const threshold = Math.min(120, window.innerHeight * 0.18);
      let scrollSpeed = 0;
      if (y < threshold) scrollSpeed = -Math.ceil(((threshold - y) / threshold) * 18);
      if (y > window.innerHeight - threshold) {
        scrollSpeed = Math.ceil(((y - (window.innerHeight - threshold)) / threshold) * 18);
      }

      if (scrollSpeed !== 0) {
        window.scrollBy(0, scrollSpeed);
        moveDraggedBlockAtPoint(draggedId, x, y);
      }

      autoScrollFrameRef.current = requestAnimationFrame(tick);
    };

    autoScrollFrameRef.current = requestAnimationFrame(tick);
  };

  const startDragging = (event: React.PointerEvent<HTMLButtonElement>, blockId: string) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragPointerRef.current = { x: event.clientX, y: event.clientY };
    setDragPointer(dragPointerRef.current);
    draggingBlockIdRef.current = blockId;
    setDraggingBlockId(blockId);
    startAutoScroll(blockId);
  };

  const dragBlockOver = (event: React.PointerEvent<HTMLButtonElement>) => {
    const draggedId = draggingBlockIdRef.current;
    if (!draggedId) return;
    event.preventDefault();
    dragPointerRef.current = { x: event.clientX, y: event.clientY };
    setDragPointer(dragPointerRef.current);
    moveDraggedBlockAtPoint(draggedId, event.clientX, event.clientY);
  };

  const coverImageCropPreset: CropPreset = {
    mode: 'single',
    aspectRatio: 16 / 9,
    shape: 'rectangle',
    displayShape: 'rectangle',
    label: 'Retângulo (16:9)',
  };

  const handleCoverImageUpload = (result: CropResult) => {
    setCoverImageFile(result.file);
    setCoverImageUrl(result.preview);
  };

  const handleAddBlock = (tipo: PageBlockType) => {
    addBlock(tipo);
    setSelectedBlockType(null);
  };

  const renderBlockEditor = (blockTempId: string) => {
    const block = blocks.find(b => b.tempId === blockTempId);
    if (!block) return null;

    const editorProps = {
      block,
      theme,
      neon,
      onUpdate: (content: unknown) => updateBlock(blockTempId, content),
    };

    switch (block.tipo) {
      case PageBlockType.RICH_TEXT:
        return <RichTextBlockEditor {...editorProps} />;
      case PageBlockType.IMAGE:
        return <ImageBlockEditor {...editorProps} />;
      case PageBlockType.GALLERY:
        return <GalleryBlockEditor {...editorProps} />;
      case PageBlockType.INFOLORE:
        return <InfoLoreBlockEditor {...editorProps} />;
      case PageBlockType.RELATION:
        return <RelationBlockEditor {...editorProps} />;
      default:
        return null;
    }
  };

  return (
    <FormPageContainer onSubmit={(e) => void persist(false, e)}>
      <div>
        <SectionHeader $isDark={theme === 'dark'}>
          <SectionTitle>Informações da Página</SectionTitle>
        </SectionHeader>

        <GridInputs>
          <InputText
            theme={theme}
            neon={neon}
            label="Título *"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            onFocus={() => setTituloError('')}
            width="100%"
            error={!!tituloError}
            errorMessage={tituloError}
            required
          />

          <SlugField ref={slugInfoRef}>
            <InputText
              theme={theme}
              neon={neon}
              label="Slug *"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              onFocus={() => setSlugError('')}
              width="100%"
              error={!!slugError}
              errorMessage={slugError}
              required
            />
            <SlugInfoButton
              type="button"
              $isDark={theme === 'dark'}
              $neon={neon === 'on'}
              aria-label="Como o slug funciona"
              aria-expanded={showSlugInfo}
              onClick={() => setShowSlugInfo((visible) => !visible)}
            >
              <BiInfoCircle aria-hidden="true" />
            </SlugInfoButton>
            {showSlugInfo && (
              <SlugInfoPopover $isDark={theme === 'dark'} $neon={neon === 'on'} role="status">
                <strong>Como funciona o slug</strong>
                <p>{'Ele forma o endere\u00e7o da p\u00e1gina. Enquanto voc\u00ea digita o t\u00edtulo, o valor \u00e9 criado automaticamente; ao edit\u00e1-lo manualmente, sua escolha passa a ser mantida.'}</p>
                <ul>
                  <li>{'Use palavras sem acentos, separadas por h\u00edfen: '}<code>teste-de-pagina</code>.</li>
                  <li>{'Cada p\u00e1gina deve possuir um slug \u00fanico.'}</li>
                  <li><code>MainPage</code>{' identifica a p\u00e1gina principal da wiki.'}</li>
                  <li><code>search</code>{' \u00e9 reservado para a busca e n\u00e3o deve ser usado.'}</li>
                </ul>
              </SlugInfoPopover>
            )}
          </SlugField>
        </GridInputs>

        <FullWidthInput>
          <TextArea
            theme={theme}
            neon={neon}
            label="Descrição (opcional)"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            fullWidth
          />
        </FullWidthInput>
        
        <FullWidthInput>
          <ImageUploader
            theme={theme}
            neon={neon}
            label="Imagem de Capa (opcional)"
            initialImage={coverImageUrl}
            onImageCropped={handleCoverImageUpload}
            cropPreset={coverImageCropPreset}
            mobileSize="full"
          />
        </FullWidthInput>

        <PageVisibilityControls>
          <VisibilityToggle
            label="Página visível"
            visible={visivel}
            onChange={setVisivel}
          />
          <FeaturedToggle featured={destaque} onChange={setDestaque} />
        </PageVisibilityControls>
      </div>

      <div>
        <SectionHeader $isDark={theme === 'dark'}>
          <SectionTitle>Blocos da Página</SectionTitle>
          <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>
            {blocks.length} bloco(s) adicionado(s)
          </p>
        </SectionHeader>

        <BlocksContainer
          ref={blocksContainerRef}
          $isDark={theme === 'dark'}
          $neon={neon === 'on'}
          $error={!!blocksError}
          data-validation-error={!!blocksError || undefined}
        >
          {blocks.length === 0 ? (
            <EmptyBlocksMessage>
              <p>Nenhum bloco adicionado ainda.</p>
              <p>Adicione blocos para criar o conteúdo da página.</p>
            </EmptyBlocksMessage>
          ) : (
            blocks.map((block, idx) => (
              <BlockItem
                key={block.tempId}
                data-block-id={block.tempId}
                $isDark={theme === 'dark'}
                $neon={neon === 'on'}
                $isDragging={draggingBlockId === block.tempId}
              >
                <BlockHeader>
                  <BlockTitle>
                    <h3>{blockTypeLabels[block.tipo]}</h3>
                    <span>#{idx + 1}</span>
                  </BlockTitle>

                  <BlockActions>
                    <DragHandle
                      type="button"
                      $isDark={theme === 'dark'}
                      $neon={neon === 'on'}
                      $dragging={draggingBlockId === block.tempId}
                      title="Segure e arraste para reordenar"
                      aria-label={`Reordenar bloco ${idx + 1}. Use as setas para mover pelo teclado.`}
                      onPointerDown={(event) => startDragging(event, block.tempId!)}
                      onPointerMove={dragBlockOver}
                      onPointerUp={stopDragging}
                      onPointerCancel={stopDragging}
                      onKeyDown={(event) => {
                        if (event.key === 'ArrowUp') {
                          event.preventDefault();
                          moveBlockUp(block.tempId!);
                        }
                        if (event.key === 'ArrowDown') {
                          event.preventDefault();
                          moveBlockDown(block.tempId!);
                        }
                      }}
                    >
                      <BiMoveVertical />
                    </DragHandle>
                    <IconButton
                      type="button"
                      onClick={() => removeBlock(block.tempId!)}
                      danger
                      $isDark={theme === 'dark'}
                      $neon={neon === 'on'}
                      title="Remover bloco"
                    >
                      <BiTrash />
                    </IconButton>
                  </BlockActions>
                </BlockHeader>

                <BlockContent>
                  {renderBlockEditor(block.tempId!)}
                </BlockContent>
              </BlockItem>
            ))
          )}
        </BlocksContainer>
        {draggingBlockId && (
          <DragPreview
            $isDark={theme === 'dark'}
            $neon={neon === 'on'}
            style={{
              left: Math.min(dragPointer.x, Math.max(8, window.innerWidth - 292)),
              top: Math.min(dragPointer.y, Math.max(8, window.innerHeight - 92)),
            }}
            aria-hidden="true"
          >
            <BiMoveVertical />
            <span>
              Movendo {blockTypeLabels[blocks.find((block) => block.tempId === draggingBlockId)?.tipo ?? PageBlockType.RICH_TEXT]}
            </span>
          </DragPreview>
        )}
        {blocksError && <BlocksValidationMessage role="alert">{blocksError}</BlocksValidationMessage>}

        <AddBlockContainer>
          <label style={{ fontWeight: 'bold', fontSize: '14px' }}>
            Adicionar novo bloco:
          </label>
          <BlockTypeSelector>
            {BLOCK_TYPES.map((tipo) => (
              <BlockTypeButton
                key={tipo}
                type="button"
                onClick={() => handleAddBlock(tipo)}
                active={selectedBlockType === tipo}
                $isDark={theme === 'dark'}
                $neon={neon === 'on'}
              >
                <BiPlus />
                {blockTypeLabels[tipo]}
              </BlockTypeButton>
            ))}
          </BlockTypeSelector>
        </AddBlockContainer>
      </div>

      <ActionButtonsContainer $isDark={theme === 'dark'}>
        <CyberButton
          colorType="secondary"
          theme={theme}
          neon={neon}
          text="Cancelar"
          width="180px"
          type="button"
        />

        <CyberButton
          theme={theme}
          neon={neon}
          text={pageId ? "Atualizar Página" : "Criar Página"}
          width="180px"
          type="submit"
          loading={isSubmitting}
        />
      </ActionButtonsContainer>
      {pageId && (
        <EntityEditFloatingActions
          theme={theme}
          neon={neon}
          synced={isSynced}
          saving={isSubmitting}
          onSave={() => void persist(true)}
        />
      )}
    </FormPageContainer>
  );
};
