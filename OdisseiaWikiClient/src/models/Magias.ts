export type MagiaTipoString = "ataque" | "suporte" | "buff" | "debuff";
export type MagiaElemento = "fogo" | "agua" | "ar" | "terra" | "luz" | "escuridao" | "espacial" | "transfiguracao" | "invocacao";

export interface Magia {
  id?: string;
  nome: string;
  efeito?: string;
  tipo: MagiaTipoString;
  elemento?: MagiaElemento[];
  custo?: string;
  atributos?: Record<string, any>;
}

// ---- Model de Atributos ----
export type MagiasAtributos =
  | AtaqueAtributos
  | SuporteAtributos
  | BuffAtributos
  | DebuffAtributos;

export interface AtaqueAtributos {
    dano?: number;
    especial: string;
    bonus: string;
    acerto: string;
}

export interface SuporteAtributos {
    especial: string;
    bonus: string;
    acerto: string;
}

export interface BuffAtributos {
    especial: string;
    bonus: string;
    acerto: string;
}

export interface DebuffAtributos {
    especial: string;
    bonus: string;
    acerto: string;
}