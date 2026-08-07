import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BiChevronLeft, BiChevronRight, BiImage } from 'react-icons/bi';
import { GalleryModal } from '../../../../../components/Generic/GalleryModal';
import { normalizeImagePath } from '../../../utils/imagePathHelper';
import { ImageBlockContent } from '../../../../../models/Pages';
import { Lightbox } from '../shared/Lightbox/Lightbox';
import {
  CarouselArrow,
  CarouselViewport,
  CarouselWrapper,
  DesktopGalleryPresentation,
  ErrorMessage,
  GalleryBlockContainer,
  GalleryGrid,
  GalleryItem,
  GalleryItemImage,
  GalleryItemPlaceholder,
  GalleryViewMoreButton,
  MobileGalleryPreview,
} from './GalleryBlock.style';
import { GalleryBlockProps } from './types';

const CAROUSEL_LIMIT = 5;
const MOBILE_PREVIEW_LIMIT = 6;

export const GalleryBlock: React.FC<GalleryBlockProps> = ({
  block,
  theme = 'dark',
  neon = 'off',
}) => {
  const imagens = (block.conteudo?.imagens ?? []) as ImageBlockContent[];
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragPointerId = useRef<number | null>(null);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const didDrag = useRef(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isCarousel = imagens.length > CAROUSEL_LIMIT;

  const lightboxImages = imagens.map((imagem) => ({
    url: normalizeImagePath(imagem.url),
    caption: imagem.legenda,
  }));

  const handleImageClick = (index: number) => {
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }
    setSelectedIndex(index);
  };

  const handleImageError = (index: number) => {
    setImageErrors((current) => new Set(current).add(index));
  };

  const handlePrevious = useCallback(() => {
    setSelectedIndex((current) => current !== null && current > 0 ? current - 1 : current);
  }, []);

  const handleNext = useCallback(() => {
    setSelectedIndex((current) => (
      current !== null && current < imagens.length - 1 ? current + 1 : current
    ));
  }, [imagens.length]);

  const updateScrollButtons = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    setCanScrollLeft(viewport.scrollLeft > 4);
    setCanScrollRight(viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !isCarousel) return;
    updateScrollButtons();
    viewport.addEventListener('scroll', updateScrollButtons, { passive: true });
    return () => viewport.removeEventListener('scroll', updateScrollButtons);
  }, [isCarousel, updateScrollButtons]);

  if (imagens.length === 0) {
    return (
      <ErrorMessage>
        <p>Nenhuma imagem disponÃ­vel nesta galeria</p>
      </ErrorMessage>
    );
  }

  const scrollByArrow = (direction: 'left' | 'right') => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const itemWidth = viewport.querySelector('button')?.offsetWidth ?? 200;
    viewport.scrollBy({
      left: direction === 'left' ? -(itemWidth + 18) : itemWidth + 18,
      behavior: 'smooth',
    });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragPointerId.current = event.pointerId;
    didDrag.current = false;
    dragStartX.current = event.clientX;
    dragScrollLeft.current = event.currentTarget.scrollLeft;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragPointerId.current !== event.pointerId) return;
    const distance = event.clientX - dragStartX.current;
    if (Math.abs(distance) > 3) didDrag.current = true;
    if (!didDrag.current) return;
    event.preventDefault();
    event.currentTarget.scrollLeft = dragScrollLeft.current - distance * 1.5;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragPointerId.current === event.pointerId) dragPointerId.current = null;
  };

  const renderItem = (imagem: (typeof imagens)[number], index: number) => (
    <GalleryItem key={`${imagem.url}-${index}`} onClick={() => handleImageClick(index)} type="button">
      {!imageErrors.has(index) && imagem.url ? (
        <GalleryItemImage
          src={normalizeImagePath(imagem.url)}
          alt={imagem.legenda || `Imagem ${index + 1}`}
          onError={() => handleImageError(index)}
        />
      ) : (
        <GalleryItemPlaceholder><BiImage /></GalleryItemPlaceholder>
      )}
    </GalleryItem>
  );

  return (
    <>
      <GalleryBlockContainer>
        <DesktopGalleryPresentation>
          {isCarousel ? (
            <CarouselWrapper>
              <CarouselArrow
                $direction="left"
                disabled={!canScrollLeft}
                onClick={() => scrollByArrow('left')}
                aria-label="Anterior"
              >
                <BiChevronLeft />
              </CarouselArrow>
              <CarouselViewport
                ref={viewportRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onDragStart={(event) => event.preventDefault()}
              >
                {imagens.map(renderItem)}
              </CarouselViewport>
              <CarouselArrow
                $direction="right"
                disabled={!canScrollRight}
                onClick={() => scrollByArrow('right')}
                aria-label="PrÃ³ximo"
              >
                <BiChevronRight />
              </CarouselArrow>
            </CarouselWrapper>
          ) : (
            <GalleryGrid>{imagens.map(renderItem)}</GalleryGrid>
          )}
        </DesktopGalleryPresentation>

        <MobileGalleryPreview>
          <GalleryGrid>{imagens.slice(0, MOBILE_PREVIEW_LIMIT).map(renderItem)}</GalleryGrid>
          {imagens.length > MOBILE_PREVIEW_LIMIT && (
            <GalleryViewMoreButton type="button" onClick={() => setGalleryModalOpen(true)}>
              Ver mais ({imagens.length})
            </GalleryViewMoreButton>
          )}
        </MobileGalleryPreview>
      </GalleryBlockContainer>

      {galleryModalOpen && (
        <GalleryModal
          title="Galeria da pÃ¡gina"
          images={lightboxImages}
          theme={theme}
          neon={neon}
          onClose={() => setGalleryModalOpen(false)}
          onSelect={(index) => {
            setGalleryModalOpen(false);
            setSelectedIndex(index);
          }}
        />
      )}

      <Lightbox
        isOpen={selectedIndex !== null}
        images={lightboxImages}
        selectedIndex={selectedIndex ?? 0}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onClose={() => setSelectedIndex(null)}
      />
    </>
  );
};
