export interface PersonagemJogador {
  idpersonagemJogador: number;
  idusuario: number;
  idmesa: number;
  nome: string;
  idraca: number;
  idcidade?: number;
  historia?: string;
  statusJson: string;
  alinhamento?: string;
  tracos?: string;
  costumes?: string;
  infoSecundariasJson?: string;
  imagem?: string;
  galeriaImagem?: string;
  inventarioJson?: string;
  nanites?: string;
  dataCriacao: string;
  skills?: string;
  magia?: string;
  personagemsVinculados?: string;
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
  estamina: number;
  mana: number;
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
