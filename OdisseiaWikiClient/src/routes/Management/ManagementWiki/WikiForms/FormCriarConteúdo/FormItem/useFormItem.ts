import { useState, useEffect } from "react";
import { ItemTipo, JSONContent } from "../../../../../../models/Itens";
import { saveAsset } from "../../../../../../services/assetsService";
import { prepareForAPI } from "../../../../../../utils/richTextHelpers";
import { salvarItem, ItemPayload } from "../../../../../../services/itensService";
import toast from "react-hot-toast";

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

const parseJson = <T,>(value: unknown, fallback: T): T => {
  if (value === undefined || value === null) return fallback;

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  return value as T;
};

const tryParseRichText = (value: any) => {
  let current = value;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (typeof current !== 'string') return current;

    const trimmed = current.trim();
    if (!trimmed) return current;

    const looksLikeJsonObjectOrArray =
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'));

    const looksLikeQuotedJsonString = trimmed.startsWith('"') && trimmed.endsWith('"');

    if (!looksLikeJsonObjectOrArray && !looksLikeQuotedJsonString) {
      return current;
    }

    try {
      current = JSON.parse(trimmed);
    } catch {
      return current;
    }
  }

  return current;
};

export const useFormItem = (initialItem?: ItemPayload, contentType?: string) => {

  const [itemId] = useState<string | undefined>(initialItem?.iditem);
  const [nome, setNome] = useState(initialItem?.nome || "");
  const [tipo, setTipo] = useState<ItemTipo>((initialItem?.tipo?.toLowerCase() as ItemTipo) || "outro");

  const [descricao, setDescricao] = useState<JSONContent | string>(
    initialItem?.descricao ? tryParseRichText(initialItem.descricao) : ""
  );

  const [peso, setPeso] = useState<number | undefined>(initialItem?.peso);
  const [quantidade, setQuantidade] = useState(initialItem?.quantidade || 1);
  const [efeito, setEfeito] = useState(initialItem?.efeito || "");

  const [imagemUrl, setImagemUrl] = useState(initialItem?.imagem || "");
  const [imagemFile, setImagemFile] = useState<File | null>(null);

  const [atributos, setAtributos] = useState<any>(
    initialItem?.atributosJson 
      ? parseJson(initialItem.atributosJson, getEmptyAtributos(tipo))
      : getEmptyAtributos(tipo)
  );

  const [tags, setTags] = useState<string[]>(initialItem?.tags || []);
  const [tagInput, setTagInput] = useState("");

  const [visivel, setVisivel] = useState(initialItem?.visivel !== false);

  const [nomeError, setNomeError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-adiciona tag do tipo de conteúdo quando muda
  useEffect(() => {
    if (contentType && !initialItem) {
      setTags([contentType]);
      setTagInput('');
    }
  }, [contentType, initialItem]);

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

    if (value.length < 3) {
      setNomeError("O nome deve ter 3 caracteres ou mais");
      return false;
    }

    if (imagemUrl == "") return false;

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

      let imagemPath = imagemUrl;
      
      // Apenas faz upload se houver novo arquivo
      if (imagemFile) {
        imagemPath = await uploadImage() || imagemUrl;
      }

      const dto = {
        iditem: itemId,
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

      let response;
      
      if (itemId) {
        // Modo edição
        const { atualizarItem } = await import("../../../../../../services/itensService");
        const updated = await atualizarItem(itemId, dto);
        
        if (!updated) {
          setIsSubmitting(false);
          return {
            success: false,
            message: "Erro ao atualizar item"
          };
        }
        
        resetForm();
        setIsSubmitting(false);
        
        return {
          success: true,
          message: "Item atualizado com sucesso!"
        };
      } else {
        // Modo criação
        response = await salvarItem(dto);

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
    itemId,
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
    setNomeError,
    handleSubmit,
    resetForm,
    isSubmitting
  };
};