import { Principais, Secundarios } from './../models/Characters';
import api from "../axios/api";

export interface StatusJson {
  atributoInicial?: string;
  status: {
    vida: number;
    estamina: number;
    mana: number;
    capacidadeCarga?: number;
  };
  atributos?: {
    principais: Principais;
    secundarios: Secundarios;
  };
  nivel?: number;
  xp?: number;
  defesas?: Record<string, number>;
}

export interface RacaPayload {
  idraca: number;
  nome: string;
  statusJson?: StatusJson;
  imagem?: string;
  galeriaImagem?: string[];
}

export interface ResultRacas {
  sucesso: boolean;
  mensagemErro?: string;
  racas?: RacaPayload[];
}


export const getRacas = async (): Promise<ResultRacas> => {
  const response = await api.get("/racas");
  return response.data;
};