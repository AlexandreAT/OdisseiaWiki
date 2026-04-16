import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CyberButton } from '../../../../../components/Generic/HighlightButton/HighlightButton';
import { Select } from '../../../../../components/Generic/Select/Select';
import { CheckBox } from '../../../../../components/Generic/CheckBox/CheckBox';
import { RichTextEditor } from '../../../../../components/Generic/RichTextEditor/RichTextEditor';
import { ImageUploader } from '../../../../../components/Generic/ImageUploader/ImageUploader';
import type { CropPreset } from '../../../../../components/Generic/ImageUploader/types';
import { InputText } from '../../../../../components/Generic/InputText/InputText';
import { HorizontalList } from '../../../../../components/Generic/HorizontalList/HorizontalList';
import { getItemById, excluirItem } from '../../../../../services/itensService';
import { useFormItem } from '../FormCriarConteúdo/FormItem/useFormItem';
import { ItemPayload } from '../../../../../services/itensService';
import { ItemTipo } from '../../../../../models/Itens';
import { atributosFormMap } from '../FormCriarConteúdo/FormCharacter/MapItensForm';
import {
  FormController,
  FormHeader,
  GridInputsRow,
  SectionTitle,
  AtributosSection,
  AtributosGrid,
  ButtonsContainer,
  LabelInfoBox,
  LabelStatus,
  MinimalInput,
  CheckboxContainer,
  RichTextSection,
  ImageSection,
  TagsInputContainer,
  TagInput,
} from '../FormCriarConteúdo/FormItem/FormItem.style';
import styled from 'styled-components';

const ITEM_TIPO_OPTIONS: { value: ItemTipo; label: string }[] = [
  { value: "arma", label: "Arma" },
  { value: "traje", label: "Traje" },
  { value: "consumiveis", label: "Consumível" },
  { value: "acessorio", label: "Acessório" },
  { value: "outro", label: "Outro" },
];

const EditHeader = styled.div<{ theme: 'dark' | 'light'; neon: 'on' | 'off' }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: ${props => props.theme === 'dark' ? '#1a1a1a' : '#f5f5f5'};
  border: 1px solid ${props => props.neon === 'on' ? '#00ff00' : '#333'};
  border-radius: 8px;
  margin-bottom: 20px;

  h2 {
    margin: 0;
    color: ${props => props.theme === 'dark' ? '#fff' : '#000'};
    font-size: 20px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  font-size: 18px;
`;

interface ItemEditProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  itemId: string;
  onBack: () => void;
  onSave?: () => void;
}

export const ItemEdit: React.FC<ItemEditProps> = ({ theme, neon, itemId, onBack, onSave }) => {
  const [item, setItem] = useState<ItemPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadItem = async () => {
      try {
        setIsLoading(true);
        const loadedItem = await getItemById(itemId);
        setItem(loadedItem);
        setError(null);
      } catch (err: any) {
        console.error('Erro ao carregar item:', err);
        setError('Erro ao carregar item para edição');
        toast.error('Erro ao carregar item');
      } finally {
        setIsLoading(false);
      }
    };

    loadItem();
  }, [itemId]);

  if (isLoading) {
    return (
      <LoadingContainer>
        <span>Carregando item...</span>
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <div>
        <EditHeader theme={theme} neon={neon}>
          <h2>Erro ao editar item</h2>
          <CyberButton
            type="button"
            onClick={onBack}
            theme={theme}
            neon={neon}
            colorType="secondary"
            text="Voltar"
            width="120px"
          />
        </EditHeader>
        <div style={{ padding: '20px' }}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div>
        <EditHeader theme={theme} neon={neon}>
          <h2>Item não encontrado</h2>
          <CyberButton
            type="button"
            onClick={onBack}
            theme={theme}
            neon={neon}
            colorType="secondary"
            text="Voltar"
            width="120px"
          />
        </EditHeader>
      </div>
    );
  }

  return (
    <div>
      <EditHeader theme={theme} neon={neon}>
        <h2>Editando: {item.nome}</h2>
        <CyberButton
          type="button"
          onClick={onBack}
          theme={theme}
          neon={neon}
          colorType="secondary"
          text="Voltar"
          width="120px"
        />
      </EditHeader>
      <ItemEditFormComponent
        theme={theme}
        neon={neon}
        initialItem={item}
        onBack={onBack}
        onSave={onSave}
      />
    </div>
  );
};

interface ItemEditFormComponentProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  initialItem: ItemPayload;
  onBack: () => void;
  onSave?: () => void;
}

const ItemEditFormComponent: React.FC<ItemEditFormComponentProps> = ({
  theme,
  neon,
  initialItem,
  onBack,
  onSave
}) => {
  const {
    nome,
    setNome,
    tipo,
    setTipo,
    descricao,
    setDescricao,
    quantidade,
    setQuantidade,
    peso,
    setPeso,
    efeito,
    setEfeito,
    imagemUrl,
    handleImagemUpload,
    atributos,
    setAtributos,
    tags,
    tagInput,
    setTagInput,
    handleAddTag,
    handleRemoveTag,
    visivel,
    setVisivel,
    handleSubmit,
    isSubmitting,
    nomeError,
  } = useFormItem(initialItem);

  const itemImageCropPreset: CropPreset = {
    mode: 'single',
    aspectRatio: 1,
    shape: 'square',
    displayShape: 'square',
    label: 'Quadrado (1:1)',
  };

  const handleItemImageUpload = (result: any) => {
    handleImagemUpload(result.file);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await handleSubmit();

    if (result?.success) {
      toast.success(result.message);
      if (onSave) {
        onSave();
      }
      onBack();
    } else {
      toast.error(result?.message || 'Erro ao atualizar item');
    }
  };

  const handleDelete = async () => {
    if (!initialItem.iditem) return;

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o item "${initialItem.nome}"? Esta ação não pode ser desfeita.`
    );

    if (confirmed) {
      try {
        await excluirItem(initialItem.iditem);
        toast.success('Item excluído com sucesso');
        if (onSave) {
          onSave();
        }
        onBack();
      } catch (error: any) {
        toast.error('Erro ao excluir item');
        console.error('Erro ao excluir:', error);
      }
    }
  };

  const AtributosForm = atributosFormMap[tipo];

  return (
    <FormController theme={theme} neon={neon} onSubmit={onSubmit}>
      <FormHeader theme={theme} neon={neon}>
        <SectionTitle theme={theme} neon={neon}>Dados Básicos</SectionTitle>

        <GridInputsRow>
          <InputText
            label="Nome do Item*"
            value={nome}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNome(e.target.value)}
            theme={theme}
            neon={neon}
            error={!!nomeError}
            errorMessage={nomeError}
          />

          <Select
            label="Tipo*"
            value={tipo}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTipo(e.target.value as ItemTipo)}
            theme={theme}
            neon={neon}
            options={ITEM_TIPO_OPTIONS}
            width="100%"
          />
        </GridInputsRow>

        <GridInputsRow>
          <LabelInfoBox theme={theme} neon={neon}>
            <LabelStatus>Quantidade</LabelStatus>
            <MinimalInput 
              value={quantidade} 
              onChange={(e) => setQuantidade(Number(e.target.value))}
            />
          </LabelInfoBox>

          <LabelInfoBox theme={theme} neon={neon}>
            <LabelStatus>Peso (kg)</LabelStatus>
            <MinimalInput 
              value={peso || ""} 
              onChange={(e) => setPeso(Number(e.target.value) || undefined)}
            />
          </LabelInfoBox>
        </GridInputsRow>

        <InputText
          label="Efeito"
          value={efeito}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEfeito(e.target.value)}
          theme={theme}
          neon={neon}
        />
      </FormHeader>

      {/* Seção de Atributos Dinâmicos */}
      {AtributosForm && (
        <AtributosSection theme={theme} neon={neon}>
          <SectionTitle theme={theme} neon={neon}>Atributos do {ITEM_TIPO_OPTIONS.find(o => o.value === tipo)?.label}</SectionTitle>
          <AtributosGrid>
            <AtributosForm
              value={atributos}
              onChange={setAtributos}
              theme={theme}
              neon={neon}
            />
          </AtributosGrid>
        </AtributosSection>
      )}

      {/* Seção de Descrição */}
      <RichTextSection>
        <SectionTitle theme={theme} neon={neon}>Descrição</SectionTitle>
        <RichTextEditor
          label=""
          value={descricao}
          onChange={setDescricao}
          theme={theme}
          neon={neon}
          placeholder="Descreva os detalhes do item..."
          minHeight="200px"
          fullWidth
        />
      </RichTextSection>

      {/* Seção de Imagem */}
      <ImageSection>
        <SectionTitle theme={theme} neon={neon}>Imagem</SectionTitle>
        <ImageUploader
          theme={theme}
          neon={neon}
          label="Imagem do Item"
          initialImage={imagemUrl}
          onImageCropped={handleItemImageUpload}
          cropPreset={itemImageCropPreset}
        />
      </ImageSection>

      {/* Seção de Tags */}
      <div>
        <SectionTitle theme={theme} neon={neon}>Tags (Opcional)</SectionTitle>
        <TagsInputContainer>
          <TagInput
            theme={theme}
            neon={neon}
            type="text"
            value={tagInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
            placeholder="Digite uma tag e pressione Enter"
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTag();
              }
            }}
          />
        </TagsInputContainer>

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
      </div>

      {/* Seção de Visibilidade */}
      <CheckboxContainer>
        <CheckBox
          label="Item visível"
          checked={visivel}
          onChange={(v: boolean) => setVisivel(v)}
          neon={neon}
        />
      </CheckboxContainer>

      {/* Botões de Ação */}
      <ButtonsContainer theme={theme} neon={neon}>
        <CyberButton
          type="button"
          onClick={handleDelete}
          theme={theme}
          neon={neon}
          colorType="secondary"
          text="Excluir Item"
          width="160px"
        />
        <CyberButton
          type="submit"
          disabled={isSubmitting}
          theme={theme}
          neon={neon}
          colorType="primary"
          text={isSubmitting ? "Atualizando..." : "Atualizar Item"}
          width="160px"
        />
      </ButtonsContainer>
    </FormController>
  );
};
