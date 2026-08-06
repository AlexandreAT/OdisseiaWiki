import type { SistemaRuntimeContexto } from './SistemaRpg';

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

export interface PersonagemJogador {
  idpersonagemJogador: number;
  idusuario: number;
  idmesa: number;
  idSistemaVersao?: number | null;
  nome: string;
  idraca: number;
  idcidade?: number;
  historia?: JSONContent | string;
  statusJson: string | PersonagemStatus;
  alinhamento?: string;
  tracos?: string;
  costumes?: string;
  infoSecundariasJson?: string;
  imagem?: string;
  galeriaImagem?: string;
  inventarioJson?: string;
  idpassiva?: number;
  ultimate?: string;
  nanites?: string;
  dataCriacao: string;
  skills?: string;
  magia?: string;
  personagemsVinculados?: string;
  racaNome?: string;
  cidadeNome?: string;
  mesaNome?: string;
  autorNome?: string;
  proficiencias?: ProficienciaResumo[];
  sistemaRuntime?: SistemaRuntimeContexto | null;
}

export interface ProficienciaResumo {
  idproficiencia: number;
  nome: string;
  descricao?: JSONContent | string;
}

// ---- Status ----

export interface PersonagemStatus {
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
