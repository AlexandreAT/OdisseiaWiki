import React, { useRef, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { ImageCropperModal } from '../ImageUploader/ImageCropperModal';
import { CropResult } from '../ImageUploader/types';
import { RemoveImageButton, GalleryController } from './ImageGallery.style';
import {
  GalleryLabel,
  ImagesGrid,
  ImageItem,
  AddButton,
  ShapeSelectorOverlay,
  ShapeSelectorModal,
  ShapeSelectorTitle,
  ShapeButton,
  ErrorMessage,
  HiddenInput,
} from './ImageGalleryWithCrop.style';

enum ImageShape {
  SQUARE = 'square',
  CIRCLE = 'circle',
  RECTANGLE = 'rectangle',
}

interface ShapeOption {
  value: ImageShape;
  label: string;
}

interface ImageGalleryWithCropProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  label?: string;
  imageUrls: string[];
  imageShapes?: string[];
  onAdd: (files: File[], shapes: string[]) => void;
  onRemove: (index: number) => void;
  accept?: string;
  maxImages?: number;
}

export const ImageGalleryWithCrop = ({
  theme,
  neon,
  label,
  imageUrls,
  imageShapes = [],
  onAdd,
  onRemove,
  accept = 'image/*',
  maxImages,
}: ImageGalleryWithCropProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedShapeRef = useRef<ImageShape>(ImageShape.SQUARE);

  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedShape, setSelectedShape] = useState<ImageShape>(ImageShape.SQUARE);
  const [error, setError] = useState<string | null>(null);
  const [showShapeSelector, setShowShapeSelector] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hoveredShape, setHoveredShape] = useState<ImageShape | null>(null);

  const SHAPE_OPTIONS: ShapeOption[] = [
    { value: ImageShape.SQUARE, label: 'Quadrado (1:1)' },
    { value: ImageShape.CIRCLE, label: 'Círculo (1:1)' },
    { value: ImageShape.RECTANGLE, label: 'Retângulo (16:9)' },
  ];

  const getAspectRatioForShape = (shape: ImageShape): number => {
    return shape === ImageShape.RECTANGLE ? 16 / 9 : 1;
  };



  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem válido');
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Imagem muito grande. Máximo 10MB');
      return false;
    }

    return true;
  };

  const handleAddClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) return;

    setError(null);
    setSelectedFile(file);
    setShowShapeSelector(true);
    e.target.value = '';
  };

  const handleShapeSelect = (shape: ImageShape) => {
    selectedShapeRef.current = shape;
    setSelectedShape(shape);
    setShowShapeSelector(false);

    if (!selectedFile) return;

    const url = URL.createObjectURL(selectedFile);
    setSelectedImageUrl(url);
    setIsCropperOpen(true);
  };

  const handleCropConfirm = (result: CropResult) => {
    setIsCropperOpen(false);

    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl);
    }

    setSelectedImageUrl(null);
    setSelectedFile(null);

    if (result.file) {
      onAdd([result.file], [selectedShapeRef.current as string]);
    }
  };

  const handleCropCancel = () => {
    setIsCropperOpen(false);

    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl);
    }

    setSelectedImageUrl(null);
    setSelectedFile(null);
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

      <ImagesGrid>
        {imageUrls.map((url, index) => {
          const shape = (imageShapes?.[index] || 'square') as string;
          const isCircle = shape === 'circle';

          return (
            <ImageItem
              key={url}
              theme={theme}
              neon={neon}
              isCircle={isCircle}
              shape={shape}
            >
              <img
                src={url}
                alt={`Galeria ${index + 1}`}
              />
              <RemoveImageButton
                theme={theme}
                neon={neon}
                type="button"
                onClick={(e) => handleRemoveImage(index, e)}
                title="Remover imagem"
              >
                <CloseIcon className="icon" />
              </RemoveImageButton>
            </ImageItem>
          );
        })}

        {canAddMore && (
          <AddButton
            onClick={handleAddClick}
            type="button"
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
          </AddButton>
        )}
      </ImagesGrid>

      {showShapeSelector && (
        <ShapeSelectorOverlay onClick={() => setShowShapeSelector(false)}>
          <ShapeSelectorModal
            theme={theme}
            neon={neon}
            onClick={(e) => e.stopPropagation()}
          >
            <ShapeSelectorTitle theme={theme} neon={neon}>
              Selecione o formato da imagem
            </ShapeSelectorTitle>

            {SHAPE_OPTIONS.map((option) => (
              <ShapeButton
                key={option.value}
                type="button"
                theme={theme}
                neon={neon}
                isSelected={selectedShape === option.value}
                isHovered={hoveredShape === option.value}
                onClick={() => handleShapeSelect(option.value)}
                onMouseEnter={() => setHoveredShape(option.value)}
                onMouseLeave={() => setHoveredShape(null)}
              >
                {option.label}
              </ShapeButton>
            ))}
          </ShapeSelectorModal>
        </ShapeSelectorOverlay>
      )}

      {isCropperOpen && selectedImageUrl && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          imageUrl={selectedImageUrl}
          cropPreset={{
            mode: 'single',
            aspectRatio: getAspectRatioForShape(selectedShape),
            shape: selectedShape as 'square' | 'circle' | 'rectangle',
            displayShape: selectedShape as 'square' | 'circle' | 'rectangle',
            label: SHAPE_OPTIONS.find((o) => o.value === selectedShape)?.label || 'Selecione',
          }}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
          theme={theme}
          neon={neon}
        />
      )}

      <HiddenInput
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
      />

      {error && <ErrorMessage>{error}</ErrorMessage>}
    </GalleryController>
  );
};
