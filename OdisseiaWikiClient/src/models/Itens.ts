import { DadoAcerto } from './Dados';

export type ItemTipo = "arma" | "traje" | "consumiveis" | "acessorio" | "implante" | "outro";

export type ArmaTipo =
  | "pistola_revolver"
  | "smg"
  | "rifle_assalto"
  | "shotgun"
  | "rifle_atirador"
  | "rifle_precisao"
  | "arma_branca_comum"
  | "arma_branca_menor"
  | "arma_energizada"
  | "arma_fotons"
  | "sabre_luz"
  | "desarmado"
  | "protese"
  | "soco_ingles"
  | "dano_continuo"
  | "arco"
  | "crossbow"
  | "arma_pesada"
  | "arma_pesada_area";

export type ArmaTipoDano =
  | "cortante"
  | "impacto_projetil"
  | "perfuracao"
  | "continuo"
  | "impacto"
  | "magico"
  | "area"
  | "verdadeiro"
  | "queda";

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
  /** @deprecated O valor canônico agora fica em atributos.efeito. */
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
  efeito?: string;
  tipoArma?: ArmaTipo;
  tipoDano?: ArmaTipoDano;
  danoBase?: number;
  danoPorAlcance?: {
    curta?: number;
    media?: number;
    longa?: number;
    emArea?: number;
    preciso?: number;
  };
  cadencia?: number;
  capacidadeUso?: number;
  capacidadeMunicao?: number;
  gastoEstaminaPorAtaque?: number;
  acerto?: DadoAcerto;
  duracaoEfeito?: string;
  /** @deprecated Compatibilidade com armas salvas antes do campo cadencia. */
  ataquesPorTurno?: number;
  /** @deprecated Compatibilidade com armas salvas antes do campo capacidadeMunicao. */
  municao?: {
    capacidade: number;
    atual: number;
  };
  bonus?: string[];
  especial?: string;
}

export interface TrajeAtributos {
  efeito?: string;
  armaduraBase: number;
  protecaoBase: number;
  escudoBase: number;
  resistencias?: string[];
  penalidades?: string[];
  especial?: string;
}

export interface ConsumiveisAtributos {
  efeito?: string;
  especial?: string;
  restaura?: {
    vida?: number;
    estamina?: number;
    mana?: number;
  };
  duracao?: string;
}

export interface AcessorioAtributos {
  efeito?: string;
  bonus?: string[];
  slot?: string;
  duracao?: string;
}

export interface OutrosAtributos {
  efeito?: string;
  especial?: string;
  duracao?: string;
}

export interface ImplanteAtributos {
  efeito?: string;
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
