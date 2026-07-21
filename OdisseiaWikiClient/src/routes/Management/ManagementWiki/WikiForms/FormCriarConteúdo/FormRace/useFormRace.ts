import { useEffect, useRef, useState } from 'react';
import { RaceFormErrors, UploadResult } from './FormRace.type';
import {
  CreateRacaDto,
  createRaca,
  normalizeRacaStatus,
  normalizeRacaVariacoes,
  RacaPassiva,
  RacaPayload,
  RacaStatus,
  RacaVariacao,
  updateRaca,
} from '../../../../../../services/racasService';
import { saveAsset } from '../../../../../../services/assetsService';
import { ATRIBUTO_OPTIONS } from '../../../../../../constants';
import { ensureContentCategoryTag, isContentCategoryTag } from '../../../../../../utils/contentCategoryTag';
import { normalizeGalleryImages } from '../../../../../../models/GalleryImage';
import { JSONContent } from '../../../../../../models/Cities';
import { createEmptyJSONContent, prepareForAPI } from '../../../../../../utils/richTextHelpers';
import { getApiErrorMessage } from '../../../../../../utils/apiError';

const normalizePassivas = (passivas: RacaPassiva[]): RacaPassiva[] => (
  passivas.flatMap((passiva) => {
    const nome = passiva.nome?.trim() ?? '';
    const efeito = passiva.efeito?.trim() ?? '';
    if (!nome && !efeito) return [];

    return [{ nome, ...(efeito ? { efeito } : {}) }];
  })
);

const normalizeVariacoes = (variacoes: RacaVariacao[]): RacaVariacao[] => (
  variacoes.flatMap((variacao) => {
    const nome = variacao.nome?.trim() ?? '';
    const descricao = variacao.descricao?.trim() ?? '';
    const efeito = variacao.efeito?.trim() ?? '';
    const imagem = variacao.imagem?.trim() ?? '';
    if (!nome && !descricao && !efeito && !imagem) return [];

    return [{
      nome,
      ...(descricao ? { descricao } : {}),
      ...(efeito ? { efeito } : {}),
      ...(imagem ? { imagem } : {}),
    }];
  })
);

export const useFormRace = (initialRaca?: RacaPayload, contentType?: string) => {
  const lastValidationErrorsRef = useRef<string[]>([]);
  const normalizedInitialStatus = normalizeRacaStatus(initialRaca?.statusJson);
  const legacyVariations = (initialRaca as (RacaPayload & { Variantes?: unknown }) | undefined)?.Variantes;
  const initialVariations = normalizeRacaVariacoes(initialRaca?.variacoes ?? legacyVariations);
  const parsedGaleria = normalizeGalleryImages(initialRaca?.galeriaImagem);

  const [racaId] = useState<number | undefined>(initialRaca?.idraca);
  const [nome, setNome] = useState(initialRaca?.nome || '');
  const [descricao, setDescricao] = useState<JSONContent | string>(initialRaca?.descricao || '');
  const [imagemUrl, setImagemUrl] = useState(initialRaca?.imagem || '');
  const [imagemFile, setImagemFile] = useState<File | null>(null);

  const [existingGaleriaUrls, setExistingGaleriaUrls] = useState<string[]>(parsedGaleria.map(image => image.url));
  const [galeriaUrls, setGaleriaUrls] = useState<string[]>(parsedGaleria.map(image => image.url));
  const [galeriaCaptions, setGaleriaCaptions] = useState<string[]>(parsedGaleria.map(image => image.legenda || ''));
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
  const [galeriaShapes, setGaleriaShapes] = useState<string[]>(Array(parsedGaleria.length).fill('square'));
  const [tags, setTags] = useState<string[]>(initialRaca?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [visivel, setVisivel] = useState(initialRaca?.visivel !== false);
  const [destaque, setDestaque] = useState(initialRaca?.destaque === true);

  const [vida, setVida] = useState(normalizedInitialStatus?.status.vida ?? 100);
  const [estamina, setEstamina] = useState(normalizedInitialStatus?.status.estamina ?? 100);
  const [mana, setMana] = useState(normalizedInitialStatus?.status.mana ?? 100);
  const [capacidadeCarga, setCapacidadeCarga] = useState(normalizedInitialStatus?.status.capacidadeCarga ?? 50);
  const [atributoInicial, setAtributoInicial] = useState(normalizedInitialStatus?.atributoInicial || '');
  const [passivas, setPassivas] = useState<RacaPassiva[]>(normalizedInitialStatus?.passivas || []);
  const [variacoes, setVariacoes] = useState<RacaVariacao[]>(initialVariations);

  const [errors, setErrors] = useState<RaceFormErrors>({});
  const [nomeError, setNomeError] = useState('');
  const [passivasError, setPassivasError] = useState('');
  const [variacoesError, setVariacoesError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (contentType) {
      setTags(previousTags => ensureContentCategoryTag(previousTags, contentType));
      setTagInput('');
    }
  }, [contentType, initialRaca]);

  const validateNome = (value: string): boolean => {
    if (!value || value.trim().length === 0) {
      setNomeError('Nome é obrigatório');
      return false;
    }
    if (value.trim().length < 3) {
      setNomeError('Nome deve ter pelo menos 3 caracteres');
      return false;
    }
    if (value.trim().length > 100) {
      setNomeError('Nome deve ter no máximo 100 caracteres');
      return false;
    }
    setNomeError('');
    return true;
  };

  const validateStatus = (): boolean => {
    const newErrors: RaceFormErrors = {};

    if (vida < 0) newErrors.statusVida = 'Vida não pode ser negativa';
    if (estamina < 0) newErrors.statusEstamina = 'Estamina não pode ser negativa';
    if (mana < 0) newErrors.statusMana = 'Mana não pode ser negativa';
    if (capacidadeCarga < 0) newErrors.statusCapacidadeCarga = 'Capacidade de carga não pode ser negativa';
    if (!atributoInicial.trim()) newErrors.atributoInicial = 'Selecione um atributo inicial';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateTables = (): { passiveError: string; variationError: string } => {
    const passiveError = passivas.reduce<string>((currentError, passiva, index) => {
      if (currentError) return currentError;
      const passiveName = passiva.nome?.trim() ?? '';
      const passiveEffect = passiva.efeito?.trim() ?? '';
      if (!passiveName && passiveEffect) return `Passiva ${index + 1}: informe o nome da habilidade.`;
      if (passiveName.length > 100) return `Passiva ${index + 1}: o nome deve ter no máximo 100 caracteres.`;
      if (passiveEffect.length > 2000) return `Passiva ${index + 1}: o efeito deve ter no máximo 2.000 caracteres.`;
      return '';
    }, '');

    const variationError = variacoes.reduce<string>((currentError, variacao, index) => {
      if (currentError) return currentError;
      const variationName = variacao.nome?.trim() ?? '';
      const variationDescription = variacao.descricao?.trim() ?? '';
      const variationEffect = variacao.efeito?.trim() ?? '';
      const variationImage = variacao.imagem?.trim() ?? '';
      if (!variationName && (variationDescription || variationEffect || variationImage)) {
        return `Variação ${index + 1}: informe o nome da variação preenchida.`;
      }
      if (variationName.length > 100) return `Variação ${index + 1}: o nome deve ter no máximo 100 caracteres.`;
      if (variationDescription.length > 500) return `Variação ${index + 1}: a descrição deve ter no máximo 500 caracteres.`;
      if (variationEffect.length > 500) return `Variação ${index + 1}: o efeito deve ter no máximo 500 caracteres.`;
      return '';
    }, '');

    setPassivasError(passiveError);
    setVariacoesError(variationError);
    return { passiveError, variationError };
  };

  const validateForm = (): boolean => {
    const isNameValid = validateNome(nome);
    const isStatusValid = validateStatus();
    const { passiveError, variationError } = validateTables();
    const validationErrors = [
      ...(!isNameValid ? ['Revise o nome da raça.'] : []),
      ...(!isStatusValid ? ['Revise os status base e o atributo inicial.'] : []),
      ...(passiveError ? [passiveError] : []),
      ...(variationError ? [variationError] : []),
    ];
    lastValidationErrorsRef.current = validationErrors;
    return validationErrors.length === 0;
  };

  const handleNomeChange = (value: string) => {
    setNome(value);
    if (nomeError) validateNome(value);
  };

  const handleAtributoInicialChange = (value: string) => {
    setAtributoInicial(value);
    if (errors.atributoInicial) {
      setErrors(previous => ({ ...previous, atributoInicial: undefined }));
    }
  };

  const handleImagemUpload = (file: File | null) => {
    if (imagemUrl.startsWith('blob:')) URL.revokeObjectURL(imagemUrl);
    if (!file) {
      setImagemUrl('');
      setImagemFile(null);
      return;
    }

    setImagemUrl(URL.createObjectURL(file));
    setImagemFile(file);
  };

  const handleGaleriaUpload = (files: File[], shapes: string[]) => {
    setGaleriaFiles(previous => [...previous, ...files]);
    setGaleriaUrls(previous => [...previous, ...files.map(file => URL.createObjectURL(file))]);
    setGaleriaShapes(previous => [...previous, ...shapes]);
    setGaleriaCaptions(previous => [...previous, ...files.map(() => '')]);
  };

  const handleRemoveGaleriaImage = (indexToRemove: number) => {
    const existingCount = existingGaleriaUrls.length;
    if (indexToRemove < existingCount) {
      setExistingGaleriaUrls(previous => previous.filter((_, index) => index !== indexToRemove));
    } else {
      const fileIndex = indexToRemove - existingCount;
      setGaleriaFiles(previous => previous.filter((_, index) => index !== fileIndex));
    }

    setGaleriaUrls(previous => {
      const removedUrl = previous[indexToRemove];
      if (removedUrl?.startsWith('blob:')) URL.revokeObjectURL(removedUrl);
      return previous.filter((_, index) => index !== indexToRemove);
    });
    setGaleriaShapes(previous => previous.filter((_, index) => index !== indexToRemove));
    setGaleriaCaptions(previous => previous.filter((_, index) => index !== indexToRemove));
  };

  const handleGaleriaCaptionChange = (index: number, caption: string) => {
    setGaleriaCaptions(previous => previous.map((value, itemIndex) => itemIndex === index ? caption : value));
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags(previous => [...previous, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (isContentCategoryTag(tagToRemove, contentType)) return;
    setTags(previous => previous.filter(tag => tag !== tagToRemove));
  };

  const updatePassivas = (values: RacaPassiva[]) => {
    setPassivas(values);
    if (passivasError) setPassivasError('');
  };

  const updateVariacoes = (values: RacaVariacao[]) => {
    setVariacoes(values);
    if (variacoesError) setVariacoesError('');
  };

  const uploadImages = async (): Promise<UploadResult> => {
    let imagemPath = imagemUrl;
    if (imagemFile) {
      const response = await saveAsset({ imageFile: imagemFile, type: 'raca', entityName: nome });
      imagemPath = response.path;
    }

    const galeriaPaths: string[] = [...existingGaleriaUrls];
    for (const file of galeriaFiles) {
      const response = await saveAsset({
        imageFile: file,
        type: 'raca',
        entityName: nome,
        folderName: 'galeria',
      });
      galeriaPaths.push(response.path);
    }

    return {
      imagemPath: imagemPath || undefined,
      galeriaPaths: galeriaPaths.map((url, index) => ({
        url,
        legenda: galeriaCaptions[index]?.trim() || undefined,
      })),
    };
  };

  const uploadVariationImages = async (
    values: RacaVariacao[],
    imageFiles: ReadonlyMap<string, File>,
  ): Promise<RacaVariacao[]> => Promise.all(values.map(async (variacao) => {
    const imageFile = variacao.imagem ? imageFiles.get(variacao.imagem) : undefined;
    if (!imageFile) return variacao;

    const response = await saveAsset({
      imageFile,
      type: 'raca',
      entityName: nome,
      folderName: 'variacoes',
    });
    return { ...variacao, imagem: response.path };
  }));

  const prepareDto = async (
    variationImageFiles: ReadonlyMap<string, File>,
  ): Promise<CreateRacaDto | null> => {
    if (!validateForm()) return null;

    const uploadResult = await uploadImages();
    const normalizedVariations = normalizeVariacoes(variacoes);
    const uploadedVariations = await uploadVariationImages(normalizedVariations, variationImageFiles);
    const statusJson: RacaStatus = {
      status: { vida, estamina, mana, capacidadeCarga },
      atributoInicial,
      passivas: normalizePassivas(passivas),
    };

    return {
      Nome: nome.trim(),
      StatusJson: statusJson,
      Descricao: prepareForAPI(descricao) ?? createEmptyJSONContent(),
      Imagem: uploadResult.imagemPath || '',
      GaleriaImagem: uploadResult.galeriaPaths || [],
      Variacoes: uploadedVariations,
      Tags: ensureContentCategoryTag(tags, contentType),
      Visivel: visivel,
      Destaque: destaque,
    };
  };

  const handleSubmit = async (
    e?: React.FormEvent,
    variationImageFiles: ReadonlyMap<string, File> = new Map(),
  ) => {
    e?.preventDefault();
    setIsSubmitting(true);

    try {
      const dto = await prepareDto(variationImageFiles);
      if (!dto) {
        return {
          success: false,
          message: `Não foi possível salvar: ${lastValidationErrorsRef.current.join(' ')}`,
        };
      }

      const result = racaId ? await updateRaca(racaId, dto) : await createRaca(dto);
      if (!result.sucesso) {
        return { success: false, message: result.mensagemErro || (racaId ? 'Erro ao atualizar raça' : 'Erro ao criar raça') };
      }

      if (!racaId) resetForm();
      return {
        success: true,
        message: racaId ? 'Raça atualizada com sucesso!' : 'Raça criada com sucesso!',
        data: result.raca,
      };
    } catch (error: unknown) {
      console.error('Erro ao salvar raça:', error);
      return {
        success: false,
        message: getApiErrorMessage(
          error,
          racaId ? 'Erro ao atualizar raça. Tente novamente.' : 'Erro ao criar raça. Tente novamente.',
        ),
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    if (imagemUrl.startsWith('blob:')) URL.revokeObjectURL(imagemUrl);
    galeriaUrls.filter(url => url.startsWith('blob:')).forEach(url => URL.revokeObjectURL(url));
    setNome('');
    setDescricao('');
    setImagemUrl('');
    setImagemFile(null);
    setExistingGaleriaUrls([]);
    setGaleriaUrls([]);
    setGaleriaFiles([]);
    setGaleriaShapes([]);
    setGaleriaCaptions([]);
    setTags(contentType ? [contentType] : []);
    setTagInput('');
    setVida(100);
    setEstamina(100);
    setMana(100);
    setCapacidadeCarga(50);
    setAtributoInicial('');
    setPassivas([]);
    setVariacoes([]);
    setVisivel(true);
    setDestaque(false);
    setErrors({});
    setNomeError('');
    setPassivasError('');
    setVariacoesError('');
  };

  return {
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
    errors,
    nomeError,
    passivasError,
    variacoesError,
    atributoOptions: ATRIBUTO_OPTIONS,
    setNome: handleNomeChange,
    setNomeError,
    setDescricao,
    setTagInput,
    setVisivel,
    setDestaque,
    setVida,
    setEstamina,
    setMana,
    setCapacidadeCarga,
    setAtributoInicial: handleAtributoInicialChange,
    setPassivas: updatePassivas,
    setVariacoes: updateVariacoes,
    handleImagemUpload,
    handleGaleriaUpload,
    handleRemoveGaleriaImage,
    handleGaleriaCaptionChange,
    handleAddTag,
    handleRemoveTag,
    handleSubmit,
    resetForm,
    validateForm,
  };
};
