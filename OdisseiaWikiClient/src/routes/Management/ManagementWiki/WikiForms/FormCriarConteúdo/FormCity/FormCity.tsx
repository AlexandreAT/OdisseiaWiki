import React, { useRef, useEffect } from 'react';
import { useFormCity } from './useFormCity';
import { InputText } from '../../../../../../components/Generic/InputText/InputText';
import { TextArea } from '../../../../../../components/Generic/TextArea/TextArea';
import { CyberButton } from '../../../../../../components/Generic/HighlightButton/HighlightButton';
import { CheckBox } from '../../../../../../components/Generic/CheckBox/CheckBox';
import {
  FormController,
  FormHeader,
  HeaderInfo,
  ImageSection,
  MainImageContainer,
  ImagePlaceholder,
  GallerySection,
  SectionTitle,
  GalleryGrid,
  GalleryImageContainer,
  RemoveImageButton,
  AddGalleryImageButton,
  DescriptionSection,
  ButtonsContainer,
  HiddenInput,
  ErrorText,
  TagsSection,
  TagInputContainer,
  TagsList,
  TagItem,
  TagRemoveButton,
  CheckboxSection,
} from './FormCity.style';

interface FormCityProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const FormCity = ({ theme, neon }: FormCityProps) => {
  const {
    nome,
    descricao,
    imagemUrl,
    galeriaUrls,
    tags,
    tagInput,
    visivel,
    isSubmitting,
    nomeError,
    imagemError,
    setNome,
    setDescricao,
    setTagInput,
    setVisivel,
    handleImagemUpload,
    handleGaleriaUpload,
    handleRemoveGaleriaImage,
    handleAddTag,
    handleRemoveTag,
    handleSubmit,
    resetForm,
  } = useFormCity();

  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
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

  const handleMainImageClick = () => {
    mainImageInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImagemUpload(file);
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleGaleriaUpload(files);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await handleSubmit(e);
    
    if (result?.success) {
      alert(result.message);
    } else {
      alert(result?.message || 'Erro ao criar cidade');
    }
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
            width="100%"
            error={!!nomeError}
          />
          {nomeError && <ErrorText>{nomeError}</ErrorText>}
        </HeaderInfo>

        <ImageSection>
          <SectionTitle theme={theme} neon={neon}>
            Imagem Principal *
          </SectionTitle>
          <MainImageContainer 
            hasImage={!!imagemUrl} 
            onClick={handleMainImageClick}
          >
            {imagemUrl ? (
              <img src={imagemUrl} alt="Imagem principal da cidade" />
            ) : (
              <ImagePlaceholder theme={theme} neon={neon}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                  />
                </svg>
                <p>Clique para adicionar imagem</p>
              </ImagePlaceholder>
            )}
          </MainImageContainer>
          {imagemError && <ErrorText>{imagemError}</ErrorText>}
          <HiddenInput
            ref={mainImageInputRef}
            type="file"
            accept="image/*"
            onChange={handleMainImageChange}
          />
        </ImageSection>
      </FormHeader>

      <DescriptionSection>
        <TextArea
          theme={theme}
          neon={neon}
          label="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          width="100%"
          height="150px"
        />
      </DescriptionSection>

      <TagsSection>
        <SectionTitle theme={theme} neon={neon}>
          Tags (Opcional)
        </SectionTitle>
        <TagInputContainer>
          <InputText
            ref={tagInputRef}
            theme={theme}
            neon={neon}
            label=""
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            width="100%"
          />
        </TagInputContainer>
        {tags.length > 0 && (
          <TagsList>
            {tags.map((tag, index) => (
              <TagItem key={index} theme={theme} neon={neon}>
                {tag}
                <TagRemoveButton
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  title="Remover tag"
                >
                  ×
                </TagRemoveButton>
              </TagItem>
            ))}
          </TagsList>
        )}
      </TagsSection>

      <CheckboxSection>
        <CheckBox
          neon={neon}
          label="Cidade visível"
          checked={visivel}
          onChange={(checked) => setVisivel(checked)}
        />
      </CheckboxSection>

      <GallerySection>
        <SectionTitle theme={theme} neon={neon}>
          Galeria de Imagens (Opcional)
        </SectionTitle>
        <GalleryGrid>
          {galeriaUrls.map((url, index) => (
            <GalleryImageContainer key={index}>
              <img src={url} alt={`Galeria ${index + 1}`} />
              <RemoveImageButton
                theme={theme}
                neon={neon}
                type="button"
                onClick={() => handleRemoveGaleriaImage(index)}
                title="Remover imagem"
              >
                ×
              </RemoveImageButton>
            </GalleryImageContainer>
          ))}
          <AddGalleryImageButton
            theme={theme}
            neon={neon}
            type="button"
            onClick={handleGalleryClick}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 4v16m8-8H4" 
              />
            </svg>
            Adicionar
          </AddGalleryImageButton>
        </GalleryGrid>
        <HiddenInput
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleGalleryChange}
        />
      </GallerySection>

      <ButtonsContainer>
        <CyberButton
          theme={theme}
          neon={neon}
          type="button"
          onClick={resetForm}
          disabled={isSubmitting}
        >
          Limpar
        </CyberButton>
        <CyberButton
          theme={theme}
          neon={neon}
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Criando...' : 'Criar Cidade'}
        </CyberButton>
      </ButtonsContainer>
    </FormController>
  );
};
