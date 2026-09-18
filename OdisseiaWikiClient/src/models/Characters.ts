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
    Destaque?: boolean;
    DataCriacao: string;
    Skills?: Skills[];
    Magia?: Magia[];
}

// ---- Status ----

export interface PersonagemStatus {
  generico?: boolean;
  variantes?: PersonagemVariante[];
  status: StatusBase;
  atributos: Atributos;
  nivel: number;
  xp: number;
  pontos?: number;
  pontosAtributo?: number;
  pontosSkill?: number;
  pontosUltimate?: number;
  condicioes?: string[];
  defesas: Defesas;
}

export interface PersonagemVariante {
  id: string;
  nome: string;
  statusJson: Omit<PersonagemStatus, 'generico' | 'variantes'>;
  inventarioJson: Item[];
  skills: Skills[];
  magia: Magia[];
}

export interface StatusBase {
  [codigo: string]: number;
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

export interface Defesas {
  [codigo: string]: number;
  armadura: number;
  protecao: number;
  escudo: number;
  outras: number;
}
