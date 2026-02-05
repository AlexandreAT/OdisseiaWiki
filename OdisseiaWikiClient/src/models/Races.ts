export interface Raca {
  Idraca: number;
  Nome: string;
  StatusJson: RacaStatus;
  Imagem?: string;
  Variantes?: string[];
  Tags?: string[];
  Visivel: boolean;
  DataCriacao: string;
}

export interface RacaStatus {
  status: StatusBase;       
  atributoInicial: string;
  passivas: string[];       
}

export interface StatusBase {
  vida: number;
  estamina: number;
  mana: number;
  capacidadeCarga: number;
}