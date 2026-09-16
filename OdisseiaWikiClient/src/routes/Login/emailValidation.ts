export const validateEmail = (email: string) => {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'E-mail inválido.';
  }

  return undefined;
};
