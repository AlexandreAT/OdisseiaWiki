import api from "../axios/api";
import { Mesa } from "../models/Mesa";

// GET todas as mesas
export const getMesas = async (): Promise<Mesa[]> => {
  const response = await api.get("/Mesa");
  return response.data;
};

// GET mesa por ID
export const getMesaById = async (id: number): Promise<Mesa | null> => {
  const response = await api.get(`/Mesa/${id}`);
  return response.data;
};

// POST criar nova mesa
export const criarMesa = async (payload: Partial<Mesa>): Promise<Mesa> => {
  const response = await api.post("/Mesa", payload);
  return response.data;
};

// PUT atualizar mesa
export const atualizarMesa = async (id: number, payload: Partial<Mesa>): Promise<Mesa> => {
  const response = await api.put(`/Mesa/${id}`, payload);
  return response.data;
};

// DELETE mesa
export const deletarMesa = async (id: number) => {
  await api.delete(`/Mesa/${id}`);
};