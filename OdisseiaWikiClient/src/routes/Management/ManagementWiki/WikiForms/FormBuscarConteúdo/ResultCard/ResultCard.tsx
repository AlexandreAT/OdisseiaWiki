import React from 'react';
import { BiEditAlt, BiHide, BiShow, BiStar, BiTrash } from 'react-icons/bi';
import { normalizeImagePath } from '../../../../../Wiki/utils/imagePathHelper';
import { CardProps, EntityType } from '../types';
import {
  ActionButton,
  CardActions,
  CardContainer,
  CardContent,
  CardHeader,
  CardImage,
  CardMedia,
  CardTitle,
  EntityBadge,
  ManagementMetadata,
  MetadataChip,
  SlugText,
  Tag,
  TagsContainer,
} from './ResultCard.style';

const ENTITY_LABELS: Record<EntityType, string> = {
  Cidade: 'Cidade',
  Personagem: 'NPC',
  Item: 'Item',
  InfoLore: 'Lore',
  Raca: 'RaÃ§a',
  Page: 'PÃ¡gina',
};

export const ResultCard: React.FC<CardProps> = ({ theme, neon, item, onEdit, onDelete }) => {
  const entityType = item.tipoEntidade;
  const visibleTags = item.tags?.slice(0, 3) ?? [];
  const hiddenTagCount = Math.max(0, (item.tags?.length ?? 0) - visibleTags.length);

  return (
    <CardContainer theme={theme} neon={neon} $type={entityType}>
      <CardMedia $type={entityType}>
        <CardImage
          $type={entityType}
          src={normalizeImagePath(item.imagem)}
          alt={`Imagem de ${item.nome}`}
        />
      </CardMedia>

      <CardHeader>
        <CardTitle theme={theme} neon={neon} title={item.nome}>
          {item.nome}
        </CardTitle>
        <EntityBadge $type={entityType}>{ENTITY_LABELS[entityType]}</EntityBadge>
      </CardHeader>

      <CardContent>
        <ManagementMetadata>
          <MetadataChip $active={item.visivel}>
            {item.visivel ? <BiShow aria-hidden="true" /> : <BiHide aria-hidden="true" />}
            {item.visivel ? 'VisÃ­vel' : 'Oculto'}
          </MetadataChip>
          <MetadataChip $active={Boolean(item.destaque)} $featured>
            <BiStar aria-hidden="true" />
            {item.destaque ? 'Destaque' : 'Comum'}
          </MetadataChip>
        </ManagementMetadata>

        {entityType === 'Page' && item.slug && (
          <SlugText theme={theme} neon={neon} title={item.slug}>
            /{item.slug}
          </SlugText>
        )}

        {visibleTags.length > 0 && (
          <TagsContainer>
            {visibleTags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
            {hiddenTagCount > 0 && <Tag>+{hiddenTagCount}</Tag>}
          </TagsContainer>
        )}
      </CardContent>

      <CardActions>
        <ActionButton type="button" onClick={() => onEdit?.(item)}>
          <BiEditAlt aria-hidden="true" />
          Editar
        </ActionButton>
        <ActionButton type="button" $danger onClick={() => onDelete?.(item)}>
          <BiTrash aria-hidden="true" />
          Excluir
        </ActionButton>
      </CardActions>
    </CardContainer>
  );
};
