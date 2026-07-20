import { useState, useEffect } from 'react';
import { CityFormErrors, CidadeDto } from './FormCity.type';
import { createCidade, updateCidade, CidadePayload } from '../../../../../../services/cidadesService';
import { saveAsset } from '../../../../../../services/assetsService';
import { getApiErrorMessage } from '../../../../../../utils/apiError';
import { GalleryImage, normalizeGalleryImages } from '../../../../../../models/GalleryImage';
import { JSONContent, PontoDeInteresse } from '../../../../../../models/Cities';
import { prepareForAPI } from '../../../../../../utils/richTextHelpers';
import { ensureContentCategoryTag, isContentCategoryTag } from '../../../../../../utils/contentCategoryTag';
import { detectImageShapeFromUrl, ImageDisplayShape } from '../../../../../../utils/imageDisplayShape';

const isKnownImageShape = (shape?: string): shape is ImageDisplayShape => (
  shape === 'circle' || shape === 'square' || shape === 'rectangle'
);

const normalizePontosDeInteresse = (points: PontoDeInteresse[]): PontoDeInteresse[] => (
  points.flatMap((point) => {
    const nome = point.nome?.trim() ?? '';
    const descricao = point.descricao?.trim() ?? '';
    const imagem = point.imagem?.trim() ?? '';

    if (!nome && !descricao && !imagem) return [];

    return [{
      nome,
      ...(descricao ? { descricao } : {}),
      ...(imagem ? { imagem } : {}),
    }];
  })
);

export const useFormCity = (initialCity?: CidadePayload, contentType?: string) => {
  const [cidadeId] = useState<number | undefined>(initialCity?.idcidade);
  const [nome, setNome] = useState(initialCity?.nome || '');
  const [descricao, setDescricao] = useState<JSONContent | string>(initialCity?.descricao || '');
  const [imagemUrl, setImagemUrl] = useState(initialCity?.imagem || '');
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  
  // Garantir que galeriaImagem é sempre um array
  const parsedGaleria = normalizeGalleryImages(initialCity?.galeriaImagem);
  
  // URLs existentes (do servidor) - rastreadas separadamente para não enviar BLOBs
  const [existingGaleriaUrls, setExistingGaleriaUrls] = useState<string[]>(parsedGaleria.map(image => image.url));
  // Inclui URLs existentes + BLOBs temporários (para preview)
  const [galeriaUrls, setGaleriaUrls] = useState<string[]>(parsedGaleria.map(image => image.url));
  const [galeriaCaptions, setGaleriaCaptions] = useState<string[]>(parsedGaleria.map(image => image.legenda || ''));
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
  const [galeriaShapes, setGaleriaShapes] = useState<string[]>(Array(parsedGaleria.length).fill('auto'));
  const [tags, setTags] = useState<string[]>(initialCity?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [pontosDeInteresse, setPontosDeInteresse] = useState<PontoDeInteresse[]>(initialCity?.pontosDeInteresse || []);
  const [visivel, setVisivel] = useState(initialCity?.visivel !== false);
  const [destaque, setDestaque] = useState(initialCity?.destaque === true);

  const [errors, setErrors] = useState<CityFormErrors>({});
  const [nomeError, setNomeError] = useState('');
  const [pontosDeInteresseError, setPontosDeInteresseError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all(galeriaUrls.map(detectImageShapeFromUrl)).then((detectedShapes) => {
      if (!active) return;

      setGaleriaShapes((currentShapes) => detectedShapes.map((detectedShape, index) => (
        isKnownImageShape(currentShapes[index]) ? currentShapes[index] : detectedShape
      )));
    });

    return () => {
      active = false;
    };
  }, [galeriaUrls]);

  // Auto-adiciona tag do tipo de conteúdo quando muda
  useEffect(() => {
    if (contentType) {
      setTags(previousTags => ensureContentCategoryTag(previousTags, contentType));
      setTagInput('');
    }
  }, [contentType, initialCity]);

  const validateNome = (value: string): boolean => {
    if (!value || value.trim().length === 0) {
      setNomeError('O nome da cidade é obrigatório');
      return false;
    }
    if (value.trim().length < 3) {
      setNomeError('O nome deve ter no mínimo 3 caracteres');
      return false;
    }
    setNomeError('');
    return true;
  };

  const validateForm = (): boolean => {
    const isNomeValid = validateNome(nome);
    const pointError = pontosDeInteresse.reduce<string>((currentError, point) => {
      if (currentError) return currentError;

      const pointName = point.nome?.trim() ?? '';
      const pointDescription = point.descricao?.trim() ?? '';
      const pointImage = point.imagem?.trim() ?? '';

      if (!pointName && (pointDescription || pointImage)) {
        return 'Informe o nome dos pontos de interesse que possuem descrição ou imagem.';
      }
      if (pointName.length > 100) {
        return 'O nome do ponto de interesse deve ter no máximo 100 caracteres.';
      }
      if (pointDescription.length > 300) {
        return 'A descrição do ponto de interesse deve ter no máximo 300 caracteres.';
      }

      return '';
    }, '');

    setPontosDeInteresseError(pointError);

    const newErrors: CityFormErrors = {};
    if (!isNomeValid) newErrors.nome = nomeError;

    setErrors(newErrors);
    return isNomeValid && !pointError;
  };

  const handleNomeChange = (value: string) => {
    setNome(value);
    if (nomeError) {
      validateNome(value);
    }
  };

  const handleImagemUpload = (file: File | null) => {
    if (file === null) {
      if (imagemUrl && imagemUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagemUrl);
      }
      setImagemFile(null);
      setImagemUrl('');
    } else {
      setImagemFile(file);
      const url = URL.createObjectURL(file);
      setImagemUrl(url);
    }
  };

  const handleGaleriaUpload = (files: File[], shapes: string[]) => {
    setGaleriaFiles(prev => [...prev, ...files]);
    const urls = files.map(file => URL.createObjectURL(file));
    setGaleriaUrls(prev => [...prev, ...urls]);
    setGaleriaShapes(prev => [...prev, ...shapes]);
    setGaleriaCaptions(prev => [...prev, ...files.map(() => '')]);
  };

  const handleRemoveGaleriaImage = (indexToRemove: number) => {
    // Número de URLs existentes do servidor
    const existingCount = existingGaleriaUrls.length;
    
    if (indexToRemove < existingCount) {
      // Remover de URLs existentes
      setExistingGaleriaUrls(prev => prev.filter((_, i) => i !== indexToRemove));
    } else {
      // Remover de arquivos novos (galeriaFiles)
      const fileIndex = indexToRemove - existingCount;
      setGaleriaFiles(prev => prev.filter((_, i) => i !== fileIndex));
    }
    
    setGaleriaUrls(prev => prev.filter((_, i) => i !== indexToRemove));
    setGaleriaShapes(prev => prev.filter((_, i) => i !== indexToRemove));
    setGaleriaCaptions(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleGaleriaCaptionChange = (index: number, caption: string) => {
    setGaleriaCaptions(previous => previous.map((value, itemIndex) => itemIndex === index ? caption : value));
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags(prev => [...prev, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (isContentCategoryTag(tagToRemove, contentType)) return;
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const updatePontosDeInteresse = (points: PontoDeInteresse[]) => {
    setPontosDeInteresse(points);
    if (pontosDeInteresseError) setPontosDeInteresseError('');
  };

  const resetForm = () => {
    setNome('');
    setDescricao('');
    setImagemUrl('');
    setImagemFile(null);
    setGaleriaUrls([]);
    setGaleriaFiles([]);
    setGaleriaShapes([]);
    setGaleriaCaptions([]);
    setExistingGaleriaUrls([]);
    setTags(contentType ? [contentType] : []);
    setTagInput('');
    setPontosDeInteresse([]);
    setVisivel(true);
    setDestaque(false);
    setErrors({});
    setNomeError('');
  };

  const uploadImages = async (): Promise<{ imagemPath: string; galeriaPaths: GalleryImage[] }> => {
    const entityName = nome.toLowerCase().replace(/\s+/g, '_');
    
    let imagemPath = imagemUrl;
    if (imagemFile) {
      const result = await saveAsset({
        imageFile: imagemFile,
        type: 'cidades',
        entityName: entityName,
      });
      imagemPath = result.path;
    }

    // Começa apenas com as URLs existentes (do servidor), sem BLOBs temporários
    const galeriaPaths: string[] = [...existingGaleriaUrls];
    
    // Adiciona novos uploads
    if (galeriaFiles.length > 0) {
      for (const file of galeriaFiles) {
        const result = await saveAsset({
          imageFile: file,
          type: 'cidades',
          entityName: entityName,
          folderName: 'galeria',
        });
        galeriaPaths.push(result.path);
      }
    }

    return {
      imagemPath,
      galeriaPaths: galeriaPaths.map((url, index) => ({
        url,
        legenda: galeriaCaptions[index]?.trim() || undefined,
      })),
    };
  };

  const uploadPointImages = async (
    points: PontoDeInteresse[],
    imageFiles: ReadonlyMap<string, File>,
  ): Promise<PontoDeInteresse[]> => {
    const entityName = nome.toLowerCase().replace(/\s+/g, '_');

    return Promise.all(points.map(async (point) => {
      const imageFile = point.imagem ? imageFiles.get(point.imagem) : undefined;
      if (!imageFile) return point;

      const result = await saveAsset({
        imageFile,
        type: 'cidades',
        entityName,
        folderName: 'pontos-de-interesse',
      });

      return { ...point, imagem: result.path };
    }));
  };

  const prepareDto = async (
    pointImageFiles: ReadonlyMap<string, File>,
  ): Promise<CidadeDto | null> => {
    if (!validateForm()) {
      return null;
    }

    const { imagemPath, galeriaPaths } = await uploadImages();
    const normalizedPoints = normalizePontosDeInteresse(pontosDeInteresse);
    const uploadedPoints = await uploadPointImages(normalizedPoints, pointImageFiles);

    const dto: CidadeDto = {
      Nome: nome.trim(),
      Descricao: prepareForAPI(descricao),
      Imagem: imagemPath,
      GaleriaImagem: galeriaPaths,
      Tags: ensureContentCategoryTag(tags, contentType),
      PontosDeInteresse: uploadedPoints,
      Visivel: visivel,
      Destaque: destaque,
    };

    return dto;
  };

  const handleSubmit = async (
    e?: React.FormEvent,
    pointImageFiles: ReadonlyMap<string, File> = new Map(),
  ) => {
    if (e) {
      e.preventDefault();
    }

    setIsSubmitting(true);

    try {
      const dto = await prepareDto(pointImageFiles);
      
      if (!dto) {
        setIsSubmitting(false);
        return { success: false, message: 'Erro na validação do formulário' };
      }

      let response;
      if (cidadeId) {
        response = await updateCidade(cidadeId, dto);
      } else {
        response = await createCidade(dto);
      }

      if (!response.sucesso) {
        setIsSubmitting(false);
        return { 
          success: false, 
          message: response.mensagemErro || (cidadeId ? 'Erro ao atualizar cidade.' : 'Erro ao criar cidade.') 
        };
      }

      if (!cidadeId) {
        resetForm();
      }
      setIsSubmitting(false);
      
      return { 
        success: true, 
        message: cidadeId ? 'Cidade atualizada com sucesso!' : 'Cidade criada com sucesso!',
        data: response.cidade 
      };
    } catch (error: unknown) {
      console.error('Error submitting form:', error);
      setIsSubmitting(false);
      const errorMessage = getApiErrorMessage(
        error,
        cidadeId ? 'Erro ao atualizar cidade. Tente novamente.' : 'Erro ao criar cidade. Tente novamente.'
      );
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  };

  return {
    cidadeId,
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
    pontosDeInteresse,
    pontosDeInteresseError,
    visivel,
    destaque,
    
    isSubmitting,
    errors,
    nomeError,
    
    setNome: handleNomeChange,
    setNomeError,
    setDescricao,
    setTagInput,
    setPontosDeInteresse: updatePontosDeInteresse,
    setVisivel,
    setDestaque,
    handleImagemUpload,
    handleGaleriaUpload,
    handleRemoveGaleriaImage,
    handleGaleriaCaptionChange,
    handleAddTag,
    handleRemoveTag,
    handleTagInputKeyDown,
    handleSubmit,
    resetForm,
    validateForm,
  };
};
