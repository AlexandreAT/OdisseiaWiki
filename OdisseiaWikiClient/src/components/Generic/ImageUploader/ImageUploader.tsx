import React, { useRef, useState, useEffect } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { ImageCropperModal } from './ImageCropperModal';
import { ImageUploaderProps, CropResult } from './types';
import {
  UploaderController,
  UploaderLabel,
  ImageContainer,
  ImagePlaceholder,
  HiddenInput,
  ErrorText,
  RemoveImageButton,
  EditButton,
} from './ImageUploader.style';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/'];

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  theme,
  neon,
  cropPreset,
  onImageCropped,
  initialImage,
  onCancel,
  accept = 'image/*',
  label,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | undefined>(initialImage);
  const [croppingImageUrl, setCroppingImageUrl] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdObjectUrls, setCreatedObjectUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      createdObjectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [createdObjectUrls]);

  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem válido');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Imagem muito grande. Máximo 10MB');
      return false;
    }

    return true;
  };

  const handleContainerClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) return;

    setError(null);

    const url = URL.createObjectURL(file);
    setCroppingImageUrl(url);
    setCreatedObjectUrls((prev) => new Set(prev).add(url));
    setIsCropperOpen(true);

    // Limpar input
    e.target.value = '';
  };
  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageUrl(undefined);
    createdObjectUrls.forEach((url) => URL.revokeObjectURL(url));
    setCreatedObjectUrls(new Set());
    setCroppingImageUrl(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleEditImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!imageUrl) return;

    setCroppingImageUrl(imageUrl);
    setIsCropperOpen(true);
  };

  const handleCropConfirm = (result: CropResult) => {
    setImageUrl(result.preview);
    setIsCropperOpen(false);
    setCroppingImageUrl(null);
    onImageCropped(result);
  };

  const cleanupSessionUrl = (url: string | null) => {
    if (!url || !createdObjectUrls.has(url)) return;

    URL.revokeObjectURL(url);
    setCreatedObjectUrls((prev) => {
      const updated = new Set(prev);
      updated.delete(url);
      return updated;
    });
  };

  const handleCropCancel = () => {
    setIsCropperOpen(false);
    cleanupSessionUrl(croppingImageUrl);
    setCroppingImageUrl(null);
    onCancel?.();
  };

  const getAspectRatio = (): number | undefined => {
    return typeof cropPreset.aspectRatio === 'number' ? cropPreset.aspectRatio : undefined;
  };

  return (
    <UploaderController width="100%">
      {label && (
        <UploaderLabel theme={theme} neon={neon}>
          {label}
        </UploaderLabel>
      )}

      <ImageContainer
        theme={theme}
        neon={neon}
        hasImage={!!imageUrl}
        aspectRatio={getAspectRatio()}
        shape={cropPreset.shape}
        onClick={handleContainerClick}
      >
        {imageUrl ? (
          <>
            <img src={imageUrl} alt={label || 'Imagem selecionada'} />
            <RemoveImageButton
              theme={theme}
              neon={neon}
              type="button"
              onClick={handleRemoveImage}
              title="Remover imagem"
            >
              <CloseIcon className="icon" />
            </RemoveImageButton>
            <EditButton
              theme={theme}
              neon={neon}
              type="button"
              onClick={handleEditImage}
              title="Editar/Recortar imagem"
            >
              Editar
            </EditButton>
          </>
        ) : (
          <ImagePlaceholder theme={theme} neon={neon}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p>Clique para selecionar ou arrastar uma imagem</p>
          </ImagePlaceholder>
        )}
      </ImageContainer>

      <HiddenInput
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
      />

      <ErrorText visible={!!error}>{error || ''}</ErrorText>

      {croppingImageUrl && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          imageUrl={croppingImageUrl}
          cropPreset={cropPreset}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
          theme={theme}
          neon={neon}
        />
      )}
    </UploaderController>
  );
};
