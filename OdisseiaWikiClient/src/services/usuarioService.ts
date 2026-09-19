import api from '../axios/api';
import { getApiErrorMessage } from '../utils/apiError';

export interface RegisterUsuarioPayload {
  nome: string;
  email: string;
  senha: string;
  nickname: string;
  celular?: string;
  imagemUrl?: string;
}

export interface LoginGoogleDto {
  tokenGoogle: string;
}

export interface ResultLoginUsuario {
  sucesso: boolean;
  mensagemErro?: string;
  tokenJwt?: string;
  emailNaoConfirmado?: boolean;
  email?: string;
}

export interface LoginUsuarioDto {
  nickname: string;
  senha: string;
}

export interface AccountActionResult {
  sucesso: boolean;
  mensagemErro?: string;
}

export interface UsuarioPerfil {
  id: number;
  nome: string;
  email: string;
  celular?: string | null;
  nickname: string;
  imagemUrl?: string | null;
}

export interface UsuarioPerfilAtualizado {
  perfil: UsuarioPerfil;
  tokenJwt: string;
}

const resultFromError = (error: unknown): AccountActionResult => {
  const data = (error as { response?: { data?: unknown } })?.response?.data;

  if (data && typeof data === 'object' && 'sucesso' in data) {
    return data as AccountActionResult;
  }

  return {
    sucesso: false,
    mensagemErro: getApiErrorMessage(error, 'Não foi possível concluir a solicitação.'),
  };
};

export const login = async (
  dto: LoginUsuarioDto
): Promise<ResultLoginUsuario> => {
  try {
    const response = await api.post('/usuarios/login', dto);
    return response.data;
  } catch (error) {
    return resultFromError(error);
  }
};

export const registerUsuario = async (payload: RegisterUsuarioPayload) => {
  try {
    const response = await api.post('/usuarios/register', payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Não foi possível cadastrar a conta.'));
  }
};

export const loginComGoogle = async (
  dto: LoginGoogleDto
): Promise<ResultLoginUsuario> => {
  const response = await api.post('/usuarios/google-login', dto);
  return response.data;
};

export const requestPasswordRecovery = async (email: string): Promise<AccountActionResult> => {
  try {
    const response = await api.post('/usuarios/password-recovery', { email });
    return response.data;
  } catch (error) {
    return resultFromError(error);
  }
};

export const resendEmailConfirmation = async (email: string): Promise<AccountActionResult> => {
  try {
    const response = await api.post('/usuarios/email-confirmation/resend', { email });
    return response.data;
  } catch (error) {
    return resultFromError(error);
  }
};

export const confirmEmail = async (token: string): Promise<AccountActionResult> => {
  try {
    const response = await api.post('/usuarios/email-confirmation/confirm', { token });
    return response.data;
  } catch (error) {
    return resultFromError(error);
  }
};

export const resetPassword = async (
  token: string,
  novaSenha: string,
  confirmacaoSenha: string,
): Promise<AccountActionResult> => {
  try {
    const response = await api.post('/usuarios/password-reset', {
      token,
      novaSenha,
      confirmacaoSenha,
    });
    return response.data;
  } catch (error) {
    return resultFromError(error);
  }
};

export const getCurrentUserProfile = async (): Promise<UsuarioPerfil> => {
  const response = await api.get<UsuarioPerfil>('/usuarios/me');
  return response.data;
};

export const updateCurrentUserProfile = async (payload: {
  nickname: string;
  imagemUrl?: string | null;
}): Promise<UsuarioPerfilAtualizado> => {
  const response = await api.patch<UsuarioPerfilAtualizado>('/usuarios/me', payload);
  return response.data;
};

export const requestCurrentUserPasswordRecovery = async (): Promise<AccountActionResult> => {
  try {
    const response = await api.post<AccountActionResult>('/usuarios/me/password-recovery');
    return response.data;
  } catch (error) {
    return resultFromError(error);
  }
};

export const deleteCurrentUserAccount = async (confirmacao: string): Promise<void> => {
  await api.delete('/usuarios/me', { data: { confirmacao } });
};
