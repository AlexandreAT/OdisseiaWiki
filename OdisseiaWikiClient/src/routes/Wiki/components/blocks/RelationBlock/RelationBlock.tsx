import React, { useMemo } from 'react';
import {
  BiNote,
  BiUserCircle,
  BiGift,
  BiShapeSquare,
} from 'react-icons/bi';
import { RelationBlockProps } from './types';
import { RelatedEntityReference } from '../../../../../models/Pages';
import {
  RelationBlockContainer,
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
  RelationTypeGroup,
  RelationTypeGroupHeader,
} from './RelationBlock.style';

const typeIcons: Record<string, React.ReactNode> = {
  Cidade: <BiNote />,
  Personagem: <BiUserCircle />,
  Item: <BiGift />,
  Raca: <BiShapeSquare />,
};

const normalizeRelations = (raw: any): RelatedEntityReference[] => {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && 'idEntidade' in raw) {
    return [raw as RelatedEntityReference];
  }
  return [];
};

export const RelationBlock: React.FC<RelationBlockProps> = ({ block }) => {
  const relations = useMemo(
    () => normalizeRelations(block.conteudo),
    [block.conteudo]
  );

  if (relations.length === 0) {
    return (
      <ErrorMessage>
        <p>Nenhuma referência disponível neste bloco</p>
      </ErrorMessage>
    );
  }

  // Agrupa por tipo para exibir grupos com cabeçalhos
  const grouped = useMemo(() => {
    const map = new Map<string, RelatedEntityReference[]>();
    relations.forEach(r => {
      const key = r.tipoEntidade || 'Outro';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return Array.from(map.entries());
  }, [relations]);

  return (
    <RelationBlockContainer>
      {grouped.map(([tipo, items]) => (
        <RelationTypeGroup key={tipo}>
          <RelationTypeGroupHeader>
            <TypeIconWrapper>
              {typeIcons[tipo] || <BiUserCircle />}
            </TypeIconWrapper>
            <TypeLabel>
              {tipo}s ({items.length})
            </TypeLabel>
          </RelationTypeGroupHeader>

          <RelationItemsGrid>
            {items.map((relation, index) => {
              const key = `${tipo}:${String(relation.idEntidade)}:${index}`;
              return (
                <RelationCard key={key} type="button">
                  {relation.imagem ? (
                    <RelationCardImage
                      src={relation.imagem}
                      alt={relation.nome || 'Relação'}
                    />
                  ) : (
                    <RelationCardPlaceholder>
                      {typeIcons[relation.tipoEntidade as string] || <BiUserCircle />}
                    </RelationCardPlaceholder>
                  )}
                  <RelationCardContent>
                    <RelationCardTitle>
                      {relation.nome || 'Sem nome'}
                    </RelationCardTitle>
                    <RelationCardType>
                      {relation.tipoEntidade} • ID: {String(relation.idEntidade)}
                    </RelationCardType>
                  </RelationCardContent>
                </RelationCard>
              );
            })}
          </RelationItemsGrid>
        </RelationTypeGroup>
      ))}
    </RelationBlockContainer>
  );
};
