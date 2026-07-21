import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BiImage, BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import { normalizeImagePath } from '../../../utils/imagePathHelper';
import { GalleryBlockProps } from './types';
import { Lightbox } from '../shared/Lightbox/Lightbox';
import {
  GalleryBlockContainer,
  GalleryGrid,
  GalleryItem,
  GalleryItemImage,
  GalleryItemPlaceholder,
  CarouselWrapper,
  CarouselViewport,
  CarouselArrow,
  ErrorMessage,
} from './GalleryBlock.style';

const CAROUSEL_LIMIT = 5;

export const GalleryBlock: React.FC<GalleryBlockProps> = ({ block, theme: _theme, neon: _neon }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  /* ── drag-to-scroll state ── */
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragPointerId = useRef<number | null>(null);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const didDrag = useRef(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  if (!block.conteudo || !block.conteudo.imagens || block.conteudo.imagens.length === 0) {
    return (
      <ErrorMessage>
        <p>Nenhuma imagem disponível nesta galeria</p>
      </ErrorMessage>
    );
  }

  const imagens = block.conteudo.imagens;
  const isCarousel = imagens.length > CAROUSEL_LIMIT;

  const lightboxImages = imagens.map((imagem: any) => ({
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

  /* ── scroll arrow helpers ── */
  const updateScrollButtons = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el || !isCarousel) return;
    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    return () => el.removeEventListener('scroll', updateScrollButtons);
  }, [isCarousel, updateScrollButtons]);

  const scrollByArrow = (direction: 'left' | 'right') => {
    const el = viewportRef.current;
    if (!el) return;
    const itemWidth = el.querySelector('button')?.offsetWidth ?? 200;
    const gap = 18;
    const scrollAmount = itemWidth + gap;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  /* ── drag-to-scroll handlers ── */
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const el = e.currentTarget;
    dragPointerId.current = e.pointerId;
    didDrag.current = false;
    dragStartX.current = e.clientX;
    dragScrollLeft.current = el.scrollLeft;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (dragPointerId.current !== e.pointerId) return;
    const distance = e.clientX - dragStartX.current;
    if (Math.abs(distance) > 3) didDrag.current = true;
    if (!didDrag.current) return;
    e.preventDefault();
    el.scrollLeft = dragScrollLeft.current - distance * 1.5;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragPointerId.current !== e.pointerId) return;
    dragPointerId.current = null;
  };

  /* ── render item ── */
  const renderItem = (imagem: any, index: number) => (
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
  );

  return (
    <>
      <GalleryBlockContainer>
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
              onDragStart={e => e.preventDefault()}
            >
              {imagens.map((imagem: any, index: number) => renderItem(imagem, index))}
            </CarouselViewport>

            <CarouselArrow
              $direction="right"
              disabled={!canScrollRight}
              onClick={() => scrollByArrow('right')}
              aria-label="Próximo"
            >
              <BiChevronRight />
            </CarouselArrow>
          </CarouselWrapper>
        ) : (
          <GalleryGrid>
            {imagens.map((imagem: any, index: number) => renderItem(imagem, index))}
          </GalleryGrid>
        )}
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
