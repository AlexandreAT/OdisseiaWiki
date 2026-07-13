export type ItemTipo = "arma" | "traje" | "consumiveis" | "acessorio" | "implante" | "outro";

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

// ---- Model de Item ----
export interface Item {
  id?: string;
  idItemBase?: string;
  nome: string;
  tipo: ItemTipo;
  quantidade: number;
  peso?: number;
  descricao?: JSONContent | string;
  efeito?: string;
  imagem?: string;
  atributos?: ItemAtributos | Record<string, any>;
  tags?: string[];
  visivel?: boolean;
  destaque?: boolean;
  dataCriacao?: string;
  idPersonagem?: number;
}

// ---- Model de Atributos ----
export type ItemAtributos =
  | ArmaAtributos
  | TrajeAtributos
  | ConsumiveisAtributos
  | AcessorioAtributos
  | ImplanteAtributos
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

export interface ImplanteAtributos {
  parteCorpo?: 'mao' | 'braco' | 'pe' | 'perna' | 'corpo' | 'ocular' | 'outro';
  lado?: 'direito' | 'esquerdo' | 'ambos' | 'nao-se-aplica';
  material?: 'simples' | 'carbono' | 'blindada' | 'arcana' | 'titanio' | 'sicmithril' | 'outro';
  modelo?: string;
  slotsModificacao?: number;
  slotsLacrima?: number;
  necessitaAmputacao?: boolean;
  bonus?: {
    vida?: number;
    mana?: number;
    estamina?: number;
    resistencia?: number;
    forca?: number;
    agilidade?: number;
    precisao?: number;
    sabedoria?: number;
  };
  especiais?: string[];
  modificacoes?: Array<{ nome: string; descricao: string }>;
  lacrimas?: Array<{ nome: string; descricao: string }>;
}
