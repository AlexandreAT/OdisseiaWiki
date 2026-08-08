import styled from 'styled-components';
import { FallbackImage } from '../../../../../../components/Generic/FallbackImage/FallbackImage';
import { EntityType } from '../types';

interface StyledCardProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

const getEntityColor = (type: EntityType) => ({
  Page: 'var(--clearneonBlue)',
  InfoLore: 'var(--clearneonBlue)',
  Personagem: 'var(--clearneonPink)',
  Cidade: 'var(--clearneonYellow)',
  Raca: 'var(--clearneonGreen)',
  Item: 'var(--clearneonViolet)',
}[type]);

export const CardContainer = styled.article<StyledCardProps & { $type: EntityType }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 11px;
  width: 100%;
  max-width: 290px;
  height: 415px;
  min-width: 0;
  padding: 12px;
  box-sizing: border-box;
  overflow: hidden;
  border: 2px solid ${({ theme }) => theme === 'light' ? '#b9bec7' : '#333'};
  border-radius: 8px;
  background: ${({ theme }) => theme === 'light' ? '#f4f5f8' : '#1a1a1a'};
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;

  &:hover,
  &:focus-within {
    border-color: ${({ $type }) => getEntityColor($type)};
    box-shadow: ${({ neon, $type }) => neon === 'on'
      ? `0 0 14px ${getEntityColor($type)}`
      : '0 8px 18px rgba(0, 0, 0, 0.28)'};
    transform: translateY(-3px);
  }

  @media (max-width: 768px) {
    max-width: none;
    height: clamp(310px, calc(50vw + 145px), 390px);
    padding: 8px;
    gap: 7px;
  }
`;

export const CardMedia = styled.div<{ $type: EntityType }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: auto;
  flex: 0 0 auto;
  overflow: hidden;
  border-radius: 6px;
  background: transparent;
`;

export const CardImage = styled(FallbackImage)<{ $type: EntityType }>`
  width: 100%;
  height: auto;
  aspect-ratio: ${({ $type }) => $type === 'Personagem' || $type === 'Raca' || $type === 'Item'
    ? '1 / 1'
    : '16 / 9'};
  flex: 0 0 auto;
  border: ${({ $type }) => $type === 'Personagem' ? '2px solid var(--mediumgrey)' : '0'};
  border-radius: ${({ $type }) => $type === 'Personagem' ? '50%' : $type === 'Raca' || $type === 'Item' ? '6px' : '0'};
  color: ${({ $type }) => getEntityColor($type)};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

`;

export const CardHeader = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
`;

export const CardTitle = styled.h3<StyledCardProps>`
  display: -webkit-box;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: ${({ theme }) => theme === 'light' ? 'var(--black)' : 'var(--whitesmoke)'};
  font-size: 15px;
  font-weight: 600;
  line-height: 1.25;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;

  @media (max-width: 768px) { font-size: 12px; }
`;

export const EntityBadge = styled.span<{ $type: EntityType }>`
  flex: 0 0 auto;
  padding: 3px 7px;
  border: 1px solid ${({ $type }) => getEntityColor($type)} !important;
  border-radius: 999px;
  background-color: transparent !important;
  color: ${({ $type }) => getEntityColor($type)} !important;
  font-family: 'Cyberpunk Is Not Dead', sans-serif;
  font-size: 9px;
  letter-spacing: 0.5px;
`;

export const CardContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 7px;
  min-height: 0;
`;

export const ManagementMetadata = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

export const MetadataChip = styled.span<{ $active: boolean; $featured?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  border: 1px solid ${({ $active, $featured }) => $active
    ? $featured ? 'var(--clearneonYellow)' : 'var(--clearneonGreen)'
    : 'rgba(160, 166, 176, 0.48)'};
  border-radius: 4px;
  color: ${({ $active, $featured }) => $active
    ? $featured ? 'var(--clearneonYellow)' : 'var(--clearneonGreen)'
    : 'rgba(205, 210, 218, 0.66)'};
  font-size: 10px;
  white-space: nowrap;

  svg { width: 13px; height: 13px; }
`;

export const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  min-height: 0;
  overflow: hidden;
`;

export const Tag = styled.span`
  max-width: 100%;
  padding: 2px 6px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(125, 132, 145, 0.18);
  color: rgba(235, 238, 244, 0.72);
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const SlugText = styled.p<StyledCardProps>`
  margin: 0;
  overflow: hidden;
  color: ${({ neon }) => neon === 'on' ? 'var(--clearneonBlue)' : 'rgba(215, 221, 229, 0.68)'};
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const CardActions = styled.footer`
  display: flex;
  gap: 7px;
  margin-top: auto;
`;

export const ActionButton = styled.button<{ $danger?: boolean }>`
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-width: 0;
  min-height: 34px;
  padding: 5px 8px;
  border: 1px solid ${({ $danger }) => $danger ? 'rgba(255, 66, 94, 0.65)' : 'rgba(0, 212, 255, 0.65)'};
  border-radius: 4px;
  background: transparent;
  color: ${({ $danger }) => $danger ? 'var(--clearneonRed)' : 'var(--clearneonBlue)'};
  font-family: 'Cyberpunk Is Not Dead', sans-serif;
  font-size: 10px;
  cursor: pointer;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;

  &:hover,
  &:focus-visible {
    outline: none;
    background: ${({ $danger }) => $danger ? 'rgba(255, 66, 94, 0.12)' : 'rgba(0, 212, 255, 0.12)'};
    box-shadow: 0 0 7px currentColor;
  }

  svg { width: 14px; height: 14px; }
`;
