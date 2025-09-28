export interface RegisterFormData {
  userName: string;
  email: string;
  phone: string;
  password: string;
  nickname: string;
}

export interface RegisterFormErrors {
  userName?: string;
  email?: string;
  phone?: string;
  password?: string;
  nickname?: string;
}

export function validateRegisterForm(data: RegisterFormData): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  if (!data.userName || data.userName.trim().length < 3) {
    errors.userName = 'Nome de usuário deve ter pelo menos 3 caracteres.';
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'E-mail inválido.';
  }

  if (data.phone && data.phone.trim().length < 8) {
    errors.phone = 'Número de celular inválido.';
  }

  if (!data.password || data.password.trim().length < 6) {
    errors.password = 'Senha deve ter no mínimo 6 caracteres.';
  }

  if (!data.nickname || data.nickname.trim().length < 2) {
    errors.nickname = 'Nickname deve ter pelo menos 2 caracteres.';
  }

  return errors;
}
