
import React, { useState } from 'react';
import { FormPageProps } from './FormPage.type';
import { useFormPage } from './useFormPage';
import { PageBlockType } from '../../../../../../models/Pages';
import { CyberButton } from '../../../../../../components/Generic/HighlightButton/HighlightButton';
import { InputText } from '../../../../../../components/Generic/InputText/InputText';
import { TextArea } from '../../../../../../components/Generic/TextArea/TextArea';
import { CheckBox } from '../../../../../../components/Generic/CheckBox/CheckBox';
import { FeaturedToggle } from '../../../../../../components/Generic/FeaturedToggle';
import { ImageUploader } from '../../../../../../components/Generic/ImageUploader/ImageUploader';
import type { CropPreset } from '../../../../../../components/Generic/ImageUploader/types';
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
  BlocksContainer,
  BlockItem,
  BlockHeader,
  BlockTitle,
  BlockActions,
  IconButton,
  BlockContent,
  AddBlockContainer,
  BlockTypeSelector,
  BlockTypeButton,
  ActionButtonsContainer,
  EmptyBlocksMessage,
} from './FormPage.style';
import { BiTrash, BiChevronUp, BiChevronDown, BiPlus } from 'react-icons/bi';

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
    moveBlockUp,
    moveBlockDown,
    tituloError,
    setTituloError,
    slugError,
    setSlugError,
    handleSubmit,
  } = useFormPage({
    initialPage,
    initialBlocks,
    pageId,
  });

  const [selectedBlockType, setSelectedBlockType] = useState<PageBlockType | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState(initialPage?.coverImage || '');

  const coverImageCropPreset: CropPreset = {
    mode: 'single',
    aspectRatio: 16 / 9,
    shape: 'rectangle',
    displayShape: 'rectangle',
    label: 'Retângulo (16:9)',
  };

  const handleCoverImageUpload = (result: any) => {
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
      onUpdate: (content: any) => updateBlock(blockTempId, content),
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
    <FormPageContainer onSubmit={handleSubmit}>
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
            mobileSize="main"
          />
        </FullWidthInput>

        <FullWidthInput>
          <CheckBox
            neon={neon}
            label="Página visível"
            checked={visivel}
            onChange={setVisivel}
          />
          <FeaturedToggle featured={destaque} onChange={setDestaque} />
        </FullWidthInput>
      </div>

      <div>
        <SectionHeader $isDark={theme === 'dark'}>
          <SectionTitle>Blocos da Página</SectionTitle>
          <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>
            {blocks.length} bloco(s) adicionado(s)
          </p>
        </SectionHeader>

        <BlocksContainer $isDark={theme === 'dark'}>
          {blocks.length === 0 ? (
            <EmptyBlocksMessage>
              <p>Nenhum bloco adicionado ainda.</p>
              <p>Adicione blocos para criar o conteúdo da página.</p>
            </EmptyBlocksMessage>
          ) : (
            blocks.map((block, idx) => (
              <BlockItem key={block.tempId} $isDark={theme === 'dark'}>
                <BlockHeader>
                  <BlockTitle>
                    <h3>{blockTypeLabels[block.tipo]}</h3>
                    <span>#{idx + 1}</span>
                  </BlockTitle>

                  <BlockActions>
                    <IconButton
                      type="button"
                      onClick={() => moveBlockUp(block.tempId!)}
                      disabled={idx === 0}
                      title="Mover para cima"
                    >
                      <BiChevronUp />
                    </IconButton>
                    <IconButton
                      type="button"
                      onClick={() => moveBlockDown(block.tempId!)}
                      disabled={idx === blocks.length - 1}
                      title="Mover para baixo"
                    >
                      <BiChevronDown />
                    </IconButton>
                    <IconButton
                      type="button"
                      onClick={() => removeBlock(block.tempId!)}
                      danger
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
              >
                <BiPlus style={{ marginRight: '4px' }} />
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
        />
      </ActionButtonsContainer>
    </FormPageContainer>
  );
};
