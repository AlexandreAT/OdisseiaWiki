export type JSONContent = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: JSONContent[];
  marks?: Array<{
    type: string;
    attrs?: Record<string, unknown>;
    [key: string]: unknown;
  }>;
  text?: string;
  [key: string]: unknown;
};

export interface PontoDeInteresse {
  nome: string;
  descricao?: string;
  imagem?: string;
}

export interface Cidade {
  Idcidade: number;
  Nome: string;
  Descricao?: JSONContent;
  Imagem?: string;
  GaleriaImagem?: GalleryImage[];
  Tags?: string[];
  PontosDeInteresse?: PontoDeInteresse[];
  Visivel: boolean;
  Destaque?: boolean;
  DataCriacao: string;
}
import { GalleryImage } from './GalleryImage';
