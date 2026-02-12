import React, { useRef } from 'react';
import {
  ImageUploadController,
  ImageLabel,
  ImageContainer,
  ImagePlaceholder,
  HiddenInput,
  ErrorText,
  RemoveImageButton,
} from './ImageUpload.style';

interface ImageUploadProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  label?: string;
  imageUrl?: string;
  onChange: (file: File | null) => void;
  error?: boolean;
  errorMessage?: string;
  width?: string;
  height?: string;
  accept?: string;
  placeholder?: string;
  required?: boolean;
  showRemoveButton?: boolean;
}

export const ImageUpload = ({
  theme,
  neon,
  label,
  imageUrl,
  onChange,
  error = false,
  errorMessage,
  width,
  height,
  accept = 'image/*',
  placeholder = 'Clique para adicionar imagem',
  required = false,
  showRemoveButton = true,
}: ImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file);
    }
    
    e.target.value = '';
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <ImageUploadController width={width}>
      {label && (
        <ImageLabel theme={theme} neon={neon}>
          {label} {required && '*'}
        </ImageLabel>
      )}
      
      <ImageContainer
        theme={theme}
        neon={neon}
        hasImage={!!imageUrl}
        width={width}
        height={height}
        onClick={handleContainerClick}
      >
        {imageUrl ? (
          <>
            <img src={imageUrl} alt={label || 'Imagem selecionada'} />
            {showRemoveButton && (
              <RemoveImageButton
                theme={theme}
                neon={neon}
                type="button"
                onClick={handleRemoveImage}
                title="Remover imagem"
              >
                ×
              </RemoveImageButton>
            )}
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
            <p>{placeholder}</p>
          </ImagePlaceholder>
        )}
      </ImageContainer>

      <HiddenInput
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
      />

      <ErrorText visible={error && !!errorMessage}>
        {errorMessage || ''}
      </ErrorText>
    </ImageUploadController>
  );
};
