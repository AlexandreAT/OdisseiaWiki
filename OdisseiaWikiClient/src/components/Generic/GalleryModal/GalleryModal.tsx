import { useEffect, useState } from 'react';
import { BiImage } from 'react-icons/bi';
import { detectImageShapeFromUrl, ImageDisplayShape } from '../../../utils/imageDisplayShape';
import { Modal } from '../Modal/Modal';
import {
  GalleryButton,
  GalleryImage,
  GalleryTitle,
  GalleryTrack,
  GalleryViewport,
} from './GalleryModal.style';
import { GalleryModalProps } from './GalleryModal.types';

export const GalleryModal = ({ title, images, theme, neon, onClose, onSelect }: GalleryModalProps) => {
  const [detectedShapes, setDetectedShapes] = useState<ImageDisplayShape[]>([]);

  useEffect(() => {
    let active = true;

    Promise.all(images.map((image) => (
      image.shape ? Promise.resolve(image.shape) : detectImageShapeFromUrl(image.url)
    ))).then((shapes) => {
      if (active) setDetectedShapes(shapes);
    });

    return () => { active = false; };
  }, [images]);

  return (
    <Modal
      title={<GalleryTitle>{title}</GalleryTitle>}
      theme={theme}
      neon={neon}
      showFooter={false}
      onClose={onClose}
      width="min(1500px, calc(100vw - 40px))"
      mobileInset
    >
      <GalleryViewport>
        <GalleryTrack>
          {images.map((image, index) => {
            const shape = image.shape ?? detectedShapes[index] ?? 'square';

            return (
              <GalleryButton
                key={`${image.url}-${index}`}
                $shape={shape}
                type="button"
                onClick={() => onSelect(index)}
                aria-label={`Ampliar imagem ${index + 1} da galeria`}
              >
                <GalleryImage
                  src={image.url}
                  alt={image.caption || `Imagem ${index + 1} da galeria`}
                  fallbackIcon={<BiImage aria-hidden="true" />}
                />
              </GalleryButton>
            );
          })}
        </GalleryTrack>
      </GalleryViewport>
    </Modal>
  );
};
