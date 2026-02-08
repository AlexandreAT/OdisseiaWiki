export type JSONContent = {
  type?: string;
  attrs?: Record<string, any>;
  content?: JSONContent[];
  marks?: Array<{
    type: string;
    attrs?: Record<string, any>;
    [key: string]: any;
  }>;
  text?: string;
  [key: string]: any;
};

export interface Cidade {
  Idcidade: number;
  Nome: string;
  Descricao?: JSONContent;
  Imagem?: string;
  GaleriaImagem?: string[];
  Tags?: string[];
  Visivel: boolean;
  DataCriacao: string;
}