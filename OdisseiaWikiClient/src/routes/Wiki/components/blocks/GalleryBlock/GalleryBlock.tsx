import React, { useState, useCallback } from 'react';
import { BiX, BiChevronLeft, BiChevronRight, BiImage } from 'react-icons/bi';
import { GalleryBlockProps } from './types';
import {
  GalleryBlockContainer,
  GalleryGrid,
  GalleryItem,
  GalleryItemImage,
  GalleryItemPlaceholder,
  ModalOverlay,
  ModalContent,
  ModalImage,
  ModalCaption,
  ModalCloseButton,
  ModalNavigation,
  ModalNavButton,
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

  const handleImageClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleCloseModal = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
  };

  const handlePrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < imagens.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCloseModal();
    } else if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    }
  };

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
                  src={imagem.url}
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

      {selectedIndex !== null && (
        <ModalOverlay onClick={handleCloseModal} onKeyDown={handleKeyDown} tabIndex={-1}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalCloseButton onClick={handleCloseModal} type="button">
              <BiX />
            </ModalCloseButton>

            {!imageErrors.has(selectedIndex) && imagens[selectedIndex]?.url ? (
              <ModalImage
                src={imagens[selectedIndex].url}
                alt={imagens[selectedIndex].legenda || `Imagem ${selectedIndex + 1}`}
                onError={() => handleImageError(selectedIndex)}
              />
            ) : (
              <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
                Erro ao carregar a imagem
              </div>
            )}

            {imagens[selectedIndex]?.legenda && (
              <ModalCaption>{imagens[selectedIndex].legenda}</ModalCaption>
            )}

            <ModalNavigation>
              <ModalNavButton
                onClick={handlePrevious}
                disabled={selectedIndex === 0}
                type="button"
              >
                <BiChevronLeft /> Anterior
              </ModalNavButton>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
                {selectedIndex + 1} / {imagens.length}
              </span>
              <ModalNavButton
                onClick={handleNext}
                disabled={selectedIndex === imagens.length - 1}
                type="button"
              >
                Próximo <BiChevronRight />
              </ModalNavButton>
            </ModalNavigation>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
};
