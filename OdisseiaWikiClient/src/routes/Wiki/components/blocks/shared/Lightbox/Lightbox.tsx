import React, { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BiX, BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import {
  LightboxOverlay,
  LightboxContent,
  LightboxImage,
  LightboxCaption,
  LightboxTopBar,
  LightboxCloseButton,
  LightboxCounter,
  LightboxNavButton,
  LightboxError,
} from './Lightbox.style';

interface LightboxImageData {
  url: string;
  caption?: string;
  backgroundUrl?: string | null;
}

interface LightboxProps {
  variant?: 'gallery' | 'portrait';
  isOpen: boolean;
  onClose: () => void;
  images: LightboxImageData[];
  selectedIndex?: number;
  onPrevious?: () => void;
  onNext?: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
  variant = 'gallery',
  isOpen,
  onClose,
  images,
  selectedIndex = 0,
  onPrevious,
  onNext,
}) => {
  const currentImage = images[selectedIndex];
  const closeRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        onClose();
      } else if (variant === 'portrait' && e.key === 'Tab') {
        e.preventDefault();
        closeRef.current?.focus();
      } else if (e.key === 'ArrowLeft' && onPrevious && selectedIndex > 0) {
        onPrevious();
      } else if (e.key === 'ArrowRight' && onNext && selectedIndex < images.length - 1) {
        onNext();
      }
    },
    [onClose, onPrevious, onNext, selectedIndex, images.length, variant]
  );

  useEffect(() => {
    if (!isOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    if (variant === 'portrait') closeRef.current?.focus({ preventScroll: true });
    document.addEventListener('keydown', handleKeyDown, true);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = previousBodyOverflow;
      if (typeof HTMLElement !== 'undefined' && previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [isOpen, handleKeyDown, variant]);

  if (!isOpen || !currentImage) return null;

  const isSingle = images.length <= 1;
  const hasPrevious = !isSingle && selectedIndex > 0;
  const hasNext = !isSingle && selectedIndex < images.length - 1;
  const backgroundImage = currentImage.backgroundUrl === null
    ? undefined
    : currentImage.backgroundUrl || currentImage.url;

  return createPortal(
    <LightboxOverlay $backgroundImage={backgroundImage} $portrait={variant === 'portrait'} onClick={onClose}
      role="dialog" aria-modal="true" aria-label={currentImage.caption || 'Imagem ampliada'}>
      <LightboxCloseButton ref={closeRef} onClick={onClose} type="button" title="Fechar" aria-label="Fechar imagem">
        <BiX />
      </LightboxCloseButton>

      {!isSingle && (
        <LightboxNavButton
          $side="left"
          disabled={!hasPrevious}
          onClick={e => {
            e.stopPropagation();
            onPrevious?.();
          }}
          type="button"
          title="Anterior"
          aria-label="Imagem anterior"
        >
          <BiChevronLeft />
        </LightboxNavButton>
      )}

      <LightboxContent $portrait={variant === 'portrait'} onClick={e => e.stopPropagation()}>
        <LightboxTopBar>
          {!isSingle && (
            <LightboxCounter>
              {selectedIndex + 1} / {images.length}
            </LightboxCounter>
          )}
        </LightboxTopBar>

        {currentImage.url ? (
          <LightboxImage
            $portrait={variant === 'portrait'}
            src={currentImage.url}
            alt={currentImage.caption || `Imagem ${selectedIndex + 1}`}
          />
        ) : (
          <LightboxError>Erro ao carregar a imagem</LightboxError>
        )}

        {currentImage.caption && (
          <LightboxCaption $portrait={variant === 'portrait'}>{currentImage.caption}</LightboxCaption>
        )}
      </LightboxContent>

      {!isSingle && (
        <LightboxNavButton
          $side="right"
          disabled={!hasNext}
          onClick={e => {
            e.stopPropagation();
            onNext?.();
          }}
          type="button"
          title="Próximo"
          aria-label="Próxima imagem"
        >
          <BiChevronRight />
        </LightboxNavButton>
      )}
    </LightboxOverlay>,
    document.body
  );
};
