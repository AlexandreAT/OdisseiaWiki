import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CyberButton } from '../HighlightButton/HighlightButton';
import { useImageCropper } from './useImageCropper';
import { ImageCropperModalProps } from './types';
import {
  ModalOverlay,
  ModalContainer,
  ModalHeader,
  CropContainer,
  CropAreaWrapper,
  CropImage,
  ControlsSection,
  ZoomControl,
  ButtonsContainer,
  PreviewSection,
  PreviewImage,
} from './ImageCropperModal.style';

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageUrl,
  cropPreset,
  onConfirm,
  onCancel,
  theme,
  neon,
}) => {
  const {
    cropState,
    handleScaleChange,
    handleDrag,
    resetCrop,
    imageRef,
  } = useImageCropper();

  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string>('');
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);

  useEffect(() => {
    let root = document.getElementById('modal-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'modal-root';
      document.body.appendChild(root);
    }
    setModalRoot(root);
  }, []);

  useEffect(() => {
    if (!imageRef.current && isOpen) {
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        if (imageRef.current) {
          imageRef.current.src = imageUrl;
        }
      };
    }
  }, [imageUrl, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousOverscrollBehavior = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscrollBehavior;
    };
  }, [isOpen]);

  const calculateRenderedDimensions = (
    containerWidth: number,
    containerHeight: number,
    naturalWidth: number,
    naturalHeight: number
  ) => {
    const imageAspect = naturalWidth / naturalHeight;
    const containerAspect = containerWidth / containerHeight;

    if (imageAspect > containerAspect) {
      return {
        width: containerWidth,
        height: containerWidth / imageAspect,
      };
    }

    return {
      width: containerHeight * imageAspect,
      height: containerHeight,
    };
  };

  const calculateCropOffset = (
    containerWidth: number,
    containerHeight: number,
    renderedWidth: number,
    renderedHeight: number
  ) => {
    return {
      x: (containerWidth - renderedWidth) / 2,
      y: (containerHeight - renderedHeight) / 2,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragStart = dragStartRef.current;
    if (!dragStart || dragStart.pointerId !== event.pointerId) return;

    event.preventDefault();
    const deltaX = event.clientX - dragStart.x;
    const deltaY = event.clientY - dragStart.y;

    handleDrag(deltaX, deltaY);
    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    };
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current?.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragStartRef.current = null;
    setIsDragging(false);
  };

  const handleConfirm = async () => {
    if (!imageRef.current || !cropAreaRef.current) return;

    const img = imageRef.current;
    const container = cropAreaRef.current;

    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    const rendered = calculateRenderedDimensions(
      containerWidth,
      containerHeight,
      img.naturalWidth,
      img.naturalHeight
    );

    const offset = calculateCropOffset(
      containerWidth,
      containerHeight,
      rendered.width,
      rendered.height
    );

    // Escala para exportar a imagem em resolução maior
    // sem alterar a experiência visual do crop
    const EXPORT_SCALE = 3;

    const canvas = document.createElement('canvas');

    // Canvas em resolução maior
    canvas.width = containerWidth * EXPORT_SCALE;
    canvas.height = containerHeight * EXPORT_SCALE;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Escala o contexto para manter a lógica visual atual
    ctx.scale(EXPORT_SCALE, EXPORT_SCALE);

    // Aplicar clipping path baseado no formato para cortar de fato a imagem
    const displayShape = (cropPreset.displayShape || cropPreset.shape) as
      | 'circle'
      | 'square'
      | 'rectangle';

    if (displayShape === 'circle') {
      // Criar máscara circular
      ctx.beginPath();
      ctx.arc(
        containerWidth / 2,
        containerHeight / 2,
        Math.min(containerWidth, containerHeight) / 2,
        0,
        Math.PI * 2
      );
      ctx.clip();
    } else if (displayShape === 'rectangle') {
      // Para retângulo, usar clipping nos limites exatos
      ctx.beginPath();
      ctx.rect(0, 0, containerWidth, containerHeight);
      ctx.clip();
    }
    // Para square, canvas já recorta automaticamente nos limites

    // Preencher com preto dentro do clipping (vai respeitar o shape)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, containerWidth, containerHeight);

    ctx.save();

    ctx.translate(
      offset.x + rendered.width / 2,
      offset.y + rendered.height / 2
    );

    ctx.scale(cropState.scale, cropState.scale);

    ctx.translate(cropState.x, cropState.y);

    ctx.drawImage(
      img,
      -rendered.width / 2,
      -rendered.height / 2,
      rendered.width,
      rendered.height
    );

    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const file = new File([blob], `cropped-${Date.now()}.png`, {
          type: 'image/png',
        });

        const previewUrl = canvas.toDataURL('image/png');

        onConfirm({
          file,
          preview: previewUrl,
        });
      },
      'image/png'
    );
  };

  const handleCancel = () => {
    resetCrop();
    setPreview('');
    onCancel();
  };

  const handleReset = () => {
    resetCrop();
    setPreview('');
  };

  const displayShape = cropPreset.displayShape || cropPreset.shape;

  if (!isOpen || !modalRoot) return null;

  const getAspectRatio = (): number => {
    return typeof cropPreset.aspectRatio === 'number' ? cropPreset.aspectRatio : 1;
  };

  const modalContent = (
    <ModalOverlay theme={theme} neon={neon} onClick={handleCancel}>
      <ModalContainer
        theme={theme}
        neon={neon}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader theme={theme} neon={neon}>
          <h2>Recortar Imagem</h2>
        </ModalHeader>

        <CropContainer>
          <CropAreaWrapper
            ref={cropAreaRef}
            shape={displayShape}
            aspectRatio={getAspectRatio()}
            theme={theme}
            neon={neon}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
          >
            <CropImage
              ref={imageRef}
              src={imageUrl}
              alt="Imagem para recorte"
              style={{
                transform: `scale(${cropState.scale}) translate(${cropState.x}px, ${cropState.y}px)`,
                transition: isDragging ? 'none' : 'transform 0.1s ease',
              }}
              draggable={false}
            />
          </CropAreaWrapper>

          <ControlsSection theme={theme} neon={neon}>
            <ZoomControl theme={theme} neon={neon}>
              <label htmlFor="zoom-slider">Zoom:</label>
              <input
                id="zoom-slider"
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={cropState.scale}
                onChange={(e) => handleScaleChange(Number(e.target.value))}
              />
              <span>{cropState.scale.toFixed(1)}x</span>
            </ZoomControl>

            {preview && (
              <PreviewSection theme={theme} neon={neon}>
                <label>Preview:</label>
                <PreviewImage shape={displayShape} src={preview} alt="Preview" />
              </PreviewSection>
            )}
          </ControlsSection>
        </CropContainer>

        <ButtonsContainer>
          <CyberButton
            type="button"
            onClick={handleReset}
            theme={theme}
            neon={neon}
            colorType="secondary"
            text="Resetar"
            width="100px"
          />
          <CyberButton
            type="button"
            onClick={handleCancel}
            theme={theme}
            neon={neon}
            colorType="secondary"
            text="Cancelar"
            width="100px"
          />
          <CyberButton
            type="button"
            onClick={handleConfirm}
            theme={theme}
            neon={neon}
            colorType="primary"
            text="Confirmar"
            width="100px"
          />
        </ButtonsContainer>
      </ModalContainer>
    </ModalOverlay>
  );

  return createPortal(modalContent, modalRoot);
};
