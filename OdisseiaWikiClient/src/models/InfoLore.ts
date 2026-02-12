export interface InfoLore {
  IdinfoLore: number;
  Titulo: string;
  Descricao?: string;
  Imagem?: string;
  Ordem?: number;
  Tags?: string;
  Visivel: boolean;
  DataCriacao: string;
}

export interface PontoDeInteresse {
  id: number;
  titulo: string;
}
