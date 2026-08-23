import { DadoAcerto } from './Dados';
import { JSONContent } from './Characters';

export type MagiaTipoString = "ataque" | "suporte" | "buff" | "debuff";
export type MagiaElemento = "fogo" | "agua" | "ar" | "terra" | "luz" | "escuridao" | "espacial" | "transfiguracao" | "invocacao";

export interface Magia {
  id?: string;
  nome: string;
  efeito?: JSONContent | string;
  tipo: MagiaTipoString;
  elemento?: MagiaElemento[];
  custo?: string;
  imagem?: string;
  /** Arquivo temporário de uma imagem personalizada da ficha. Nunca é enviado no JSON. */
  imagemArquivo?: File;
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
    acerto?: DadoAcerto;
}

export interface SuporteAtributos {
    especial: string;
    bonus: string;
    acerto?: DadoAcerto;
}

export interface BuffAtributos {
    especial: string;
    bonus: string;
    acerto?: DadoAcerto;
}

export interface DebuffAtributos {
    especial: string;
    bonus: string;
    acerto?: DadoAcerto;
}
