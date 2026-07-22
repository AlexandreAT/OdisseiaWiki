import { ItemAtributos, ItemTipo, JSONContent } from "../../../../../../models/Itens";

export interface ItemFormData {
  nome: string;
  tipo: ItemTipo;
  descricao?: JSONContent | string;
  peso?: number;
  quantidade: number;
  imagem?: string;
  imagemFile?: File;

  atributos?: ItemAtributos;

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
  imagem?: string;
  atributosJson?: ItemAtributos;
  tags?: string[];
  visivel: boolean;
}
