import { useSelector } from 'react-redux';
import { ContainerNavbar, ContainerLogo, Options, ContainerTheme } from './Navbar.style';
import { LogoButton } from '../Logo/LogoButton';
import { ThemeNeonButtons } from '../ThemeNeonButtons/ThemeNeonButtons';
import { NavbarLinks } from './NavbarLinks/NavbarLinks';

interface RootState {
    themesReducer: {
        theme: 'dark' | 'light';
        neon: 'on' | 'off';
    }
}

export const Navbar = () => {
    const { theme, neon } = useSelector((state: RootState) => state.themesReducer);
    const usuario = localStorage.getItem('usuario');
    const usuarioObj = usuario ? JSON.parse(usuario) : null;
    
    return (
        <ContainerNavbar theme={theme} neon={neon}>
            <ContainerLogo>
                <LogoButton theme={theme} neon={neon} />
            </ContainerLogo>
            <Options theme={theme} neon={neon}>
                <NavbarLinks theme={theme} neon={neon} usuario={usuarioObj} />
            </Options>
            <ContainerTheme>
                <ThemeNeonButtons />
            </ContainerTheme>
        </ContainerNavbar>
    )
}