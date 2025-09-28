export type SkillTipoString = "ataque" | "suporte" | "buff" | "debuff";
export type SkillElemento = "normal" | "fogo" | "agua" | "ar" | "terra" | "luz" | "escuridao" | "espacial" | "transfiguracao" | "invocacao";

export interface Skills {
  id?: string;
  nome: string;
  efeito?: string;
  tipo: SkillTipoString;
  elemento?: SkillElemento[];
  custo?: string;
  nivel?: number;
  atributos?: Record<string, any>;
}

// ---- Model de Atributos ----
export type SkillsAtributos =
  | AtaqueAtributos
  | SuporteAtributos
  | BuffAtributos
  | DebuffAtributos;

export interface AtaqueAtributos {
    dano?: number;
    especial: string;
    cooldown: string;
    bonus: string;
    acerto: string;
}

export interface SuporteAtributos {
    especial: string;
    cooldown: string;
    bonus: string;
    acerto: string;
}

export interface BuffAtributos {
    especial: string;
    cooldown: string;
    bonus: string;
    acerto: string;
}

export interface DebuffAtributos {
    especial: string;
    cooldown: string;
    bonus: string;
    acerto: string;
}