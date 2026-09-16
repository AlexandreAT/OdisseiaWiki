import { validatePassword } from '../passwordValidation';
import { validateEmail } from '../emailValidation';

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
    errors.userName = 'Nome deve ter pelo menos 3 caracteres.';
  }

  const emailError = validateEmail(data.email);
  if (emailError) {
    errors.email = emailError;
  }

  if (data.phone && data.phone.trim().length < 8) {
    errors.phone = 'Número de celular inválido.';
  }

  const passwordError = validatePassword(data.password);
  if (passwordError) {
    errors.password = passwordError;
  }

  if (!data.nickname || data.nickname.trim().length < 2) {
    errors.nickname = 'Nickname deve ter pelo menos 2 caracteres.';
  }

  return errors;
}
