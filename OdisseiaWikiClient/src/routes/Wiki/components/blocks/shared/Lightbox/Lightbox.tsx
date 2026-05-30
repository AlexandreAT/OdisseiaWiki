import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BiX, BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import {
  LightboxOverlay,
  LightboxContent,
  LightboxImage,
  LightboxCaption,
  LightboxTopBar,
  LightboxCloseButton,
  LightboxBottomBar,
  LightboxCounter,
  LightboxNavButton,
  LightboxError,
} from './Lightbox.style';

interface LightboxImageData {
  url: string;
  caption?: string;
}

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: LightboxImageData[];
  selectedIndex?: number;
  onPrevious?: () => void;
  onNext?: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
  isOpen,
  onClose,
  images,
  selectedIndex = 0,
  onPrevious,
  onNext,
}) => {
  const currentImage = images[selectedIndex];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && onPrevious && selectedIndex > 0) {
        onPrevious();
      } else if (e.key === 'ArrowRight' && onNext && selectedIndex < images.length - 1) {
        onNext();
      }
    },
    [onClose, onPrevious, onNext, selectedIndex, images.length]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !currentImage) return null;

  const isSingle = images.length <= 1;
  const hasPrevious = !isSingle && selectedIndex > 0;
  const hasNext = !isSingle && selectedIndex < images.length - 1;

  return createPortal(
    <LightboxOverlay onClick={onClose}>
      <LightboxContent onClick={e => e.stopPropagation()}>
        <LightboxTopBar>
          {!isSingle && (
            <LightboxCounter>
              {selectedIndex + 1} / {images.length}
            </LightboxCounter>
          )}
          <LightboxCloseButton onClick={onClose} type="button" title="Fechar">
            <BiX />
          </LightboxCloseButton>
        </LightboxTopBar>

        {currentImage.url ? (
          <LightboxImage
            src={currentImage.url}
            alt={currentImage.caption || `Imagem ${selectedIndex + 1}`}
          />
        ) : (
          <LightboxError>Erro ao carregar a imagem</LightboxError>
        )}

        {currentImage.caption && (
          <LightboxCaption>{currentImage.caption}</LightboxCaption>
        )}

        {!isSingle && (
          <LightboxBottomBar>
            <LightboxNavButton
              onClick={onPrevious}
              disabled={!hasPrevious}
              type="button"
              title="Anterior"
            >
              <BiChevronLeft />
            </LightboxNavButton>

            <LightboxNavButton
              onClick={onNext}
              disabled={!hasNext}
              type="button"
              title="Próximo"
            >
              <BiChevronRight />
            </LightboxNavButton>
          </LightboxBottomBar>
        )}
      </LightboxContent>
    </LightboxOverlay>,
    document.body
  );
};