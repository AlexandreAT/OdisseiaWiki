import { GalleryImage } from './GalleryImage';
import { JSONContent } from './Cities';

export interface Raca {
  Idraca: number;
  Nome: string;
  StatusJson: RacaStatus;
  Descricao?: JSONContent;
  Imagem?: string;
  GaleriaImagem?: GalleryImage[];
  Variacoes?: RacaVariacao[];
  Tags?: string[];
  Visivel: boolean;
  Destaque?: boolean;
  DataCriacao: string;
}

export interface RacaStatus {
  status: StatusBase;       
  atributoInicial: string;
  passivas: RacaPassiva[];
}

export interface RacaPassiva {
  nome: string;
  efeito?: string;
}

export interface RacaVariacao {
  nome: string;
  descricao?: string;
  efeito?: string;
  imagem?: string;
}

export interface StatusBase {
  vida: number;
  vidaMaxima: number;
  estamina: number;
  estaminaMaxima: number;
  mana: number;
  manaMaxima: number;
  capacidadeCarga: number;
}
