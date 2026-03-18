import { useState } from 'react';
import { CityFormErrors, CidadeDto } from './FormCity.type';
import { createCidade, updateCidade, CidadePayload } from '../../../../../../services/cidadesService';
import { saveAsset } from '../../../../../../services/assetsService';
import { JSONContent } from '../../../../../../models/Cities';
import { PontoDeInteresse } from '../../../../../../models/InfoLore';
import { prepareForAPI } from '../../../../../../utils/richTextHelpers';
import { infoLoresMock } from '../../../../../../Mock/infolore.mock';

export const useFormCity = (initialCity?: CidadePayload) => {
  const [cidadeId] = useState<number | undefined>(initialCity?.idcidade);
  const [nome, setNome] = useState(initialCity?.nome || '');
  const [descricao, setDescricao] = useState<JSONContent | string>(initialCity?.descricao || '');
  const [imagemUrl, setImagemUrl] = useState(initialCity?.imagem || '');
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  
  // Garantir que galeriaImagem é sempre um array
  const parseGaleriaImagem = (): string[] => {
    if (!initialCity?.galeriaImagem) return [];
    if (typeof initialCity.galeriaImagem === 'string') {
      try {
        return JSON.parse(initialCity.galeriaImagem);
      } catch (e) {
        console.error('Erro ao parsear galeriaImagem:', e);
        return [];
      }
    }
    return Array.isArray(initialCity.galeriaImagem) ? initialCity.galeriaImagem : [];
  };
  
  // URLs existentes (do servidor) - rastreadas separadamente para não enviar BLOBs
  const [existingGaleriaUrls, setExistingGaleriaUrls] = useState<string[]>(parseGaleriaImagem());
  // Inclui URLs existentes + BLOBs temporários (para preview)
  const [galeriaUrls, setGaleriaUrls] = useState<string[]>(parseGaleriaImagem());
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
  const [tags, setTags] = useState<string[]>(initialCity?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [pontosDeInteresse, setPontosDeInteresse] = useState<PontoDeInteresse[]>(initialCity?.pontosDeInteresse || []);
  const [pontoInteresseSearch, setPontoInteresseSearch] = useState('');
  const [visivel, setVisivel] = useState(initialCity?.visivel !== false);

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
    // Em modo edição (cidadeId existe), imagem não é obrigatória pois já existe
    if (cidadeId) {
      setImagemError('');
      return true;
    }
    // Em modo criação, imagem é obrigatória
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

  const handleImagemUpload = (file: File | null) => {
    if (file === null) {
      if (imagemUrl && imagemUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagemUrl);
      }
      setImagemFile(null);
      setImagemUrl('');
      if (imagemError) {
        validateImagem('', null);
      }
    } else {
      setImagemFile(file);
      const url = URL.createObjectURL(file);
      setImagemUrl(url);
      if (imagemError) {
        validateImagem(url, file);
      }
    }
  };

  const handleGaleriaUpload = (files: File[]) => {
    setGaleriaFiles(prev => [...prev, ...files]);
    const urls = files.map(file => URL.createObjectURL(file));
    setGaleriaUrls(prev => [...prev, ...urls]);
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

    // Começa apenas com as URLs existentes (do servidor), sem BLOBs temporários
    let galeriaPaths: string[] | undefined = existingGaleriaUrls.length > 0 ? [...existingGaleriaUrls] : undefined;
    
    // Adiciona novos uploads
    if (galeriaFiles.length > 0) {
      if (!galeriaPaths) {
        galeriaPaths = [];
      }
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

      resetForm();
      setIsSubmitting(false);
      
      return { 
        success: true, 
        message: cidadeId ? 'Cidade atualizada com sucesso!' : 'Cidade criada com sucesso!',
        data: response.cidade 
      };
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setIsSubmitting(false);
      const errorMessage = error?.response?.data?.mensagemErro || 
                          error?.message || 
                          (cidadeId ? 'Erro ao atualizar cidade. Tente novamente.' : 'Erro ao criar cidade. Tente novamente.');
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
