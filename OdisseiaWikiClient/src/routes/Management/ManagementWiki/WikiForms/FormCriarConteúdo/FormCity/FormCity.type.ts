import { JSONContent, PontoDeInteresse } from '../../../../../../models/Cities';

export interface CityFormData {
  nome: string;
  descricao: string;
  imagem: string;
  galeriaImagem: GalleryImage[];
  imagemFile?: File;
  galeriaFiles?: File[];
}

export interface CityFormErrors {
  nome?: string;
  imagem?: string;
}

export interface CidadeDto {
  Idcidade?: number;
  Nome: string;
  Descricao?: JSONContent | string;
  Imagem: string;
  GaleriaImagem?: GalleryImage[];
  Tags?: string[];
  PontosDeInteresse?: PontoDeInteresse[];
  Visivel: boolean;
  Destaque?: boolean;
  DataCriacao?: string;
}
import { GalleryImage } from '../../../../../../models/GalleryImage';
