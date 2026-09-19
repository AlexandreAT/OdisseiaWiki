import { useSelector } from 'react-redux';
import { ContainerNavbar, ContainerLogo, Options, ContainerTheme } from './Navbar.style';
import { LogoButton } from '../Logo/LogoButton';
import { ThemeNeonButtons } from '../ThemeNeonButtons/ThemeNeonButtons';
import { NavbarLinks } from './NavbarLinks/NavbarLinks';
import { useEffect, useState } from 'react';
import {
    AUTH_USER_UPDATED_EVENT,
    getStoredAuthUser,
    type StoredAuthUser,
} from '../../../services/authSession';

interface RootState {
    themesReducer: {
        theme: 'dark' | 'light';
        neon: 'on' | 'off';
    }
}

export const Navbar = () => {
    const { theme, neon } = useSelector((state: RootState) => state.themesReducer);
    const [usuario, setUsuario] = useState<StoredAuthUser | null>(getStoredAuthUser);

    useEffect(() => {
        const updateUser = () => setUsuario(getStoredAuthUser());
        window.addEventListener(AUTH_USER_UPDATED_EVENT, updateUser);
        window.addEventListener('storage', updateUser);
        return () => {
            window.removeEventListener(AUTH_USER_UPDATED_EVENT, updateUser);
            window.removeEventListener('storage', updateUser);
        };
    }, []);


    return (
        <ContainerNavbar theme={theme} neon={neon}>
            <ContainerLogo>
                <LogoButton theme={theme} neon={neon} />
            </ContainerLogo>
            <Options id="main-navigation" theme={theme} neon={neon}>
                <NavbarLinks theme={theme} neon={neon} usuario={usuario} />
            </Options>
            <ContainerTheme>
                <ThemeNeonButtons />
            </ContainerTheme>
        </ContainerNavbar>
    )
}
