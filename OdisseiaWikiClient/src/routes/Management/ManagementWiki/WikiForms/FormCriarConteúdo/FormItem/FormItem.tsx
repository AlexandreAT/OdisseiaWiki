import { Select } from "../../../../../../components/Generic/Select/Select";
import { CheckBox } from "../../../../../../components/Generic/CheckBox/CheckBox";
import { RichTextEditor } from "../../../../../../components/Generic/RichTextEditor/RichTextEditor";
import { ImageUploader } from "../../../../../../components/Generic/ImageUploader/ImageUploader";
import { CyberButton } from "../../../../../../components/Generic/HighlightButton/HighlightButton";
import type { CropPreset } from "../../../../../../components/Generic/ImageUploader/types";
import { InputText } from "../../../../../../components/Generic/InputText/InputText";
import { HorizontalList } from "../../../../../../components/Generic/HorizontalList/HorizontalList";
import { ItemTipo } from "../../../../../../models/Itens";
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
} from "./FormItem.style";
import { useFormItem } from "./useFormItem";
import { atributosFormMap } from "../FormCharacter/MapItensForm";
import toast from "react-hot-toast";
import { ITEM_TIPO_OPTIONS } from "../../formOptions";

interface FormItemProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  contentType?: string;
}

export const FormItem = ({ theme, neon, contentType }: FormItemProps) => {
  const {
    itemId,
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
    resetForm,
    isSubmitting,
    nomeError,
  } = useFormItem(undefined, contentType);

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
    } else {
      toast.error(result?.message || "Erro ao criar item");
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
            onChange={(e) => setNome(e.target.value)}
            theme={theme}
            neon={neon}
            error={!!nomeError}
            errorMessage={nomeError}
            required
            width="100%"
          />

          <Select
            label="Tipo*"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as ItemTipo)}
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
          onChange={(e) => setEfeito(e.target.value)}
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
          onChange={(v) => setVisivel(v)}
          neon={neon}
        />
      </CheckboxContainer>

      {/* Botões de Ação */}
      <ButtonsContainer theme={theme} neon={neon}>
        <CyberButton
          type="button"
          onClick={resetForm}
          disabled={isSubmitting}
          theme={theme}
          neon={neon}
          colorType="secondary"
          text="Limpar Formulário"
          width="200px"
        />
        <CyberButton
          type="submit"
          loading={isSubmitting}
          theme={theme}
          neon={neon}
          text={itemId ? "Atualizar Item" : "Criar Item"}
          width="200px"
        />
      </ButtonsContainer>
    </FormController>
  );
};