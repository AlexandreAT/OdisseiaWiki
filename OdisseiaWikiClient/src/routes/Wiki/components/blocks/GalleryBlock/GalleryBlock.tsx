import React, { useState, useCallback } from 'react';
import { BiImage } from 'react-icons/bi';
import { normalizeImagePath } from '../../../utils/imagePathHelper';
import { GalleryBlockProps } from './types';
import { Lightbox } from '../shared/Lightbox/Lightbox';
import {
  GalleryBlockContainer,
  GalleryGrid,
  GalleryItem,
  GalleryItemImage,
  GalleryItemPlaceholder,
  ErrorMessage,
} from './GalleryBlock.style';

export const GalleryBlock: React.FC<GalleryBlockProps> = ({ block }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  if (!block.conteudo || !block.conteudo.imagens || block.conteudo.imagens.length === 0) {
    return (
      <ErrorMessage>
        <p>Nenhuma imagem disponível nesta galeria</p>
      </ErrorMessage>
    );
  }

  const imagens = block.conteudo.imagens;

  const lightboxImages = imagens.map((imagem: any) => ({
    url: normalizeImagePath(imagem.url),
    caption: imagem.legenda,
  }));

  const handleImageClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleCloseModal = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
  };

  const handlePrevious = useCallback(() => {
    setSelectedIndex(prev => (prev !== null && prev > 0 ? prev - 1 : prev));
  }, []);

  const handleNext = useCallback(() => {
    setSelectedIndex(prev =>
      prev !== null && prev < imagens.length - 1 ? prev + 1 : prev
    );
  }, [imagens.length]);

  return (
    <>
      <GalleryBlockContainer>
        <GalleryGrid>
          {imagens.map((imagem: any, index: number) => (
            <GalleryItem
              key={index}
              onClick={() => handleImageClick(index)}
              type="button"
            >
              {!imageErrors.has(index) && imagem.url ? (
                <GalleryItemImage
                  src={normalizeImagePath(imagem.url)}
                  alt={imagem.legenda || `Imagem ${index + 1}`}
                  onError={() => handleImageError(index)}
                />
              ) : (
                <GalleryItemPlaceholder>
                  <BiImage />
                </GalleryItemPlaceholder>
              )}
            </GalleryItem>
          ))}
        </GalleryGrid>
      </GalleryBlockContainer>

      <Lightbox
        isOpen={selectedIndex !== null}
        images={lightboxImages}
        selectedIndex={selectedIndex ?? 0}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onClose={handleCloseModal}
      />
    </>
  );
};