import { ItemTipo, JSONContent } from "../../../../../../models/Itens";

export interface ItemFormData {
  nome: string;
  tipo: ItemTipo;
  descricao?: JSONContent | string;
  peso?: number;
  quantidade: number;
  efeito?: string;

  imagem?: string;
  imagemFile?: File;

  atributos?: Record<string, any>;

  tags?: string[];
  visivel: boolean;
}

export interface ItemFormErrors {
  nome?: string;
  tipo?: string;
  quantidade?: string;
}

export interface ItemDto {
  nome: string;
  tipo: ItemTipo;
  descricao?: JSONContent | string;
  peso?: number;
  quantidade: number;
  efeito?: string;
  imagem?: string;
  atributosJson?: Record<string, any>;
  tags?: string[];
  visivel: boolean;
}