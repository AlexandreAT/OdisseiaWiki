import React, { useState } from 'react';
import { BiInfoCircle } from 'react-icons/bi';
import { InfoLoreBlockProps } from './types';
import {
  InfoLoreBlockContainer,
  InfoLoreImage,
  InfoLoreImagePlaceholder,
  InfoLoreContent,
  InfoLoreTitle,
  InfoLoreDescription,
  ErrorMessage,
} from './InfoLoreBlock.style';
import { jsonContentToString, isJSONContent } from '../../../../../utils/richTextHelpers';

export const InfoLoreBlock: React.FC<InfoLoreBlockProps> = ({ block, theme: _theme, neon: _neon }) => {
  const [imageError, setImageError] = useState(false);

  if (!block.conteudo) {
    return (
      <ErrorMessage>
        <p>Conteúdo InfoLore não disponível</p>
      </ErrorMessage>
    );
  }

  const { titulo, imagem, descricao } = block.conteudo;

  if (!titulo) {
    return (
      <ErrorMessage>
        <p>InfoLore sem título</p>
      </ErrorMessage>
    );
  }

  // Converter descrição se for JSONContent
  let descricaoText = descricao;
  if (isJSONContent(descricao)) {
    descricaoText = jsonContentToString(descricao);
  }

  return (
    <InfoLoreBlockContainer>
      {imagem && !imageError ? (
        <InfoLoreImage
          src={imagem}
          alt={titulo}
          onError={() => setImageError(true)}
        />
      ) : (
        <InfoLoreImagePlaceholder>
          <BiInfoCircle />
        </InfoLoreImagePlaceholder>
      )}

      <InfoLoreContent>
        <InfoLoreTitle>{titulo}</InfoLoreTitle>
        {descricaoText && <InfoLoreDescription>{descricaoText}</InfoLoreDescription>}
      </InfoLoreContent>
    </InfoLoreBlockContainer>
  );
};
