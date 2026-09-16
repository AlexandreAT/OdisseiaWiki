import { useSelector } from "react-redux";
import { Background, MainContainer, ContainerController, HeaderLogo, ContainerContent } from "./Login.style"
import { LogoButton } from "../../components/Generic/Logo/LogoButton";
import { ThemeNeonButtons } from "../../components/Generic/ThemeNeonButtons/ThemeNeonButtons";
import { ClipBox } from "../../components/Generic/ClipBox/ClipBox";
import { LoginField } from "./LoginField/LoginField";
import RegisterField from "./RegisterField/RegisterField";
import { useState } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AccountActionField, AccountActionMode } from './AccountActionField';

type LoginScreen = 'login' | 'register' | AccountActionMode;

interface RootState {
  themesReducer: {
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
  };
}

const Login = () => {
  const { theme, neon } = useSelector((state: RootState) => state.themesReducer);
  const [screen, setScreen] = useState<LoginScreen>('login');
  const [verificationEmail, setVerificationEmail] = useState<string>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const confirmationToken = searchParams.get('confirmEmail') || undefined;
  const resetToken = searchParams.get('resetPassword') || undefined;
  const isRecoveryRequest = searchParams.get('recover') === 'true';
  const queryAction: AccountActionMode | undefined = confirmationToken
    ? 'email-confirmation'
    : resetToken
      ? 'password-reset'
      : isRecoveryRequest
        ? 'password-recovery'
        : undefined;
  const activeScreen = queryAction ?? screen;

  const returnToLogin = () => {
    setScreen('login');
    setVerificationEmail(undefined);
    if (queryAction) navigate('/login', { replace: true });
  };

  return (
    <MainContainer>
      <Background />
      <ContainerController>
        <HeaderLogo>  
          <LogoButton theme={theme} neon={neon} />
          <ThemeNeonButtons />
        </HeaderLogo>
        <ContainerContent>
          <ClipBox theme={theme} neon={neon} mobileAutoHeight useClip={false}>
            {activeScreen === 'register' && (
              <RegisterField
                theme={theme}
                neon={neon}
                onBackToLogin={returnToLogin}
                onRegistrationSuccess={(email) => {
                  setVerificationEmail(email);
                  setScreen('email-confirmation');
                }}
              />
            )}
            {activeScreen === 'login' && (
              <LoginField
                theme={theme}
                neon={neon}
                onRegisterClick={() => setScreen('register')}
                onEmailConfirmationRequired={(email) => {
                  setVerificationEmail(email);
                  setScreen('email-confirmation');
                }}
              />
            )}
            {(activeScreen === 'email-confirmation'
              || activeScreen === 'password-recovery'
              || activeScreen === 'password-reset') && (
              <AccountActionField
                mode={activeScreen}
                theme={theme}
                neon={neon}
                token={confirmationToken ?? resetToken}
                initialEmail={verificationEmail}
                onBackToLogin={returnToLogin}
              />
            )}
          </ClipBox>
        </ContainerContent>
      </ContainerController>
    </MainContainer>
  )
}

export default Login
