import { Principais, Secundarios } from './../models/Characters';
import api from "../axios/api";

export interface PersonagemPayload {
  idpersonagem: string;
  nome: string;
  idraca: number;
  idcidade: number;
  historia: string;
  imagem?: string;
  costumes: string[];
  nanites?: number;
  alinhamento?: string;
  tracos: string[];
  inventarioJson: any[];
  skills: any[];
  magia: any[];
  personagemsVinculados: string[];
  tags?: string[];
  visivel: boolean;
  dataCriacao: string;
  statusJson: {
    status: {
      vida: number;
      estamina: number;
      mana: number;
      capacidadeCarga: number;
    };
    atributos: {
        principais: Principais;
        secundarios: Secundarios;
    };
    nivel: number;
    xp: number;
    defesas: Record<string, number>;
  };
}

export interface ResultPersonagem {
  sucesso: boolean;
  mensagemErro?: string;
  personagem?: PersonagemPayload;
}

export interface ResultPersonagens {
  sucesso: boolean;
  mensagemErro?: string;
  personagens?: PersonagemPayload[];
}

export const getPersonagens = async (visivel?: boolean): Promise<PersonagemPayload[]> => {
  const params = visivel !== undefined ? { visivel } : {};
  const response = await api.get("/personagens", { params });
  return response.data;
};

export const salvarPersonagem = async (
  payload: PersonagemPayload
): Promise<ResultPersonagem> => {
  const response = await api.post("/personagens", payload);
  return response.data;
};