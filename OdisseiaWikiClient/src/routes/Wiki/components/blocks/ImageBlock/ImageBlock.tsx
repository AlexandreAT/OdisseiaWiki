import React, { useState, useCallback } from 'react';
import { ImageBlockProps } from './types';
import { normalizeImagePath } from '../../../utils/imagePathHelper';
import { ImageBlockContent } from '../../../../../models/Pages';
import { ImageTextRenderer } from './ImageTextRenderer';
import { Lightbox } from '../shared/Lightbox/Lightbox';
import {
  ImageBlockContainer,
  ImageWithTextContainer,
  TextSide,
  ImageWrapper,
  StyledImage,
  ImageCaption,
  ErrorMessage,
  ImageContent,
} from './ImageBlock.style';

export const ImageBlock: React.FC<ImageBlockProps> = ({ block }) => {
  const [imageError, setImageError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleImageClick = useCallback(() => {
    setLightboxOpen(true);
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  if (!block.conteudo) {
    return null;
  }

  const content = block.conteudo as ImageBlockContent;
  const { url, legenda, texto, posicaoTexto } = content;

  if (!url) {
    return (
      <ErrorMessage>
        <p>URL da imagem não fornecida</p>
      </ErrorMessage>
    );
  }

  const hasText = !!texto;

  const images = [{ url: normalizeImagePath(url), caption: legenda }];

  if (hasText) {
    const floatDir: 'left' | 'right' = posicaoTexto === 'left' ? 'right' : 'left';

    return (
      <ImageBlockContainer>
        <ImageWithTextContainer>
          <ImageContent $float={floatDir} onClick={handleImageClick}>
            {!imageError ? (
                <StyledImage
                  src={normalizeImagePath(url)}
                  alt={legenda || 'Imagem'}
                  onError={() => setImageError(true)}
                />
            ) : (
              <ErrorMessage style={{ margin: 0, borderRadius: 0 }}>
                <p>Erro ao carregar a imagem</p>
              </ErrorMessage>
            )}
            {legenda && <ImageCaption>{legenda}</ImageCaption>}
          </ImageContent>
          <TextSide>
            <ImageTextRenderer content={texto} />
          </TextSide>
        </ImageWithTextContainer>

        <Lightbox
          isOpen={lightboxOpen}
          images={images}
          onClose={handleCloseLightbox}
        />
      </ImageBlockContainer>
    );
  }

  return (
    <ImageBlockContainer>
      <ImageWrapper onClick={handleImageClick} style={{ cursor: 'pointer' }}>
        {!imageError ? (
          <StyledImage
            src={normalizeImagePath(url)}
            alt={legenda || 'Imagem'}
            onError={() => setImageError(true)}
          />
        ) : (
          <ErrorMessage style={{ margin: 0, borderRadius: 0 }}>
            <p>Erro ao carregar a imagem</p>
          </ErrorMessage>
        )}
      </ImageWrapper>
      {legenda && <ImageCaption>{legenda}</ImageCaption>}

      <Lightbox
        isOpen={lightboxOpen}
        images={images}
        onClose={handleCloseLightbox}
      />
    </ImageBlockContainer>
  );
};
