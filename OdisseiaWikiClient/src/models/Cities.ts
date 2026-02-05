export interface Cidade {
  Idcidade: number;
  Nome: string;
  Descricao?: string;
  Imagem?: string;
  GaleriaImagem?: string[];
  Tags?: string[];
  Visivel: boolean;
  DataCriacao: string;
}