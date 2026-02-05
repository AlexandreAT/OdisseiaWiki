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
  Descricao?: string;
  Imagem: string;
  GaleriaImagem?: string[];
  Tags?: string[];
  Visivel: boolean;
  DataCriacao?: string;
}
