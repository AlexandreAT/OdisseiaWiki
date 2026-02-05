import api from "../axios/api";

export interface ItemPayload {
  iditem?: string;
  nome: string;
  tipo: string;
  descricao?: string;
  peso?: number;
  quantidade: number;
  efeito?: string;
  imagem?: string;
  atributosJson?: string;
  iditemBase?: string;
  idpersonagem?: number;
  tags?: string[];
  visivel?: boolean;
  dataCriacao?: string;
}

export interface ResultItem {
  sucesso: boolean;
  mensagemErro?: string;
  item?: ItemPayload;
}

export const getItens = async (): Promise<ItemPayload[]> => {
  const response = await api.get("/item");
  return response.data;
};

export const getItemById = async (id: string): Promise<ItemPayload> => {
  const response = await api.get(`/item/${id}`);
  return response.data;
};

export const salvarItem = async (
  payload: ItemPayload
): Promise<ResultItem> => {
  const response = await api.post("/item", payload);
  return response.data;
};

export const atualizarItem = async (
  id: string,
  payload: ItemPayload
): Promise<boolean> => {
  const response = await api.put(`/item/${id}`, payload);
  return response.status === 204;
};

export const excluirItem = async (id: string): Promise<boolean> => {
  const response = await api.delete(`/item/${id}`);
  return response.status === 204;
};