import { useState } from "react";
import { ItemTipo, JSONContent } from "../../../../../../models/Itens";
import { saveAsset } from "../../../../../../services/assetsService";
import { prepareForAPI } from "../../../../../../utils/richTextHelpers";
import { salvarItem } from "../../../../../../services/itensService";

// Atributos iniciais para cada tipo
const getEmptyAtributos = (tipo: ItemTipo): any => {
  switch (tipo) {
    case "arma":
      return {
        danoPorAlcance: { curta: 0, media: 0, longa: 0 },
        municao: { capacidade: 0, atual: 0 },
        ataquesPorTurno: 1,
        bonus: [],
        especial: "",
        acerto: "1D20"
      };
    case "traje":
      return {
        armaduraBase: 0,
        protecaoBase: 0,
        escudoBase: 0,
        resistencias: [],
        penalidades: [],
        especial: ""
      };
    case "consumiveis":
      return {
        restaura: { vida: 0, estamina: 0, mana: 0 },
        duracao: ""
      };
    case "acessorio":
      return {
        bonus: [],
        slot: "",
        duracao: ""
      };
    default:
      return {
        especial: "",
        duracao: ""
      };
  }
};

export const useFormItem = () => {

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<ItemTipo>("outro");

  const [descricao, setDescricao] = useState<JSONContent | string>("");

  const [peso, setPeso] = useState<number | undefined>();
  const [quantidade, setQuantidade] = useState(1);
  const [efeito, setEfeito] = useState("");

  const [imagemUrl, setImagemUrl] = useState("");
  const [imagemFile, setImagemFile] = useState<File | null>(null);

  const [atributos, setAtributos] = useState<any>(getEmptyAtributos("outro"));

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [visivel, setVisivel] = useState(true);

  const [nomeError, setNomeError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ------------------------
  // TIPO MUDANÇA
  // ------------------------

  const handleTipoChange = (novoTipo: ItemTipo) => {
    setTipo(novoTipo);
    setAtributos(getEmptyAtributos(novoTipo));
  };

  // ------------------------
  // VALIDAÇÕES
  // ------------------------

  const validateNome = (value: string) => {

    if (!value.trim()) {
      setNomeError("Nome do item é obrigatório");
      return false;
    }

    if (value.length < 2) {
      setNomeError("Nome muito curto");
      return false;
    }

    setNomeError("");
    return true;
  };

  const validateForm = () => {
    return validateNome(nome);
  };

  // ------------------------
  // IMAGEM
  // ------------------------

  const handleImagemUpload = (file: File | null) => {

    if (!file) {
      setImagemFile(null);
      setImagemUrl("");
      return;
    }

    setImagemFile(file);
    setImagemUrl(URL.createObjectURL(file));
  };

  const uploadImage = async () => {

    if (!imagemFile) return undefined;

    const entityName = nome.toLowerCase().replace(/\s+/g, "_");

    const result = await saveAsset({
      imageFile: imagemFile,
      type: "itens",
      entityName: entityName,
    });

    return result.path;
  };

  // ------------------------
  // TAGS
  // ------------------------

  const handleAddTag = () => {

    const trimmed = tagInput.trim();

    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed]);
      setTagInput("");
    }

  };

  const handleRemoveTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  // ------------------------
  // RESET
  // ------------------------

  const resetForm = () => {

    setNome("");
    setTipo("outro");
    setDescricao("");

    setPeso(undefined);
    setQuantidade(1);
    setEfeito("");

    setImagemUrl("");
    setImagemFile(null);

    setAtributos(getEmptyAtributos("outro"));

    setTags([]);
    setTagInput("");

    setVisivel(true);
  };

  // ------------------------
  // SUBMIT
  // ------------------------

    const capitalizeFirst = (str: string) => {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

  const handleSubmit = async () => {

    if (!validateForm()) {
      return { success: false, message: "Erro de validação" };
    }

    setIsSubmitting(true);

    try {

      const imagemPath = await uploadImage();

      const dto = {
        nome: nome.trim(),
        tipo: capitalizeFirst(tipo),
        descricao: prepareForAPI(descricao),
        peso,
        quantidade,
        efeito,
        imagem: imagemPath,
        atributosJson: Object.keys(atributos).length > 0 ? atributos : undefined,
        tags: tags.length > 0 ? tags : undefined,
        visivel
      };

      const response = await salvarItem(dto);

      if (!response.sucesso) {

        setIsSubmitting(false);

        return {
          success: false,
          message: response.mensagemErro || "Erro ao criar item"
        };
      }

      resetForm();

      setIsSubmitting(false);

      return {
        success: true,
        message: "Item criado com sucesso!"
      };

    }
    catch (error: any) {

      setIsSubmitting(false);

      return {
        success: false,
        message: error.message || "Erro inesperado"
      };
    }

  };

  return {
    nome,
    setNome,
    tipo,
    setTipo: handleTipoChange,
    descricao,
    setDescricao,
    peso,
    setPeso,
    quantidade,
    setQuantidade,
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
    nomeError,
    handleSubmit,
    resetForm,
    isSubmitting
  };
};