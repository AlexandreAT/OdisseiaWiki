import React from 'react';
import {
  BiNote,
  BiUserCircle,
  BiGift,
  BiShapeSquare,
} from 'react-icons/bi';
import { RelationBlockProps } from './types';
import {
  RelationBlockContainer,
  RelationBlockHeader,
  RelationItemsGrid,
  RelationCard,
  RelationCardImage,
  RelationCardPlaceholder,
  RelationCardContent,
  RelationCardTitle,
  RelationCardType,
  ErrorMessage,
  TypeIconWrapper,
  TypeLabel,
} from './RelationBlock.style';

const typeIcons = {
  'Cidade': <BiNote />,
  'Personagem': <BiUserCircle />,
  'Item': <BiGift />,
  'Raca': <BiShapeSquare />,
};

export const RelationBlock: React.FC<RelationBlockProps> = ({ block }) => {
  if (
    !block.conteudo ||
    !Array.isArray(block.conteudo) ||
    block.conteudo.length === 0
  ) {
    return (
      <ErrorMessage>
        <p>Nenhuma relação disponível neste bloco</p>
      </ErrorMessage>
    );
  }

  // Se for um único objeto, colocar em array; se for array, manter como está
  const relations = Array.isArray(block.conteudo)
    ? block.conteudo
    : [block.conteudo];

  if (relations.length === 0) {
    return (
      <ErrorMessage>
        <p>Nenhuma relação disponível</p>
      </ErrorMessage>
    );
  }

  const tipoEntidade = relations[0]?.tipoEntidade || 'Referência';

  return (
    <RelationBlockContainer>
      <RelationBlockHeader>
        <TypeIconWrapper>
          {typeIcons[tipoEntidade as keyof typeof typeIcons] || <BiUserCircle />}
        </TypeIconWrapper>
        <TypeLabel>{tipoEntidade}s Relacionados</TypeLabel>
      </RelationBlockHeader>

      <RelationItemsGrid>
        {relations.map((relation: any, index: number) => (
          <RelationCard key={index} disabled type="button">
            {relation.imagem ? (
              <RelationCardImage src={relation.imagem} alt={relation.nome || 'Relação'} />
            ) : (
              <RelationCardPlaceholder>
                {typeIcons[relation.tipoEntidade as keyof typeof typeIcons] || <BiUserCircle />}
              </RelationCardPlaceholder>
            )}
            <RelationCardContent>
              <RelationCardTitle>{relation.nome || 'Sem nome'}</RelationCardTitle>
              <RelationCardType>{relation.tipoEntidade}</RelationCardType>
            </RelationCardContent>
          </RelationCard>
        ))}
      </RelationItemsGrid>
    </RelationBlockContainer>
  );
};
