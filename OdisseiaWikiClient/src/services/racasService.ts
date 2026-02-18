import api from "../axios/api";

export interface StatusBase {
  vida: number;
  estamina: number;
  mana: number;
  capacidadeCarga: number;
}

export interface RacaStatus {
  status: StatusBase;
  atributoInicial: string;
  passivas: string[];
}

export interface RacaPayload {
  idraca: number;
  nome: string;
  statusJson: RacaStatus;
  imagem?: string;
  galeriaImagem?: string[];
  tags?: string[];
  visivel: boolean;
  dataCriacao?: string;
}

export interface CreateRacaDto {
  Nome: string;
  StatusJson: RacaStatus;
  Imagem?: string;
  GaleriaImagem?: string[];
  Tags?: string[];
  Visivel: boolean;
}

export interface ResultRacas {
  sucesso: boolean;
  mensagemErro?: string;
  racas?: RacaPayload[];
}

export interface ResultRaca {
  sucesso: boolean;
  mensagemErro?: string;
  raca?: RacaPayload;
}

// READ
export const getRacas = async (visivel?: boolean): Promise<ResultRacas> => {
  const params = visivel !== undefined ? { visivel } : {};
  const response = await api.get("/racas", { params });
  return response.data;
};

export const getRacaById = async (id: number): Promise<ResultRaca> => {
  const response = await api.get(`/racas/${id}`);
  return response.data;
};

// CREATE
export const createRaca = async (dto: CreateRacaDto): Promise<ResultRaca> => {
  const response = await api.post("/racas", dto);
  return response.data;
};

// UPDATE
export const updateRaca = async (id: number, dto: CreateRacaDto): Promise<ResultRaca> => {
  const response = await api.put(`/racas/${id}`, dto);
  return response.data;
};

// DELETE
export const deleteRaca = async (id: number): Promise<boolean> => {
  const response = await api.delete(`/racas/${id}`);
  return response.status === 204 || response.status === 200;
};