import { JSONContent } from '../../../../../../models/Cities';
import { PontoDeInteresse } from '../../../../../../models/InfoLore';

export interface CityFormData {
  nome: string;
  descricao: string;
  imagem: string;
  galeriaImagem: string[];
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
  GaleriaImagem?: string[];
  Tags?: string[];
  PontosDeInteresse?: PontoDeInteresse[];
  Visivel: boolean;
  DataCriacao?: string;
}
