import React, { useRef, useEffect } from 'react';
import { useFormCity } from './useFormCity';
import { InputText } from '../../../../../../components/Generic/InputText/InputText';
import { RichTextEditor } from '../../../../../../components/Generic/RichTextEditor/RichTextEditor';
import { CyberButton } from '../../../../../../components/Generic/HighlightButton/HighlightButton';
import { CheckBox } from '../../../../../../components/Generic/CheckBox/CheckBox';
import { ImageUpload } from '../../../../../../components/Generic/ImageUpload/ImageUpload';
import { ImageGallery } from '../../../../../../components/Generic/ImageGallery/ImageGallery';
import { HorizontalList } from '../../../../../../components/Generic/HorizontalList/HorizontalList';
import {
  FormController,
  FormHeader,
  HeaderInfo,
  ImageSection,
  DescriptionSection,
  ButtonsContainer,
  ErrorText,
  TagsSection,
  CheckboxSection,
  PontosInteresseSection,
  PontosInteresseInputContainer,
  InfoLoresList,
  InfoLoreItem,
} from './FormCity.style';

interface FormCityProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  initialCity?: import('../../../../../../services/cidadesService').CidadePayload;
  onSaveSuccess?: () => void;
}

export const FormCity = ({ theme, neon, initialCity, onSaveSuccess }: FormCityProps) => {
  const {
    cidadeId,
    nome,
    descricao,
    imagemUrl,
    galeriaUrls,
    tags,
    tagInput,
    pontosDeInteresse,
    pontoInteresseSearch,
    visivel,
    isSubmitting,
    nomeError,
    imagemError,
    setNome,
    setDescricao,
    setTagInput,
    setPontoInteresseSearch,
    setVisivel,
    handleImagemUpload,
    handleGaleriaUpload,
    handleRemoveGaleriaImage,
    handleAddTag,
    handleRemoveTag,
    handleAddPontoInteresse,
    handleRemovePontoInteresse,
    getFilteredInfoLores,
    handleSubmit,
    resetForm,
  } = useFormCity(initialCity);

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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await handleSubmit(e);
    
    if (result?.success) {
      alert(result.message);
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } else {
      alert(result?.message || 'Erro ao salvar cidade');
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
            onDelete={(id) => {
              const tagToRemove = tags[id as number];
              if (tagToRemove) {
                handleRemoveTag(tagToRemove);
              }
            }}
          />
        )}
      </TagsSection>

      <PontosInteresseSection>
        <PontosInteresseInputContainer>
          <InputText
            theme={theme}
            neon={neon}
            label="Buscar InfoLore"
            value={pontoInteresseSearch}
            onChange={(e) => setPontoInteresseSearch(e.target.value)}
            width="100%"
          />
          {pontoInteresseSearch && getFilteredInfoLores().length > 0 && (
            <InfoLoresList>
              {getFilteredInfoLores().map((infoLore) => (
                <InfoLoreItem
                  key={infoLore.IdinfoLore}
                  theme={theme}
                  neon={neon}
                  type="button"
                  onClick={() => handleAddPontoInteresse(infoLore.IdinfoLore)}
                  disabled={pontosDeInteresse.some(p => p.id === infoLore.IdinfoLore)}
                >
                  {infoLore.Titulo}
                </InfoLoreItem>
              ))}
            </InfoLoresList>
          )}
        </PontosInteresseInputContainer>
        {pontosDeInteresse.length > 0 && (
          <HorizontalList
            theme={theme}
            neon={neon}
            data={pontosDeInteresse.map((ponto) => ({ id: ponto.id, nome: ponto.titulo }))}
            onDelete={(id) => handleRemovePontoInteresse(id as number)}
          />
        )}
      </PontosInteresseSection>
        </HeaderInfo>

        <ImageSection>
          <ImageUpload
            theme={theme}
            neon={neon}
            label="Imagem Principal"
            imageUrl={imagemUrl}
            onChange={handleImagemUpload}
            error={!!imagemError}
            errorMessage={imagemError}
            width="300px"
            height="300px"
            required
            showRemoveButton
          />
        </ImageSection>
      </FormHeader>

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
        />
      </DescriptionSection>

      <CheckboxSection>
        <CheckBox
          neon={neon}
          label="Cidade visível"
          checked={visivel}
          onChange={(checked) => setVisivel(checked)}
        />
      </CheckboxSection>

      <ImageGallery
        theme={theme}
        neon={neon}
        label="Galeria de Imagens (Opcional)"
        imageUrls={galeriaUrls}
        onAdd={handleGaleriaUpload}
        onRemove={handleRemoveGaleriaImage}
      />

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
          {isSubmitting ? 'Salvando...' : cidadeId ? 'Atualizar Cidade' : 'Criar Cidade'}
        </CyberButton>
      </ButtonsContainer>
    </FormController>
  );
};
