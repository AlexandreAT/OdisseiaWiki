import { useState } from 'react';
import { CityFormErrors, CidadeDto } from './FormCity.type';
import { createCidade } from '../../../../../../services/cidadesService';
import { saveAsset } from '../../../../../../services/assetsService';
import { JSONContent } from '../../../../../../models/Cities';
import { PontoDeInteresse } from '../../../../../../models/InfoLore';
import { prepareForAPI } from '../../../../../../utils/richTextHelpers';
import { infoLoresMock } from '../../../../../../Mock/infolore.mock';

export const useFormCity = () => {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState<JSONContent | string>('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [galeriaUrls, setGaleriaUrls] = useState<string[]>([]);
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [pontosDeInteresse, setPontosDeInteresse] = useState<PontoDeInteresse[]>([]);
  const [pontoInteresseSearch, setPontoInteresseSearch] = useState('');
  const [visivel, setVisivel] = useState(true);

  const [errors, setErrors] = useState<CityFormErrors>({});
  const [nomeError, setNomeError] = useState('');
  const [imagemError, setImagemError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const validateImagem = (url: string, file: File | null): boolean => {
    if (!url && !file) {
      setImagemError('A imagem principal é obrigatória');
      return false;
    }
    setImagemError('');
    return true;
  };

  const validateForm = (): boolean => {
    const isNomeValid = validateNome(nome);
    const isImagemValid = validateImagem(imagemUrl, imagemFile);

    const newErrors: CityFormErrors = {};
    if (!isNomeValid) newErrors.nome = nomeError;
    if (!isImagemValid) newErrors.imagem = imagemError;

    setErrors(newErrors);
    return isNomeValid && isImagemValid;
  };

  const handleNomeChange = (value: string) => {
    setNome(value);
    if (nomeError) {
      validateNome(value);
    }
  };

  const handleImagemUpload = (file: File) => {
    setImagemFile(file);
    const url = URL.createObjectURL(file);
    setImagemUrl(url);
    if (imagemError) {
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
    setGaleriaUrls(prev => prev.filter((_, i) => i !== index));
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

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const getFilteredInfoLores = () => {
    if (!pontoInteresseSearch.trim()) {
      return infoLoresMock;
    }
    return infoLoresMock.filter(info => 
      info.Titulo.toLowerCase().includes(pontoInteresseSearch.toLowerCase())
    );
  };

  const handleAddPontoInteresse = (infoLoreId: number) => {
    const infoLore = infoLoresMock.find(info => info.IdinfoLore === infoLoreId);
    if (!infoLore) return;

    const alreadyAdded = pontosDeInteresse.some(p => p.id === infoLoreId);
    if (alreadyAdded) return;

    const novoPonto: PontoDeInteresse = {
      id: infoLore.IdinfoLore,
      titulo: infoLore.Titulo
    };

    setPontosDeInteresse(prev => [...prev, novoPonto]);
    setPontoInteresseSearch('');
  };

  const handleRemovePontoInteresse = (pontoId: number) => {
    setPontosDeInteresse(prev => prev.filter(p => p.id !== pontoId));
  };

  const resetForm = () => {
    setNome('');
    setDescricao('');
    setImagemUrl('');
    setImagemFile(null);
    setGaleriaUrls([]);
    setGaleriaFiles([]);
    setTags([]);
    setTagInput('');
    setPontosDeInteresse([]);
    setPontoInteresseSearch('');
    setVisivel(true);
    setErrors({});
    setNomeError('');
    setImagemError('');
  };

  const uploadImages = async (): Promise<{ imagemPath: string; galeriaPaths?: string[] }> => {
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

    let galeriaPaths: string[] | undefined = undefined;
    if (galeriaFiles.length > 0) {
      galeriaPaths = [];
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

    return { imagemPath, galeriaPaths };
  };

  const prepareDto = async (): Promise<CidadeDto | null> => {
    if (!validateForm()) {
      return null;
    }

    const { imagemPath, galeriaPaths } = await uploadImages();

    const dto: CidadeDto = {
      Nome: nome.trim(),
      Descricao: prepareForAPI(descricao),
      Imagem: imagemPath,
      GaleriaImagem: galeriaPaths,
      Tags: tags.length > 0 ? tags : undefined,
      PontosDeInteresse: pontosDeInteresse.length > 0 ? pontosDeInteresse : undefined,
      Visivel: visivel,
    };

    return dto;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    setIsSubmitting(true);

    try {
      const dto = await prepareDto();
      
      if (!dto) {
        setIsSubmitting(false);
        return { success: false, message: 'Erro na validação do formulário' };
      }

      console.log('DTO to be sent:', dto);
      
      const response = await createCidade(dto);

      if (!response.sucesso) {
        setIsSubmitting(false);
        return { 
          success: false, 
          message: response.mensagemErro || 'Erro ao criar cidade.' 
        };
      }

      resetForm();
      setIsSubmitting(false);
      
      return { 
        success: true, 
        message: 'Cidade criada com sucesso!',
        data: response.cidade 
      };
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setIsSubmitting(false);
      const errorMessage = error?.response?.data?.mensagemErro || 
                          error?.message || 
                          'Erro ao criar cidade. Tente novamente.';
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  };

  return {
    nome,
    descricao,
    imagemUrl,
    imagemFile,
    galeriaUrls,
    galeriaFiles,
    tags,
    tagInput,
    pontosDeInteresse,
    pontoInteresseSearch,
    visivel,
    
    isSubmitting,
    errors,
    nomeError,
    imagemError,
    
    setNome: handleNomeChange,
    setDescricao,
    setTagInput,
    setPontoInteresseSearch,
    setVisivel,
    handleImagemUpload,
    handleGaleriaUpload,
    handleRemoveGaleriaImage,
    handleAddTag,
    handleRemoveTag,
    handleTagInputKeyDown,
    handleAddPontoInteresse,
    handleRemovePontoInteresse,
    getFilteredInfoLores,
    handleSubmit,
    resetForm,
    validateForm,
  };
};
