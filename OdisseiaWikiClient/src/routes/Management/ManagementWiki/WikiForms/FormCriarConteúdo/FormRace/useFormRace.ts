import { useState } from 'react';
import { RaceFormErrors, UploadResult } from './FormRace.type';
import { RacaStatus, CreateRacaDto, createRaca } from '../../../../../../services/racasService';
import { saveAsset } from '../../../../../../services/assetsService';

const ATRIBUTO_OPTIONS = [
  { value: 'Força', label: 'Força' },
  { value: 'Agilidade', label: 'Agilidade' },
  { value: 'Resistência', label: 'Resistência' },
  { value: 'Sabedoria', label: 'Sabedoria' },
  { value: 'Precisão', label: 'Precisão' },
  { value: 'Inteligência', label: 'Inteligência' },
];

export const useFormRace = () => {
  const [nome, setNome] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [galeriaUrls, setGaleriaUrls] = useState<string[]>([]);
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [visivel, setVisivel] = useState(true);

  // Status
  const [vida, setVida] = useState(100);
  const [estamina, setEstamina] = useState(100);
  const [mana, setMana] = useState(100);
  const [capacidadeCarga, setCapacidadeCarga] = useState(50);
  const [atributoInicial, setAtributoInicial] = useState('');
  const [passivas, setPassivas] = useState<string[]>([]);
  const [passivaInput, setPassivaInput] = useState('');

  const [errors, setErrors] = useState<RaceFormErrors>({});
  const [nomeError, setNomeError] = useState('');
  const [imagemError, setImagemError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleGaleriaUpload = (files: File[]) => {
    setGaleriaFiles(prev => [...prev, ...files]);
    const urls = files.map(file => URL.createObjectURL(file));
    setGaleriaUrls(prev => [...prev, ...urls]);
  };

  const handleRemoveGaleriaImage = (index: number) => {
    setGaleriaFiles(prev => prev.filter((_, i) => i !== index));
    setGaleriaUrls(prev => {
      const newUrls = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index]);
      return newUrls;
    });
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
      // Upload imagem principal
      if (imagemFile) {
        const response = await saveAsset({
          imageFile: imagemFile,
          type: 'raca',
          entityName: nome,
        });
        result.imagemPath = response.path;
      }

      // Upload galeria
      if (galeriaFiles.length > 0) {
        const galeriaPaths: string[] = [];
        for (const file of galeriaFiles) {
          const response = await saveAsset({
            imageFile: file,
            type: 'raca',
            entityName: nome,
            folderName: 'galeria',
          });
          galeriaPaths.push(response.path);
        }
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

      const result = await createRaca(dto);

      if (result.sucesso) {
        resetForm();
        return { success: true, message: 'Raça criada com sucesso!' };
      } else {
        return { success: false, message: result.mensagemErro || 'Erro ao criar raça' };
      }
    } catch (error) {
      console.error('Erro ao criar raça:', error);
      return { success: false, message: 'Erro ao criar raça. Tente novamente.' };
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
  };
};
