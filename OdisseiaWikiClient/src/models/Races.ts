// models/Raca.ts

export interface Raca {
  Idraca: number;
  Nome: string;
  StatusJson: RacaStatus;
  Imagem?: string;
  Variantes?: string[]; // ex: ["Alto Elfo", "Elfo Negro"]
  DataCriacao: string;
}

export interface RacaStatus {
  status: StatusBase;        // vida, estamina, mana, capacidade de carga
  atributoInicial: string; // principais/secundários base da raça
  passivas: string[];        // ex: "Visão no Escuro", "Resistência a Veneno"
}

// -- mesmo contrato já usado em personagens --
export interface StatusBase {
  vida: number;
  estamina: number;
  mana: number;
  capacidadeCarga: number;
}