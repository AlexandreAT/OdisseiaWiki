export interface CharacterFormData {
  name: string;
  race?: number;
  city?: number;
}

export interface CharacterFormErrors {
  name?: string;
  race?: string;
}

export interface Principais {
  [codigo: string]: number;
  resistencia: number;
  agilidade: number;
  sabedoria: number;
  precisao: number;
  forca: number;
}

export interface Secundarios {
  [codigo: string]: number;
  sanidade: number;
  coragem: number;
  inteligencia: number;
  percepcao: number;
  labia: number;
  intimidacao: number;
}
