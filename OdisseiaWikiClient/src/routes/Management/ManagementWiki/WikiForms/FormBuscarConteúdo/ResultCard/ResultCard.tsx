import React from 'react';
import { CardProps } from '../types';
import {
  CardContainer,
  CardHeader,
  CardImage,
  CardTitle,
  EntityBadge,
  CardContent,
  TagsContainer,
  Tag,
  VisibilityIndicator,
  CardActions,
  ActionButton,
  InfoText,
} from './ResultCard.style';

export const ResultCard: React.FC<CardProps> = ({ theme, neon, item, onEdit, onDelete }) => {
  const getEntityLabel = (): string => {
    switch (item.tipoEntidade) {
      case 'Cidade':
        return 'Cidade';
      case 'Personagem':
        return 'NPC';
      case 'Item':
        return 'Item';
      case 'InfoLore':
        return 'Lore';
      case 'Raca':
        return 'Raça';
      default:
        return 'Desconhecido';
    }
  };

  const renderContent = () => {
    switch (item.tipoEntidade) {
      case 'Cidade':
        return (
          <InfoText theme={theme} neon={neon}>
            Localização do mundo de Odisseia
          </InfoText>
        );
      
      case 'Personagem':
        return (
          <InfoText theme={theme} neon={neon}>
            Personagem não-jogador (NPC)
          </InfoText>
        );
      
      case 'Item':
        return (
          <InfoText theme={theme} neon={neon}>
            Item do inventário
          </InfoText>
        );
      
      case 'InfoLore':
        return (
          <InfoText theme={theme} neon={neon}>
            Informação de lore do universo
          </InfoText>
        );
      
      case 'Raca':
        return (
          <InfoText theme={theme} neon={neon}>
            Raça jogável
          </InfoText>
        );
      
      default:
        return null;
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(item);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(item);
    }
  };

  return (
    <CardContainer theme={theme} neon={neon}>
      <VisibilityIndicator theme={theme} neon={neon} visivel={item.visivel} />
      
      <CardImage imageUrl={item.imagem} />
      
      <CardHeader>
        <CardTitle theme={theme} neon={neon} title={item.nome}>
          {item.nome}
        </CardTitle>
        <EntityBadge theme={theme} neon={neon}>
          {getEntityLabel()}
        </EntityBadge>
      </CardHeader>

      <CardContent>
        {renderContent()}
        
        {item.tags && item.tags.length > 0 && (
          <TagsContainer>
            {item.tags.map((tag: string, index: number) => (
              <Tag key={index} theme={theme} neon={neon}>
                {tag}
              </Tag>
            ))}
          </TagsContainer>
        )}
      </CardContent>

      <CardActions>
        <ActionButton theme={theme} neon={neon} onClick={handleEdit}>
          Editar
        </ActionButton>
        <ActionButton theme={theme} neon={neon} onClick={handleDelete}>
          Excluir
        </ActionButton>
      </CardActions>
    </CardContainer>
  );
};
