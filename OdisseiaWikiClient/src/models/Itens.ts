export type ItemTipo = "arma" | "traje" | "consumiveis" | "acessorio" | "outro";

// ---- Model de Item ----
export interface Item {
  id?: string;
  idItemBase?: string;
  nome: string;
  tipo: ItemTipo;
  quantidade: number;
  peso?: number;
  descricao?: string;
  efeito?: string;
  imagem?: string;
  atributos?: ItemAtributos | Record<string, any>;
  dataCriacao?: string;
  idPersonagem?: number;
}

// ---- Model de Atributos ----
export type ItemAtributos =
  | ArmaAtributos
  | TrajeAtributos
  | ConsumiveisAtributos
  | AcessorioAtributos
  | OutrosAtributos;

export interface ArmaAtributos {
  danoPorAlcance?: {
    curta?: number;
    media?: number;
    longa?: number;
    emArea?: number;
    preciso?: number;
  };
  municao?: {
    capacidade: number;
    atual: number;
  };
  ataquesPorTurno?: number;
  bonus?: string[];
  especial?: string;
}

export interface TrajeAtributos {
  armaduraBase: number;
  protecaoBase: number;
  escudoBase: number;
  resistencias?: string[];
  penalidades?: string[];
  especial?: string;
}

export interface ConsumiveisAtributos {
  restaura?: {
    vida?: number;
    estamina?: number;
    mana?: number;
  };
  duracao?: string;
}

export interface AcessorioAtributos {
  bonus?: string[];
  slot?: string;
  duracao?: string;
}

export interface OutrosAtributos {
  especial?: string;
  duracao?: string;
}

// FAZER DEPOIS
export interface ProteseAtributos {
  danoPorAlcance?: {
    curta?: number;
    media?: number;
    longa?: number;
    emArea?: number;
    preciso?: number;
  };
  municao?: {
    capacidade: number;
    atual: number;
  };
  ataquesPorTurno?: number;
  bonus?: string[];
  especial?: string;
}