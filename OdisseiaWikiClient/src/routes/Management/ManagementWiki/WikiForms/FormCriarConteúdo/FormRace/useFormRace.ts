import { useState, useEffect } from 'react';
import { RaceFormErrors, UploadResult } from './FormRace.type';
import { RacaStatus, CreateRacaDto, createRaca, updateRaca, RacaPayload } from '../../../../../../services/racasService';
import { saveAsset } from '../../../../../../services/assetsService';
import { ATRIBUTO_OPTIONS } from '../../../../../../constants';

export const useFormRace = (initialRaca?: RacaPayload, contentType?: string) => {
  const [racaId] = useState<number | undefined>(initialRaca?.idraca);
  const [nome, setNome] = useState(initialRaca?.nome || '');
  const [imagemUrl, setImagemUrl] = useState(initialRaca?.imagem || '');
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  
  // Garantir que galeriaImagem é sempre um array
  const parseGaleriaImagem = (): string[] => {
    if (!initialRaca?.galeriaImagem) return [];
    if (typeof initialRaca.galeriaImagem === 'string') {
      try {
        return JSON.parse(initialRaca.galeriaImagem);
      } catch (e) {
        console.error('Erro ao parsear galeriaImagem:', e);
        return [];
      }
    }
    return Array.isArray(initialRaca.galeriaImagem) ? initialRaca.galeriaImagem : [];
  };
  
  // URLs existentes (do servidor) - rastreadas separadamente para não enviar BLOBs
  const [existingGaleriaUrls, setExistingGaleriaUrls] = useState<string[]>(parseGaleriaImagem());
  // Inclui URLs existentes + BLOBs temporários (para preview)
  const [galeriaUrls, setGaleriaUrls] = useState<string[]>(parseGaleriaImagem());
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
  const [galeriaShapes, setGaleriaShapes] = useState<string[]>(Array(parseGaleriaImagem().length).fill('square'));
  const [tags, setTags] = useState<string[]>(initialRaca?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [visivel, setVisivel] = useState(initialRaca?.visivel !== false);

  // Status
  const [vida, setVida] = useState(initialRaca?.statusJson?.status?.vida || 100);
  const [estamina, setEstamina] = useState(initialRaca?.statusJson?.status?.estamina || 100);
  const [mana, setMana] = useState(initialRaca?.statusJson?.status?.mana || 100);
  const [capacidadeCarga, setCapacidadeCarga] = useState(initialRaca?.statusJson?.status?.capacidadeCarga || 50);
  const [atributoInicial, setAtributoInicial] = useState(initialRaca?.statusJson?.atributoInicial || '');
  const [passivas, setPassivas] = useState<string[]>(initialRaca?.statusJson?.passivas || []);
  const [passivaInput, setPassivaInput] = useState('');

  const [errors, setErrors] = useState<RaceFormErrors>({});
  const [nomeError, setNomeError] = useState('');
  const [imagemError, setImagemError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-adiciona tag do tipo de conteúdo quando muda
  useEffect(() => {
    if (contentType && !initialRaca) {
      setTags([contentType]);
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
    setNomeError('');
    return true;
  };

  const validateImagem = (url: string, file: File | null): boolean => {
    // Em modo edição (racaId existe), imagem não é obrigatória pois já existe
    if (racaId) {
      setImagemError('');
      return true;
    }
    // Em modo criação, imagem é obrigatória
    if (!url && !file) {
      setImagemError('Imagem principal é obrigatória');
      return false;
    }
    setImagemError('');
    return true;
  };

  const validateStatus = (): boolean => {
    const newErrors: RaceFormErrors = {};
    let isValid = true;

    if (vida < 0) {
      newErrors.statusVida = 'Vida não pode ser negativa';
      isValid = false;
    }
    if (estamina < 0) {
      newErrors.statusEstamina = 'Estamina não pode ser negativa';
      isValid = false;
    }
    if (mana < 0) {
      newErrors.statusMana = 'Mana não pode ser negativa';
      isValid = false;
    }
    if (capacidadeCarga < 0) {
      newErrors.statusCapacidadeCarga = 'Capacidade de carga não pode ser negativa';
      isValid = false;
    }
    if (!atributoInicial || atributoInicial.trim() === '') {
      newErrors.atributoInicial = 'Selecione um atributo inicial';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateForm = (): boolean => {
    const isNomeValid = validateNome(nome);
    const isImagemValid = validateImagem(imagemUrl, imagemFile);
    const isStatusValid = validateStatus();

    return isNomeValid && isImagemValid && isStatusValid;
  };

  const handleNomeChange = (value: string) => {
    setNome(value);
    if (nomeError) {
      validateNome(value);
    }
  };

  const handleImagemUpload = (file: File | null) => {
    if (file === null) {
      if (imagemUrl) {
        URL.revokeObjectURL(imagemUrl);
      }
      setImagemUrl('');
      setImagemFile(null);
      validateImagem('', null);
    } else {
      const url = URL.createObjectURL(file);
      setImagemUrl(url);
      setImagemFile(file);
      validateImagem(url, file);
    }
  };

  const handleGaleriaUpload = (files: File[], shapes: string[]) => {
    setGaleriaFiles(prev => [...prev, ...files]);
    const urls = files.map(file => URL.createObjectURL(file));
    setGaleriaUrls(prev => [...prev, ...urls]);
    setGaleriaShapes(prev => [...prev, ...shapes]);
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
    
    setGaleriaUrls(prev => {
      const newUrls = prev.filter((_, i) => i !== indexToRemove);
      URL.revokeObjectURL(prev[indexToRemove]);
      return newUrls;
    });

    
    setGaleriaShapes(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags(prev => [...prev, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleAddPassiva = () => {
    const trimmedPassiva = passivaInput.trim();
    if (trimmedPassiva && !passivas.includes(trimmedPassiva)) {
      setPassivas(prev => [...prev, trimmedPassiva]);
      setPassivaInput('');
    }
  };

  const handleRemovePassiva = (passivaToRemove: string) => {
    setPassivas(prev => prev.filter(passiva => passiva !== passivaToRemove));
  };

  const uploadImages = async (): Promise<UploadResult> => {
    const result: UploadResult = {};

    try {
      // Upload imagem principal - preserva URL existente se não houver novo arquivo
      let imagemPath = imagemUrl;
      if (imagemFile) {
        const response = await saveAsset({
          imageFile: imagemFile,
          type: 'raca',
          entityName: nome,
        });
        imagemPath = response.path;
      }
      if (imagemPath) {
        result.imagemPath = imagemPath;
      }

      // Upload galeria - começa apenas com URLs existentes (do servidor), sem BLOBs temporários
      let galeriaPaths: string[] | undefined = existingGaleriaUrls.length > 0 ? [...existingGaleriaUrls] : undefined;
      
      // Adiciona novos uploads
      if (galeriaFiles.length > 0) {
        if (!galeriaPaths) {
          galeriaPaths = [];
        }
        for (const file of galeriaFiles) {
          const response = await saveAsset({
            imageFile: file,
            type: 'raca',
            entityName: nome,
            folderName: 'galeria',
          });
          galeriaPaths.push(response.path);
        }
      }
      if (galeriaPaths) {
        result.galeriaPaths = galeriaPaths;
      }

      return result;
    } catch (error) {
      console.error('Erro ao fazer upload das imagens:', error);
      throw error;
    }
  };

  const prepareDto = async (): Promise<CreateRacaDto | null> => {
    try {
      const uploadResult = await uploadImages();

      const statusJson: RacaStatus = {
        status: {
          vida,
          estamina,
          mana,
          capacidadeCarga,
        },
        atributoInicial,
        passivas,
      };

      const dto: CreateRacaDto = {
        Nome: nome,
        StatusJson: statusJson,
        Imagem: uploadResult.imagemPath || '',
        GaleriaImagem: uploadResult.galeriaPaths || [],
        Tags: tags,
        Visivel: visivel,
      };

      return dto;
    } catch (error) {
      console.error('Erro ao preparar DTO:', error);
      return null;
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!validateForm()) {
      return { success: false, message: 'Por favor, corrija os erros no formulário' };
    }

    setIsSubmitting(true);

    try {
      const dto = await prepareDto();

      if (!dto) {
        setIsSubmitting(false);
        return { success: false, message: 'Erro ao preparar dados da raça' };
      }

      const result = racaId ? await updateRaca(racaId, dto) : await createRaca(dto);

      if (result.sucesso) {
        resetForm();
        return { success: true, message: racaId ? 'Raça atualizada com sucesso!' : 'Raça criada com sucesso!' };
      } else {
        return { success: false, message: result.mensagemErro || (racaId ? 'Erro ao atualizar raça' : 'Erro ao criar raça') };
      }
    } catch (error) {
      console.error('Erro ao criar raça:', error);
      return { success: false, message: racaId ? 'Erro ao atualizar raça. Tente novamente.' : 'Erro ao criar raça. Tente novamente.' };
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNome('');
    setImagemUrl('');
    setImagemFile(null);
    setGaleriaUrls([]);
    setGaleriaFiles([]);
    setGaleriaShapes([]);
    setTags([]);
    setTagInput('');
    setVida(100);
    setEstamina(100);
    setMana(100);
    setCapacidadeCarga(50);
    setAtributoInicial('');
    setPassivas([]);
    setPassivaInput('');
    setVisivel(true);
    setErrors({});
    setNomeError('');
    setImagemError('');
  };

  return {
    racaId,
    nome,
    imagemUrl,
    imagemFile,
    galeriaUrls,
    galeriaFiles,
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
    errors,
    nomeError,
    imagemError,
    atributoOptions: ATRIBUTO_OPTIONS,
    setNome: handleNomeChange,
    setNomeError,
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
    validateForm,
    galeriaShapes,
  };
};
