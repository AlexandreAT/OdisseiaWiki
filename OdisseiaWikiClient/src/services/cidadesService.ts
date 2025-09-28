import api from "../axios/api";

export interface CidadePayload {
  idcidade: number;
  nome: string;
  descricao?: string;
  imagem?: string;
  galeriaImagem?: string;
  dataCriacao?: string;
}

export interface ResultCidades {
  sucesso: boolean;
  mensagemErro?: string;
  cidades?: CidadePayload[];
}

export const getCidades = async (): Promise<ResultCidades> => {
  const response = await api.get("/cidades");
  return response.data;
};