import React, { useRef, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useFormCity } from './useFormCity';
import { InputText } from '../../../../../../components/Generic/InputText/InputText';
import { RichTextEditor } from '../../../../../../components/Generic/RichTextEditor/RichTextEditor';
import { CyberButton } from '../../../../../../components/Generic/HighlightButton/HighlightButton';
import { VisibilityToggle } from '../../../../../../components/Generic/VisibilityToggle';
import { FeaturedToggle } from '../../../../../../components/Generic/FeaturedToggle';
import { ImageUploader } from '../../../../../../components/Generic/ImageUploader/ImageUploader';
import type { CropPreset, CropResult } from '../../../../../../components/Generic/ImageUploader/types';
import { ImageGalleryWithCrop } from '../../../../../../components/Generic/ImageGallery/ImageGalleryWithCrop';
import { HorizontalList } from '../../../../../../components/Generic/HorizontalList/HorizontalList';
import { DataTable } from '../../../../../../components/Generic/DataTable/DataTable';
import { PontoDeInteresse } from '../../../../../../models/Cities';
import { normalizeImagePath } from '../../../../../Wiki/utils/imagePathHelper';
import { EntityEditFloatingActions } from '../../FormBuscarConteúdo/EntityEditFloatingActions';
import {
  FormController,
  FormHeader,
  HeaderInfo,
  ImageSection,
  DescriptionSection,
  ButtonsContainer,
  TagsSection,
  CheckboxSection,
  PontosInteresseSection,
  PontosInteresseHeader,
  PontosInteresseHelp,
  PontosInteresseError,
  PointImageCell,
  SectionTitle,
} from './FormCity.style';

interface FormCityProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  initialCity?: import('../../../../../../services/cidadesService').CidadePayload;
  onSaveSuccess?: (options: { stayOnPage: boolean }) => void | Promise<void>;
  contentType?: string;
}

const POINT_IMAGE_CROP_PRESET: CropPreset = {
  mode: 'single',
  aspectRatio: 1,
  shape: 'square',
  displayShape: 'square',
  label: 'Quadrado (1:1)',
};

export const FormCity = ({ theme, neon, initialCity, onSaveSuccess, contentType }: FormCityProps) => {
  const pointImageFilesRef = useRef<Map<string, File>>(new Map());
  const persistInFlightRef = useRef(false);
  const {
    cidadeId,
    nome,
    descricao,
    imagemUrl,
    imagemFile,
    galeriaUrls,
    galeriaFiles,
    galeriaShapes,
    galeriaCaptions,
    tags,
    tagInput,
    pontosDeInteresse,
    pontosDeInteresseError,
    visivel,
    destaque,
    isSubmitting,
    nomeError,
    setNome,
    setNomeError,
    setDescricao,
    setTagInput,
    setPontosDeInteresse,
    setVisivel,
    setDestaque,
    handleImagemUpload,
    handleGaleriaUpload,
    handleRemoveGaleriaImage,
    handleGaleriaCaptionChange,
    handleAddTag,
    handleRemoveTag,
    handleSubmit,
    resetForm,
  } = useFormCity(initialCity, contentType);

  const cityImageCropPreset: CropPreset = {
    mode: 'single',
    aspectRatio: 16 / 9,
    shape: 'rectangle',
    displayShape: 'rectangle',
    label: 'Retângulo (16:9)',
  };

  const handleCityImageUpload = (result: CropResult) => {
    handleImagemUpload(result.file);
  };

  const pontosDeInteresseColumns = useMemo(() => [
    {
      key: 'imagem' as const,
      label: 'Imagem',
      width: '18%',
      customRender: (
        value: unknown,
        _row: PontoDeInteresse,
        onChange: (value: string) => void,
      ) => {
        const currentImage = typeof value === 'string' ? value : '';

        return (
          <PointImageCell>
            <ImageUploader
              theme={theme}
              neon={neon}
              initialImage={normalizeImagePath(currentImage)}
              cropPreset={POINT_IMAGE_CROP_PRESET}
              mobileSize="compact"
              onImageCropped={(result) => {
                if (currentImage) pointImageFilesRef.current.delete(currentImage);
                pointImageFilesRef.current.set(result.preview, result.file);
                onChange(result.preview);
              }}
              onRemove={() => {
                if (currentImage) pointImageFilesRef.current.delete(currentImage);
                onChange('');
              }}
            />
          </PointImageCell>
        );
      },
    },
    { key: 'nome' as const, label: 'Nome', width: '27%', inputType: 'text' as const },
    { key: 'descricao' as const, label: 'Descrição simplificada', width: '55%', inputType: 'text' as const },
  ], [theme, neon]);

  const tagInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const input = tagInputRef.current;
    if (!input) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTag();
      }
    };

    input.addEventListener('keydown', handleKeyDown);
    return () => input.removeEventListener('keydown', handleKeyDown);
  }, [handleAddTag]);

  const snapshot = React.useMemo(() => JSON.stringify({
    nome,
    descricao,
    imagemUrl,
    imagemFile: imagemFile ? [imagemFile.name, imagemFile.size, imagemFile.lastModified] : null,
    galeriaUrls,
    galeriaFiles: galeriaFiles.map(file => [file.name, file.size, file.lastModified]),
    galeriaCaptions,
    tags,
    pontosDeInteresse,
    visivel,
    destaque,
  }), [nome, descricao, imagemUrl, imagemFile, galeriaUrls, galeriaFiles, galeriaCaptions, tags, pontosDeInteresse, visivel, destaque]);
  const [lastSavedSnapshot, setLastSavedSnapshot] = React.useState(snapshot);
  const isSynced = snapshot === lastSavedSnapshot;

  const persist = async (stayOnPage: boolean, e?: React.FormEvent) => {
    e?.preventDefault();
    if (persistInFlightRef.current) return;
    persistInFlightRef.current = true;
    try {
      const result = await handleSubmit(e, pointImageFilesRef.current);

      if (result?.success) {
        pointImageFilesRef.current.clear();
        toast.success(result.message);
        setLastSavedSnapshot(snapshot);
        if (onSaveSuccess) {
          await onSaveSuccess({ stayOnPage });
        }
      } else {
        toast.error(result?.message || 'Erro ao salvar cidade');
      }
    } finally {
      persistInFlightRef.current = false;
    }
  };

  const onSubmit = (e: React.FormEvent) => persist(false, e);

  const handleReset = () => {
    pointImageFilesRef.current.clear();
    resetForm();
  };

  return (
    <FormController onSubmit={onSubmit}>
      <FormHeader>
        <HeaderInfo>
          <InputText
            theme={theme}
            neon={neon}
            label="Nome da Cidade *"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onFocus={() => setNomeError('')}
            width="100%"
            error={!!nomeError}
            errorMessage={nomeError}
            required
          />
          <TagsSection>
        <InputText
          ref={tagInputRef}
          theme={theme}
          neon={neon}
          label="Adicionar tag"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          width="100%"
        />
        {tags.length > 0 && (
          <HorizontalList
            theme={theme}
            neon={neon}
            data={tags.map((tag, index) => ({ id: index, nome: tag }))}
            canDelete={(item) => !contentType || item.nome.localeCompare(contentType, undefined, { sensitivity: 'accent' }) !== 0}
            onDelete={(id) => {
              const tagToRemove = tags[id as number];
              if (tagToRemove) {
                handleRemoveTag(tagToRemove);
              }
            }}
          />
        )}
      </TagsSection>

        </HeaderInfo>

        <ImageSection>
          <ImageUploader
            theme={theme}
            neon={neon}
            label="Imagem Principal"
            initialImage={imagemUrl}
            onImageCropped={handleCityImageUpload}
            cropPreset={cityImageCropPreset}
            mobileSize="main"
          />
        </ImageSection>
      </FormHeader>

      <PontosInteresseSection>
        <PontosInteresseHeader>
          <SectionTitle theme={theme} neon={neon}>Pontos de interesse</SectionTitle>
          <PontosInteresseHelp>
            Adicione um nome e uma descrição curta para cada local importante da cidade.
          </PontosInteresseHelp>
        </PontosInteresseHeader>
        <DataTable<PontoDeInteresse>
          data={pontosDeInteresse}
          onChange={setPontosDeInteresse}
          columns={pontosDeInteresseColumns}
          showEmptyRow
          theme={theme}
          neon={neon}
        />
        {pontosDeInteresseError && (
          <PontosInteresseError>{pontosDeInteresseError}</PontosInteresseError>
        )}
      </PontosInteresseSection>

      <DescriptionSection>
        <RichTextEditor
          theme={theme}
          neon={neon}
          label="Descrição"
          value={descricao}
          onChange={setDescricao}
          width="100%"
          minHeight="150px"
          placeholder="Descreva a cidade..."
          expandable
        />
      </DescriptionSection>

      <CheckboxSection>
        <VisibilityToggle
          label="Cidade visível"
          visible={visivel}
          onChange={setVisivel}
        />
        <FeaturedToggle featured={destaque} onChange={setDestaque} />
      </CheckboxSection>

      <ImageGalleryWithCrop
        theme={theme}
        neon={neon}
        label="Galeria de Imagens (Opcional)"
        imageUrls={galeriaUrls}
        imageShapes={galeriaShapes}
        captions={galeriaCaptions}
        onAdd={handleGaleriaUpload}
        onRemove={handleRemoveGaleriaImage}
        onCaptionChange={handleGaleriaCaptionChange}
      />

      <ButtonsContainer>
        <CyberButton
          theme={theme}
          neon={neon}
          type="button"
          onClick={handleReset}
          disabled={isSubmitting}
          colorType="secondary"
          text="Limpar"
          width="200px"
        />
        <CyberButton
          theme={theme}
          neon={neon}
          type="submit"
          loading={isSubmitting}
          text={cidadeId ? 'Atualizar Cidade' : 'Criar Cidade'}
          width="200px"
        />
      </ButtonsContainer>
      {cidadeId && (
        <EntityEditFloatingActions
          theme={theme}
          neon={neon}
          synced={isSynced}
          saving={isSubmitting}
          onSave={() => void persist(true)}
        />
      )}
    </FormController>
  );
};
