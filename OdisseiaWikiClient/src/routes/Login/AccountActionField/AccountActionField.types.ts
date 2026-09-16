export type AccountActionMode =
  | 'email-confirmation'
  | 'password-recovery'
  | 'password-reset';

export interface AccountActionFieldProps {
  mode: AccountActionMode;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  token?: string;
  initialEmail?: string;
  onBackToLogin: () => void;
}
