import React, { useState } from 'react';
import { ImageBlockProps } from './types';
import { normalizeImagePath } from '../../../utils/imagePathHelper';
import {
  ImageBlockContainer,
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

  const { url, legenda } = block.conteudo;

  if (!url) {
    return (
      <ErrorMessage>
        <p>URL da imagem não fornecida</p>
      </ErrorMessage>
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
