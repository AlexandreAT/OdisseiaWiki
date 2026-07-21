import React, { useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { InputText } from '../../../../../../components/Generic/InputText/InputText';
import { Select } from '../../../../../../components/Generic/Select/Select';
import { VisibilityToggle } from '../../../../../../components/Generic/VisibilityToggle';
import { FeaturedToggle } from '../../../../../../components/Generic/FeaturedToggle';
import { ImageUploader } from '../../../../../../components/Generic/ImageUploader/ImageUploader';
import type { CropPreset, CropResult } from '../../../../../../components/Generic/ImageUploader/types';
import { HorizontalList } from '../../../../../../components/Generic/HorizontalList/HorizontalList';
import { CyberButton } from '../../../../../../components/Generic/HighlightButton/HighlightButton';
import { RichTextEditor } from '../../../../../../components/Generic/RichTextEditor/RichTextEditor';
import { DataTable } from '../../../../../../components/Generic/DataTable/DataTable';
import { ImageGalleryWithCrop } from '../../../../../../components/Generic/ImageGallery/ImageGalleryWithCrop';
import { EntityEditFloatingActions } from '../../FormBuscarConteúdo/EntityEditFloatingActions';
import { normalizeImagePath } from '../../../../../Wiki/utils/imagePathHelper';
import { RacaPassiva, RacaVariacao } from '../../../../../../services/racasService';
import { useFormRace } from './useFormRace';
import {
  FormController,
  FormHeader,
  HeaderInfo,
  ImageSection,
  StatusSection,
  StatusTitle,
  StatusGrid,
  TagsSection,
  CheckboxSection,
  ButtonsContainer,
  ContentSection,
  SectionHeader,
  SectionHelp,
  VariationImageCell,
} from './FormRace.style';

interface FormRaceProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  initialRaca?: import('../../../../../../services/racasService').RacaPayload;
  onSaveSuccess?: (options: { stayOnPage: boolean }) => void | Promise<void>;
  contentType?: string;
}

const RACE_IMAGE_CROP_PRESET: CropPreset = {
  mode: 'single',
  aspectRatio: 1,
  shape: 'square',
  displayShape: 'square',
  label: 'Quadrado (1:1)',
};

export const FormRace: React.FC<FormRaceProps> = ({ theme, neon, initialRaca, onSaveSuccess, contentType }) => {
  const variationImageFilesRef = useRef<Map<string, File>>(new Map());
  const persistInFlightRef = useRef(false);
  const {
    racaId,
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
    visivel,
    destaque,
    vida,
    estamina,
    mana,
    capacidadeCarga,
    atributoInicial,
    passivas,
    variacoes,
    isSubmitting,
    nomeError,
    passivasError,
    variacoesError,
    errors,
    atributoOptions,
    setNome,
    setNomeError,
    setDescricao,
    setTagInput,
    setVisivel,
    setDestaque,
    setVida,
    setEstamina,
    setMana,
    setCapacidadeCarga,
    setAtributoInicial,
    setPassivas,
    setVariacoes,
    handleImagemUpload,
    handleGaleriaUpload,
    handleRemoveGaleriaImage,
    handleGaleriaCaptionChange,
    handleAddTag,
    handleRemoveTag,
    handleSubmit,
    resetForm,
  } = useFormRace(initialRaca, contentType);

  const passiveColumns = useMemo(() => [
    { key: 'nome' as const, label: 'Nome', width: '35%', inputType: 'text' as const, maxLength: 100 },
    { key: 'efeito' as const, label: 'Efeito', width: '65%', inputType: 'text' as const, maxLength: 2000 },
  ], []);

  const variationColumns = useMemo(() => [
    {
      key: 'imagem' as const,
      label: 'Imagem',
      width: '17%',
      customRender: (
        value: unknown,
        _row: RacaVariacao,
        onChange: (value: string) => void,
      ) => {
        const currentImage = typeof value === 'string' ? value : '';

        return (
          <VariationImageCell>
            <ImageUploader
              theme={theme}
              neon={neon}
              initialImage={normalizeImagePath(currentImage)}
              cropPreset={RACE_IMAGE_CROP_PRESET}
              mobileSize="compact"
              onImageCropped={(result: CropResult) => {
                if (currentImage) variationImageFilesRef.current.delete(currentImage);
                variationImageFilesRef.current.set(result.preview, result.file);
                onChange(result.preview);
              }}
              onRemove={() => {
                if (currentImage) variationImageFilesRef.current.delete(currentImage);
                onChange('');
              }}
            />
          </VariationImageCell>
        );
      },
    },
    { key: 'nome' as const, label: 'Nome', width: '20%', inputType: 'text' as const, maxLength: 100 },
    { key: 'descricao' as const, label: 'Descrição', width: '31%', inputType: 'text' as const, maxLength: 500 },
    { key: 'efeito' as const, label: 'Efeito', width: '32%', inputType: 'text' as const, maxLength: 500 },
  ], [theme, neon]);

  const tagInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const input = tagInputRef.current;
    if (!input) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
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
    visivel,
    destaque,
    vida,
    estamina,
    mana,
    capacidadeCarga,
    atributoInicial,
    passivas,
    variacoes,
  }), [
    nome, descricao, imagemUrl, imagemFile, galeriaUrls, galeriaFiles, galeriaCaptions,
    tags, visivel, destaque, vida, estamina, mana, capacidadeCarga, atributoInicial,
    passivas, variacoes,
  ]);
  const [lastSavedSnapshot, setLastSavedSnapshot] = React.useState(snapshot);
  const isSynced = snapshot === lastSavedSnapshot;

  const persist = async (stayOnPage: boolean, event?: React.FormEvent) => {
    event?.preventDefault();
    if (persistInFlightRef.current) return;
    persistInFlightRef.current = true;

    try {
      const result = await handleSubmit(event, variationImageFilesRef.current);
      if (result?.success) {
        toast.success(result.message);
        setLastSavedSnapshot(snapshot);
        await onSaveSuccess?.({ stayOnPage });
      } else {
        toast.error(result?.message || 'Erro ao salvar raça');
      }
    } finally {
      persistInFlightRef.current = false;
    }
  };

  const handleReset = () => {
    variationImageFilesRef.current.clear();
    resetForm();
  };

  return (
    <FormController onSubmit={(event) => void persist(false, event)}>
      <FormHeader>
        <HeaderInfo>
          <InputText
            theme={theme}
            neon={neon}
            label="Nome da Raça *"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
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
              onChange={(event) => setTagInput(event.target.value)}
              width="100%"
            />
            {tags.length > 0 && (
              <HorizontalList
                theme={theme}
                neon={neon}
                data={tags.map((tag, index) => ({ id: index, nome: tag }))}
                canDelete={(item) => !contentType || item.nome.localeCompare(contentType, undefined, { sensitivity: 'accent' }) !== 0}
                onDelete={(id) => {
                  const tag = tags[id as number];
                  if (tag) handleRemoveTag(tag);
                }}
              />
            )}
          </TagsSection>
        </HeaderInfo>
      </FormHeader>

      <ImageSection>
        <StatusTitle theme={theme} neon={neon}>Imagem principal</StatusTitle>
        <ImageUploader
          theme={theme}
          neon={neon}
          label="Imagem da Raça"
          initialImage={imagemUrl}
          onImageCropped={(result: CropResult) => handleImagemUpload(result.file)}
          cropPreset={RACE_IMAGE_CROP_PRESET}
          mobileSize="main"
        />
      </ImageSection>

      <ContentSection>
        <RichTextEditor
          theme={theme}
          neon={neon}
          label="Descrição"
          value={descricao}
          onChange={setDescricao}
          width="100%"
          minHeight="180px"
          placeholder="Descreva a raça..."
          expandable
        />
      </ContentSection>

      <StatusSection theme={theme} neon={neon}>
        <StatusTitle theme={theme} neon={neon}>Status base</StatusTitle>
        <StatusGrid>
          <InputText theme={theme} neon={neon} label="Vida" type="number" value={vida.toString()} onChange={(event) => setVida(Number(event.target.value))} width="100%" error={!!errors.statusVida} errorMessage={errors.statusVida} required />
          <InputText theme={theme} neon={neon} label="Estamina" type="number" value={estamina.toString()} onChange={(event) => setEstamina(Number(event.target.value))} width="100%" error={!!errors.statusEstamina} errorMessage={errors.statusEstamina} required />
          <InputText theme={theme} neon={neon} label="Mana" type="number" value={mana.toString()} onChange={(event) => setMana(Number(event.target.value))} width="100%" error={!!errors.statusMana} errorMessage={errors.statusMana} required />
          <InputText theme={theme} neon={neon} label="Capacidade de Carga" type="number" value={capacidadeCarga.toString()} onChange={(event) => setCapacidadeCarga(Number(event.target.value))} width="100%" error={!!errors.statusCapacidadeCarga} errorMessage={errors.statusCapacidadeCarga} required />
        </StatusGrid>
        <Select
          theme={theme}
          neon={neon}
          label="Atributo Inicial *"
          options={atributoOptions}
          value={atributoInicial}
          onChange={(event) => setAtributoInicial(event.target.value)}
          width="100%"
          error={!!errors.atributoInicial}
          errorMessage={errors.atributoInicial}
          required
        />
      </StatusSection>

      <ContentSection>
        <SectionHeader>
          <StatusTitle theme={theme} neon={neon}>Habilidades passivas</StatusTitle>
          <SectionHelp>Cadastre o nome da habilidade e o efeito concedido por ela.</SectionHelp>
        </SectionHeader>
        <DataTable<RacaPassiva>
          data={passivas}
          onChange={setPassivas}
          columns={passiveColumns}
          showEmptyRow
          theme={theme}
          neon={neon}
          error={!!passivasError}
          errorMessage={passivasError}
        />
      </ContentSection>

      <ContentSection>
        <SectionHeader>
          <StatusTitle theme={theme} neon={neon}>Variações</StatusTitle>
          <SectionHelp>A imagem é opcional e sempre utiliza recorte quadrado, como a imagem principal da raça.</SectionHelp>
        </SectionHeader>
        <DataTable<RacaVariacao>
          data={variacoes}
          onChange={setVariacoes}
          columns={variationColumns}
          showEmptyRow
          theme={theme}
          neon={neon}
          error={!!variacoesError}
          errorMessage={variacoesError}
        />
      </ContentSection>

      <CheckboxSection>
        <VisibilityToggle label="Raça visível" visible={visivel} onChange={setVisivel} />
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
        <CyberButton theme={theme} neon={neon} type="button" onClick={handleReset} disabled={isSubmitting} colorType="secondary" text="Limpar" width="200px" />
        <CyberButton theme={theme} neon={neon} type="submit" loading={isSubmitting} text={racaId ? 'Atualizar Raça' : 'Criar Raça'} width="200px" />
      </ButtonsContainer>
      {racaId && (
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
