import { useSelector } from "react-redux";
import { Background, MainContainer, ContainerController, HeaderLogo, ContainerContent } from "./Login.style"
import { LogoButton } from "../../components/Generic/Logo/LogoButton";
import { ThemeNeonButtons } from "../../components/Generic/ThemeNeonButtons/ThemeNeonButtons";
import { ClipBox } from "../../components/Generic/ClipBox/ClipBox";
import { LoginField } from "./LoginField/LoginField";
import RegisterField from "./RegisterField/RegisterField";
import { useState } from "react";

const Login = () => {
  const { theme, neon } = useSelector((state: any) => state.themesReducer);
  const [isRegistering, setIsRegistering] = useState(false);

  return (
    <MainContainer>
      <Background />
      <ContainerController>
        <HeaderLogo>  
          <LogoButton theme={theme} neon={neon} />
          <ThemeNeonButtons />
        </HeaderLogo>
        <ContainerContent>
          <ClipBox theme={theme} neon={neon}>
            {isRegistering ? (
              <RegisterField theme={theme} neon={neon} onBackToLogin={() => setIsRegistering(false)} />
            ) : (
              <LoginField theme={theme} neon={neon} onRegisterClick={() => setIsRegistering(true)} />
            )}
          </ClipBox>
        </ContainerContent>
      </ContainerController>
    </MainContainer>
  )
}

export default Login