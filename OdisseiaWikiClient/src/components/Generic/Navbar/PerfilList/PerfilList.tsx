import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
    const [mobilePosition, setMobilePosition] = useState({ left: 12, top: 62, anchorX: 75 });

    useLayoutEffect(() => {
        const updatePosition = () => {
            if (window.innerWidth > 768 || !avatarRef.current || !dropdownRef.current) return;

            const safeMargin = 12;
            const avatarRect = avatarRef.current.getBoundingClientRect();
            const dropdownWidth = dropdownRef.current.getBoundingClientRect().width;
            const avatarCenter = avatarRect.left + avatarRect.width / 2;
            const idealLeft = avatarCenter - dropdownWidth / 2;
            const maxLeft = Math.max(safeMargin, window.innerWidth - dropdownWidth - safeMargin);
            const left = Math.min(Math.max(idealLeft, safeMargin), maxLeft);
            const anchorX = Math.min(Math.max(avatarCenter - left, 14), dropdownWidth - 14);

            setMobilePosition({
                left,
                top: avatarRect.bottom + 8,
                anchorX,
            });
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [avatarRef]);

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
        <PerfilDropdown
            ref={dropdownRef}
            themeMode={theme}
            $mobileLeft={mobilePosition.left}
            $mobileTop={mobilePosition.top}
            $mobileAnchorX={mobilePosition.anchorX}
        >
            {/* A opção Perfil retornará em uma versão futura. */}
            <PerfilOption to="/hub" themeMode={theme}>Mesas e personagens</PerfilOption>
            {usuario.email === adminEmail && (
                <PerfilOption to="/management" themeMode={theme}>Gerenciamento</PerfilOption>
            )}
            <PerfilButton onClick={handleLogout} themeMode={theme}>Sair</PerfilButton>
        </PerfilDropdown>
    );
};
