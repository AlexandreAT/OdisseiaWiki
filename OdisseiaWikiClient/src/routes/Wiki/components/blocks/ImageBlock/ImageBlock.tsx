import React, { useState } from 'react';
import { ImageBlockProps } from './types';
import { normalizeImagePath } from '../../../utils/imagePathHelper';
import { ImageBlockContent } from '../../../../../models/Pages';
import { ImageTextRenderer } from './ImageTextRenderer';
import {
  ImageBlockContainer,
  ImageWithTextContainer,
  ImageSide,
  TextSide,
  ImageWrapper,
  StyledImage,
  ImageCaption,
  ErrorMessage,
} from './ImageBlock.style';

export const ImageBlock: React.FC<ImageBlockProps> = ({ block }) => {
  const [imageError, setImageError] = useState(false);

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

  if (hasText) {
    return (
      <ImageBlockContainer>
        <ImageWithTextContainer $posicaoTexto={posicaoTexto || 'right'}>
          <ImageSide>
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
          </ImageSide>
          <TextSide>
            <ImageTextRenderer content={texto} />
          </TextSide>
        </ImageWithTextContainer>
      </ImageBlockContainer>
    );
  }

  return (
    <ImageBlockContainer>
      <ImageWrapper>
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
    </ImageBlockContainer>
  );
};
