import { useEffect, useRef } from 'react';
import { PerfilDropdown, PerfilOption, PerfilButton } from './PerfilList.style';

const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;

interface Props {
    usuario: {
        email: string;
        imagemUrl?: string;
        nome?: string;
    };
    onClose: () => void;
    avatarRef: React.RefObject<HTMLDivElement>;
    theme: 'light' | 'dark';
}

export const PerfilList = ({ usuario, onClose, avatarRef, theme }: Props) => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(target) &&
                !(avatarRef.current && avatarRef.current.contains(target))
            ) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose, avatarRef]);
    
    const handleLogout = () => {
        localStorage.removeItem('usuario');
        window.location.href = '/login';
    };

    return (
        <PerfilDropdown ref={dropdownRef} themeMode={theme}>
            <PerfilOption to="/profile" themeMode={theme}>Perfil</PerfilOption>
            <PerfilOption to="/hub" themeMode={theme}>Mesas e personagens</PerfilOption>
            {usuario.email === adminEmail && (
                <PerfilOption to="/management" themeMode={theme}>Gerenciamento</PerfilOption>
            )}
            <PerfilButton onClick={handleLogout} themeMode={theme}>Sair</PerfilButton>
        </PerfilDropdown>
    );
};