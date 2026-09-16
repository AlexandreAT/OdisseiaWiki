import { FormEvent, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { CyberButton } from '../../../components/Generic/HighlightButton/HighlightButton';
import { InputText } from '../../../components/Generic/InputText/InputText';
import TitleGlitch from '../../../components/Generic/TitleGlitch/TitleGlitch';
import {
  confirmEmail,
  requestPasswordRecovery,
  resendEmailConfirmation,
  resetPassword,
} from '../../../services/usuarioService';
import { validateEmail } from '../emailValidation';
import { validatePassword } from '../passwordValidation';
import { ButtonContainer, Form, InputContainer, Message } from './AccountActionField.style';
import { AccountActionFieldProps } from './AccountActionField.types';

const titles = {
  'email-confirmation': 'confirmação',
  'password-recovery': 'recuperar acesso',
  'password-reset': 'nova senha',
} as const;

export const AccountActionField = ({
  mode,
  theme,
  neon,
  token,
  initialEmail,
  onBackToLogin,
}: AccountActionFieldProps) => {
  const [email, setEmail] = useState(initialEmail ?? '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [passwordConfirmationError, setPasswordConfirmationError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string>();
  const [completed, setCompleted] = useState(false);
  const confirmationRequestRef = useRef<{ token: string; promise: ReturnType<typeof confirmEmail> }>();

  const isConfirmationLink = mode === 'email-confirmation' && !!token;

  useEffect(() => {
    setEmail(initialEmail ?? '');
  }, [initialEmail]);

  useEffect(() => {
    if (!isConfirmationLink || !token) return;

    let active = true;

    const confirm = async () => {
      setIsSubmitting(true);
      if (!confirmationRequestRef.current || confirmationRequestRef.current.token !== token) {
        confirmationRequestRef.current = {
          token,
          promise: confirmEmail(token),
        };
      }

      const result = await confirmationRequestRef.current.promise;

      if (!active) return;

      if (result.sucesso) {
        setCompleted(true);
        setFeedback('E-mail confirmado. Você já pode entrar.');
        toast.success('E-mail confirmado com sucesso!');
      } else {
        setFeedback(result.mensagemErro ?? 'Link de confirmação inválido ou expirado.');
      }
      setIsSubmitting(false);
    };

    void confirm();
    return () => { active = false; };
  }, [isConfirmationLink, token]);

  const submitEmailAction = async () => {
    const error = validateEmail(email);
    setEmailError(error);
    if (error) return;

    setIsSubmitting(true);
    const result = mode === 'password-recovery'
      ? await requestPasswordRecovery(email.trim())
      : await resendEmailConfirmation(email.trim());
    setIsSubmitting(false);

    if (!result.sucesso) {
      toast.error(result.mensagemErro ?? 'Não foi possível concluir a solicitação.');
      return;
    }

    setCompleted(true);
    setFeedback(mode === 'password-recovery'
      ? 'Se existir uma conta vinculada a este e-mail, enviaremos as instruções de recuperação e o nickname para entrar.'
      : 'Se houver uma conta pendente vinculada a este e-mail, enviaremos um novo link.');
  };

  const submitPasswordReset = async () => {
    const newPasswordError = validatePassword(password);
    const confirmationError = password === passwordConfirmation ? undefined : 'As senhas não coincidem.';
    setPasswordError(newPasswordError);
    setPasswordConfirmationError(confirmationError);
    if (newPasswordError || confirmationError || !token) return;

    setIsSubmitting(true);
    const result = await resetPassword(token, password, passwordConfirmation);
    setIsSubmitting(false);

    if (!result.sucesso) {
      toast.error(result.mensagemErro ?? 'Não foi possível redefinir a senha.');
      return;
    }

    setCompleted(true);
    setFeedback('Senha alterada com sucesso. Entre com sua nova senha.');
    toast.success('Senha alterada com sucesso!');
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (completed || isConfirmationLink) return;

    if (mode === 'password-reset') {
      void submitPasswordReset();
      return;
    }

    void submitEmailAction();
  };

  const message = feedback
    ?? (isConfirmationLink
      ? 'Confirmando seu e-mail...'
      : mode === 'email-confirmation'
        ? 'Confira sua caixa de entrada para confirmar sua conta.'
        : mode === 'password-recovery'
          ? 'Informe seu e-mail para receber as instruções de recuperação e o nickname para entrar.'
          : 'Defina uma nova senha para sua conta.');

  return (
    <Form onSubmit={handleSubmit}>
      <TitleGlitch theme={theme} neon={neon} text={titles[mode]} />
      <Message $success={completed}>{message}</Message>

      {!completed && !isConfirmationLink && mode !== 'password-reset' && (
        <InputContainer>
          <InputText
            theme={theme}
            neon={neon}
            label="E-mail"
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            onFocus={() => setEmailError(undefined)}
            error={!!emailError}
            errorMessage={emailError}
            required
            width="100%"
            name="email"
            autoComplete="email"
          />
        </InputContainer>
      )}

      {!completed && mode === 'password-reset' && (
        <InputContainer>
          <InputText
            theme={theme}
            neon={neon}
            label="Nova senha"
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            onFocus={() => setPasswordError(undefined)}
            error={!!passwordError}
            errorMessage={passwordError}
            required
            width="100%"
            name="new-password"
            autoComplete="new-password"
          />
          <InputText
            theme={theme}
            neon={neon}
            label="Confirmar nova senha"
            type="password"
            value={passwordConfirmation}
            onChange={event => setPasswordConfirmation(event.target.value)}
            onFocus={() => setPasswordConfirmationError(undefined)}
            error={!!passwordConfirmationError}
            errorMessage={passwordConfirmationError}
            required
            width="100%"
            name="confirm-new-password"
            autoComplete="new-password"
          />
        </InputContainer>
      )}

      <ButtonContainer>
        {!completed && !isConfirmationLink && (
          <CyberButton
            colorType="primary"
            text={mode === 'password-reset' ? 'Salvar senha' : 'Enviar e-mail'}
            theme={theme}
            neon={neon}
            type="submit"
            width="170px"
            loading={isSubmitting}
          />
        )}
        <CyberButton
          colorType="secondary"
          text="Voltar ao login"
          theme={theme}
          neon={neon}
          type="button"
          onClick={onBackToLogin}
          width="170px"
          disabled={isSubmitting}
        />
      </ButtonContainer>
    </Form>
  );
};
