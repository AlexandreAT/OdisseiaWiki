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
  resistencia: number;
  agilidade: number;
  sabedoria: number;
  precisao: number;
  forca: number;
}

export interface Secundarios {
  sanidade: number;
  coragem: number;
  inteligencia: number;
  percepcao: number;
  labia: number;
  intimidacao: number;
}