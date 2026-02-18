import React, { useRef, useEffect } from 'react';
import { InputText } from '../../../../../../components/Generic/InputText/InputText';
import { Select } from '../../../../../../components/Generic/Select/Select';
import { CheckBox } from '../../../../../../components/Generic/CheckBox/CheckBox';
import { ImageUpload } from '../../../../../../components/Generic/ImageUpload/ImageUpload';
import { ImageGallery } from '../../../../../../components/Generic/ImageGallery/ImageGallery';
import { HorizontalList } from '../../../../../../components/Generic/HorizontalList/HorizontalList';
import { CyberButton } from '../../../../../../components/Generic/HighlightButton/HighlightButton';
import { useFormRace } from './useFormRace';
import {
  FormController,
  FormHeader,
  HeaderInfo,
  ImageSection,
  StatusSection,
  StatusTitle,
  StatusGrid,
  PassivasSection,
  PassivasList,
  PassivaItem,
  PassivaText,
  DeleteButton,
  AddPassivaContainer,
  TagsSection,
  CheckboxSection,
  ButtonsContainer,
  ErrorText,
} from './FormRace.style';

interface FormRaceProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const FormRace: React.FC<FormRaceProps> = ({ theme, neon }) => {
  const {
    nome,
    imagemUrl,
    galeriaUrls,
    tags,
    tagInput,
    visivel,
    vida,
    estamina,
    mana,
    capacidadeCarga,
    atributoInicial,
    passivas,
    passivaInput,
    isSubmitting,
    nomeError,
    imagemError,
    errors,
    atributoOptions,
    setNome,
    setTagInput,
    setPassivaInput,
    setVisivel,
    setVida,
    setEstamina,
    setMana,
    setCapacidadeCarga,
    setAtributoInicial,
    handleImagemUpload,
    handleGaleriaUpload,
    handleRemoveGaleriaImage,
    handleAddTag,
    handleRemoveTag,
    handleAddPassiva,
    handleRemovePassiva,
    handleSubmit,
    resetForm,
  } = useFormRace();

  const tagInputRef = useRef<HTMLInputElement>(null);
  const passivaInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    const input = passivaInputRef.current;
    if (!input) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddPassiva();
      }
    };

    input.addEventListener('keydown', handleKeyDown);
    return () => input.removeEventListener('keydown', handleKeyDown);
  }, [handleAddPassiva]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await handleSubmit(e);

    if (result?.success) {
      alert(result.message);
    } else {
      alert(result?.message || 'Erro ao criar raça');
    }
  };

  return (
    <FormController onSubmit={onSubmit}>
      <FormHeader>
        <HeaderInfo>
          <InputText
            theme={theme}
            neon={neon}
            label="Nome da Raça *"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            width="100%"
            error={!!nomeError}
          />
          {nomeError && <ErrorText theme={theme} neon={neon}>{nomeError}</ErrorText>}

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
                  const tagIndex = id as number;
                  const tag = tags[tagIndex];
                  handleRemoveTag(tag);
                }}
              />
            )}
          </TagsSection>
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

      <StatusSection theme={theme} neon={neon}>
        <StatusTitle theme={theme} neon={neon}>Status Base</StatusTitle>
        
        <StatusGrid>
          <InputText
            theme={theme}
            neon={neon}
            label="Vida *"
            type="number"
            value={vida.toString()}
            onChange={(e) => setVida(Number(e.target.value))}
            width="100%"
            error={!!errors.statusVida}
          />
          {errors.statusVida && <ErrorText theme={theme} neon={neon}>{errors.statusVida}</ErrorText>}

          <InputText
            theme={theme}
            neon={neon}
            label="Estamina *"
            type="number"
            value={estamina.toString()}
            onChange={(e) => setEstamina(Number(e.target.value))}
            width="100%"
            error={!!errors.statusEstamina}
          />
          {errors.statusEstamina && <ErrorText theme={theme} neon={neon}>{errors.statusEstamina}</ErrorText>}

          <InputText
            theme={theme}
            neon={neon}
            label="Mana *"
            type="number"
            value={mana.toString()}
            onChange={(e) => setMana(Number(e.target.value))}
            width="100%"
            error={!!errors.statusMana}
          />
          {errors.statusMana && <ErrorText theme={theme} neon={neon}>{errors.statusMana}</ErrorText>}

          <InputText
            theme={theme}
            neon={neon}
            label="Capacidade de Carga *"
            type="number"
            value={capacidadeCarga.toString()}
            onChange={(e) => setCapacidadeCarga(Number(e.target.value))}
            width="100%"
            error={!!errors.statusCapacidadeCarga}
          />
          {errors.statusCapacidadeCarga && <ErrorText theme={theme} neon={neon}>{errors.statusCapacidadeCarga}</ErrorText>}
        </StatusGrid>

        <Select
          theme={theme}
          neon={neon}
          label="Atributo Inicial *"
          options={atributoOptions}
          value={atributoInicial}
          onChange={(e) => setAtributoInicial(e.target.value)}
          width="100%"
        />
        {errors.atributoInicial && <ErrorText theme={theme} neon={neon}>{errors.atributoInicial}</ErrorText>}

        <PassivasSection>
          <StatusTitle theme={theme} neon={neon}>Habilidades Passivas</StatusTitle>
          
          <AddPassivaContainer>
            <InputText
              ref={passivaInputRef}
              theme={theme}
              neon={neon}
              label="Adicionar passiva"
              value={passivaInput}
              onChange={(e) => setPassivaInput(e.target.value)}
              width="100%"
            />
            <CyberButton
              theme={theme}
              neon={neon}
              type="button"
              onClick={handleAddPassiva}
            >
              Adicionar
            </CyberButton>
          </AddPassivaContainer>

          {passivas.length > 0 && (
            <PassivasList theme={theme} neon={neon}>
              {passivas.map((passiva, index) => (
                <PassivaItem key={index} theme={theme} neon={neon}>
                  <PassivaText>{passiva}</PassivaText>
                  <DeleteButton
                    theme={theme}
                    neon={neon}
                    type="button"
                    onClick={() => handleRemovePassiva(passiva)}
                  >
                    Remover
                  </DeleteButton>
                </PassivaItem>
              ))}
            </PassivasList>
          )}
        </PassivasSection>
      </StatusSection>

      <CheckboxSection>
        <CheckBox
          neon={neon}
          label="Raça visível"
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
          {isSubmitting ? 'Criando...' : 'Criar Raça'}
        </CyberButton>
      </ButtonsContainer>
    </FormController>
  );
};
