import { Select } from "../../../../../../components/Generic/Select/Select";
import { CheckBox } from "../../../../../../components/Generic/CheckBox/CheckBox";
import { RichTextEditor } from "../../../../../../components/Generic/RichTextEditor/RichTextEditor";
import { ImageUpload } from "../../../../../../components/Generic/ImageUpload/ImageUpload";
import { CyberButton } from "../../../../../../components/Generic/HighlightButton/HighlightButton";
import { InputText } from "../../../../../../components/Generic/InputText/InputText";
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
  TagsList,
  TagItem,
  TagRemoveButton,
  TagInput,
} from "./FormItem.style";
import { useFormItem } from "./useFormItem";
import { atributosFormMap } from "../FormCharacter/MapItensForm";
import toast from "react-hot-toast";
import { MdClose } from "react-icons/md";

interface FormItemProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

const ITEM_TIPO_OPTIONS: { value: ItemTipo; label: string }[] = [
  { value: "arma", label: "Arma" },
  { value: "traje", label: "Traje" },
  { value: "consumiveis", label: "Consumível" },
  { value: "acessorio", label: "Acessório" },
  { value: "outro", label: "Outro" },
];

export const FormItem = ({ theme, neon }: FormItemProps) => {
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
    resetForm,
    isSubmitting,
    nomeError,
  } = useFormItem();

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
        <ImageUpload
          theme={theme}
          neon={neon}
          label="Imagem do Item"
          imageUrl={imagemUrl}
          onChange={handleImagemUpload}
          placeholder="Clique para adicionar uma imagem"
        />
      </ImageSection>

      {/* Seção de Tags */}
      <div>
        <SectionTitle theme={theme} neon={neon}>Tags</SectionTitle>
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
          <CyberButton
            type="button"
            onClick={handleAddTag}
            theme={theme}
            neon={neon}
            colorType="secondary"
            text="Adicionar"
            height="40px"
          />
        </TagsInputContainer>

        {tags.length > 0 && (
          <TagsList>
            {tags.map((tag) => (
              <TagItem key={tag} theme={theme} neon={neon}>
                {tag}
                <TagRemoveButton
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                >
                  <MdClose />
                </TagRemoveButton>
              </TagItem>
            ))}
          </TagsList>
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
          theme={theme}
          neon={neon}
          colorType="secondary"
          text="Limpar Formulário"
          width="160px"
        />
        <CyberButton
          type="submit"
          disabled={isSubmitting}
          theme={theme}
          neon={neon}
          colorType="primary"
          text={isSubmitting ? "Criando..." : "Criar Item"}
          width="160px"
        />
      </ButtonsContainer>
    </FormController>
  );
};