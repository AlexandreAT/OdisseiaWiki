export const PASSWORD_MINIMUM_LENGTH = 6;

export const validatePassword = (password: string) => {
  if (!password || password.trim().length < PASSWORD_MINIMUM_LENGTH) {
    return `Senha deve ter no mínimo ${PASSWORD_MINIMUM_LENGTH} caracteres.`;
  }

  return undefined;
};
