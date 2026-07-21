import { PageDto } from '../../models/Pages';
import { PersonagemPayload } from '../../services/personagensService';

export type CidadeModal = 'description' | 'characters' | 'points' | 'gallery' | null;

export interface CidadePoint {
  id: string;
  nome: string;
  descricao?: string;
  imagem?: string;
}

export interface CidadeRelatedPage extends PageDto {
  idPage: number;
}

export interface CityCharacterCardProps {
  character: PersonagemPayload;
  onSelect: (character: PersonagemPayload) => void;
}

export interface CityPointCardProps {
  point: CidadePoint;
}

export interface CityGalleryImage {
  url: string;
  caption?: string;
}
