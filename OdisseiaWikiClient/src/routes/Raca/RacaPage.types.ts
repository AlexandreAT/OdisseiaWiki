import { RacaPassiva, RacaVariacao } from '../../services/racasService';

export type RacaListModal = 'description' | 'passives' | 'variations' | 'gallery' | 'characters' | null;

export interface RaceGalleryImage {
  url: string;
  caption?: string;
}

export type SelectedRaceDetail =
  | { type: 'passive'; value: RacaPassiva }
  | { type: 'variation'; value: RacaVariacao }
  | null;
