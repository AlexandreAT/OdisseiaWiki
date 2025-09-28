import { Link } from 'react-router-dom';
import { SpanOption, AvatarCotroller, Avatar } from '.././Navbar.style';
import { PerfilList } from '../PerfilList/PerfilList';
import { useRef, useState } from 'react';

interface Props {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  usuario: any; 
}

export  const NavbarLinks = ({ theme, neon, usuario }: Props) => {
    const [showPerfil, setShowPerfil] = useState(false);
    const avatarRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <Link to="/" className='link'><SpanOption theme={theme} neon={neon}>INICIO</SpanOption></Link>
            <Link to="/" className='link'><SpanOption theme={theme} neon={neon}>SOBRE</SpanOption></Link>
            <Link to="/" className='link'><SpanOption theme={theme} neon={neon}>CAMPANHA</SpanOption></Link>
            <Link to="/wiki" className='link'><SpanOption theme={theme} neon={neon}>WIKI</SpanOption></Link>
            <Link to="/" className='link'><SpanOption theme={theme} neon={neon}>CONTATO</SpanOption></Link>
            {usuario
                ? <AvatarCotroller>
                    <Avatar
                        ref={avatarRef}
                        theme={theme}
                        neon={neon}
                        onClick={() => setShowPerfil(!showPerfil)}
                    >
                        <img src={usuario.imagemUrl} alt="Avatar do usuário" />
                    </Avatar>
                    {showPerfil && (
                        <PerfilList
                            usuario={usuario}
                            onClose={() => setShowPerfil(false)}
                            avatarRef={avatarRef}
                            theme={theme}
                        />
                    )}
                </AvatarCotroller>
                : <Link to="/login" className='link'><SpanOption theme={theme} neon={neon}>LOGIN</SpanOption></Link>
            }
        </>
    )
}