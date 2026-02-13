import React, { useRef } from 'react';
import {
  GalleryController,
  GalleryLabel,
  GalleryGrid,
  GalleryImageContainer,
  RemoveImageButton,
  AddGalleryImageButton,
  HiddenInput,
} from './ImageGallery.style';
import CloseIcon from '@mui/icons-material/Close';

interface ImageGalleryProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  label?: string;
  imageUrls: string[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  accept?: string;
  maxImages?: number;
}

export const ImageGallery = ({
  theme,
  neon,
  label,
  imageUrls,
  onAdd,
  onRemove,
  accept = 'image/*',
  maxImages,
}: ImageGalleryProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onAdd(files);
    }
    
    e.target.value = '';
  };

  const handleRemoveImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(index);
  };

  const canAddMore = !maxImages || imageUrls.length < maxImages;

  return (
    <GalleryController>
      {label && (
        <GalleryLabel theme={theme} neon={neon}>
          {label}
          {maxImages && ` (${imageUrls.length}/${maxImages})`}
        </GalleryLabel>
      )}

      <GalleryGrid>
        {imageUrls.map((url, index) => (
          <GalleryImageContainer key={index}>
            <img src={url} alt={`Galeria ${index + 1}`} />
            <RemoveImageButton
              theme={theme}
              neon={neon}
              type="button"
              onClick={(e) => handleRemoveImage(index, e)}
              title="Remover imagem"
            >
              <CloseIcon className='icon' />
            </RemoveImageButton>
          </GalleryImageContainer>
        ))}
        
        {canAddMore && (
          <AddGalleryImageButton
            theme={theme}
            neon={neon}
            type="button"
            onClick={handleAddClick}
          >
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
                d="M12 4v16m8-8H4" 
              />
            </svg>
            Adicionar
          </AddGalleryImageButton>
        )}
      </GalleryGrid>

      <HiddenInput
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleFileChange}
      />
    </GalleryController>
  );
};
