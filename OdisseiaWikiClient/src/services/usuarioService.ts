import api from '../axios/api';

export interface RegisterUsuarioPayload {
  nome: string;
  email: string;
  senha: string;
  nickname: string;
  imagemUrl?: string;
}

export interface LoginGoogleDto {
  tokenGoogle: string;
}

export interface ResultLoginUsuario {
  sucesso: boolean;
  mensagemErro?: string;
  tokenJwt?: string;
}

export interface LoginUsuarioDto {
  nickname: string;
  senha: string;
}

export const login = async (
  dto: LoginUsuarioDto
): Promise<ResultLoginUsuario> => {
  const response = await api.post('/usuarios/login', dto);
  return response.data;
};

export const registerUsuario = async (payload: RegisterUsuarioPayload) => {
  const response = await api.post('/usuarios/register', payload);
  return response.data;
};

export const loginComGoogle = async (
  dto: LoginGoogleDto
): Promise<ResultLoginUsuario> => {
  const response = await api.post('/usuarios/google-login', dto);
  return response.data;
};