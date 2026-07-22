import { useState, useEffect } from "react";
import { ItemTipo, JSONContent } from "../../../../../../models/Itens";
import { saveAsset } from "../../../../../../services/assetsService";
import { prepareForAPI } from "../../../../../../utils/richTextHelpers";
import { salvarItem, ItemPayload } from "../../../../../../services/itensService";
import { ensureContentCategoryTag, isContentCategoryTag } from '../../../../../../utils/contentCategoryTag';

// Atributos iniciais para cada tipo
const getEmptyAtributos = (tipo: ItemTipo): any => {
  switch (tipo) {
    case "arma":
      return {
        tipoArma: undefined,
        tipoDano: undefined,
        danoBase: 0,
        danoPorAlcance: { curta: 0, media: 0, longa: 0, emArea: 0, preciso: 0 },
        cadencia: 1,
        capacidadeUso: 0,
        capacidadeMunicao: 0,
        gastoEstaminaPorAtaque: 0,
        acerto: "",
        duracaoEfeito: "",
        bonus: [],
        especial: "",
        efeito: ""
      };
    case "traje":
      return {
        tipoTraje: undefined,
        armaduraBase: 0,
        protecaoBase: 0,
        escudoBase: 0,
        resistencias: [],
        penalidades: [],
        especial: "",
        efeito: ""
      };
    case "consumiveis":
      return {
        restaura: { vida: 0, estamina: 0, mana: 0 },
        duracao: "",
        especial: "",
        efeito: ""
      };
    case "acessorio":
      return {
        bonus: [],
        slot: "",
        duracao: "",
        efeito: ""
      };
    case "implante":
      return {
        parteCorpo: undefined,
        lado: undefined,
        material: undefined,
        modelo: "",
        slotsModificacao: 0,
        slotsLacrima: 0,
        necessitaAmputacao: false,
        bonus: {},
        especiais: [],
        modificacoes: [],
        lacrimas: [],
        efeito: "",
      };
    default:
      return {
        especial: "",
        duracao: "",
        efeito: ""
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
  const [discricao, setDiscricao] = useState<number>(initialItem?.discricao ?? 0);
  const [quantidade, setQuantidade] = useState(initialItem?.quantidade || 1);

  const [imagemUrl, setImagemUrl] = useState(initialItem?.imagem || "");
  const [imagemFile, setImagemFile] = useState<File | null>(null);

  const [atributos, setAtributos] = useState<any>(() => {
    const parsedAttributes = initialItem?.atributosJson
      ? parseJson(initialItem.atributosJson, getEmptyAtributos(tipo))
      : getEmptyAtributos(tipo);

    return {
      ...parsedAttributes,
      efeito: parsedAttributes?.efeito ?? initialItem?.efeito ?? '',
    };
  });

  const [tags, setTags] = useState<string[]>(initialItem?.tags || []);
  const [tagInput, setTagInput] = useState("");

  const [visivel, setVisivel] = useState(initialItem?.visivel !== false);
  const [destaque, setDestaque] = useState(initialItem?.destaque === true);

  const [nomeError, setNomeError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-adiciona tag do tipo de conteúdo quando muda
  useEffect(() => {
    if (contentType) {
      setTags(previousTags => ensureContentCategoryTag(previousTags, contentType));
      setTagInput('');
    }
  }, [contentType, initialItem]);

  // ------------------------
  // TIPO MUDANÇA
  // ------------------------

  const handleTipoChange = (novoTipo: ItemTipo) => {
    setTipo(novoTipo);
    setAtributos((currentAttributes: Record<string, unknown>) => ({
      ...getEmptyAtributos(novoTipo),
      efeito: currentAttributes?.efeito ?? '',
    }));
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

    if (value.trim().length > 100) {
      setNomeError("O nome deve ter no máximo 100 caracteres");
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
    if (isContentCategoryTag(tag, contentType)) return;
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
    setDiscricao(0);
    setQuantidade(1);
    setImagemUrl("");
    setImagemFile(null);

    setAtributos(getEmptyAtributos("outro"));

    setTags(contentType ? [contentType] : []);
    setTagInput("");

    setVisivel(true);
    setDestaque(false);
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
      return {
        success: false,
        message: !nome.trim()
          ? "Não foi possível salvar: o nome do item é obrigatório."
          : nome.trim().length < 3
            ? "Não foi possível salvar: o nome do item deve ter pelo menos 3 caracteres."
            : "Não foi possível salvar: o nome do item deve ter no máximo 100 caracteres.",
      };
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
        discricao,
        quantidade,
        efeito: undefined,
        imagem: imagemPath,
        atributosJson: Object.keys(atributos).length > 0 ? atributos : undefined,
        tags: ensureContentCategoryTag(tags, contentType),
        visivel,
        destaque
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
    discricao,
    setDiscricao,
    quantidade,
    setQuantidade,
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
    destaque,
    setDestaque,
    nomeError,
    setNomeError,
    handleSubmit,
    resetForm,
    isSubmitting
  };
};
