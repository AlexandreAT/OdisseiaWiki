import { Magia } from './Magias';
import { Item } from "./Itens";
import { Skills } from "./Skills";

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

export interface Personagem {
    Idpersonagem: number;
    Nome: string;
    Idraca?: number;
    Idcidade?: number;
    Historia?: JSONContent;
    StatusJson: PersonagemStatus;
    Alinhamento?: string;
    Tracos?: string[];
    Costumes?: string[];
    Imagem?: string;
    InventarioJson?: Item[];
    PersonagemsVinculados?: number[];
    Nanites?: number;
    Tags?: string[];
    Visivel: boolean;
    DataCriacao: string;
    Skills?: Skills[];
    Magia?: Magia[];
}

// ---- Status ----

export interface PersonagemStatus {
  status: StatusBase;
  atributos: Atributos;
  nivel: number;
  xp: number;
  defesas: Defesas;
}

export interface StatusBase {
  vida: number;
  vidaMaxima: number;
  estamina: number;
  estaminaMaxima: number;
  mana: number;
  manaMaxima: number;
  capacidadeCarga: number;
}

export interface Atributos {
  principais: Principais;
  secundarios: Secundarios;
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

export interface Defesas {
  armadura: number;
  protecao: number;
  escudo: number;
  outras: number;
}