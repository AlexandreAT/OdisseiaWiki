import { DadoAcerto } from './Dados';
import type { SistemaRuntimeContexto } from './SistemaRpg';

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

export type TrajeTipo = "colete" | "traje" | "armor_core";

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
  discricao?: number;
  descricao?: JSONContent | string;
  /** @deprecated O valor canônico agora fica em atributos.efeito. */
  efeito?: string;
  imagem?: string;
  /** Arquivo temporário de uma imagem personalizada da ficha. Nunca é enviado no JSON. */
  imagemArquivo?: File;
  atributos?: ItemAtributos | Record<string, any>;
  tags?: string[];
  visivel?: boolean;
  destaque?: boolean;
  dataCriacao?: string;
  idPersonagem?: number;
  idSistemaRpg?: number | null;
  idSistemaVersao?: number | null;
  acompanharPublicacaoAtual?: boolean;
  sistemaRuntime?: SistemaRuntimeContexto | null;
}

/**
 * Metadados puramente visuais da ficha. Eles viajam dentro de `atributos`
 * para participar do mesmo rascunho/salvamento do inventário, sem criar uma
 * segunda fonte de verdade no backend.
 */
export interface CharacterExplodedViewMeta {
  /** Stable local identity for draft rows that do not have a persisted id yet. */
  clientKey?: string;
  order?: number;
  position?: { x: number; y: number; rotation?: number };
  equippedSlot?: string;
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
  tipoTraje?: TrajeTipo;
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
