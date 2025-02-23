import { useSelector, useDispatch } from 'react-redux';
import { BsLightbulbFill, BsLightbulbOffFill, BsLightningCharge, BsLightningChargeFill } from 'react-icons/bs';
import { Link } from 'react-router-dom';
import { ContainerNavbar, Logo, LogoImg, Title, Options, SpanOption, ContainerTheme, OptionButton } from '../styles/Navbar.style';
import LogoDado from '../assets/Logo Dado.png';

interface RootState {
    themesReducer: {
        theme: 'dark' | 'light';
        neon: 'on' | 'off';
    }
}

const Navbar: React.FC = () => {

    const { theme, neon } = useSelector((state: RootState) => state.themesReducer);
    const dispatch = useDispatch();

    const handleTheme = () => {
        dispatch({
            type: 'TOGGLE/THEME',
            theme: theme === "dark" ? "light" : "dark"
        });
    }

    const handleNeon = () => {
        dispatch({
            type: 'TOGGLE/NEON',
            neon: neon === "off" ? "on" : "off"
        })
    }

    return (
        <ContainerNavbar theme={theme} neon={neon}>
            <Logo>
                <Link to="/" className='link'><LogoImg src={LogoDado} /></Link>
                <Link to="/" className={`${'link'} ${'linkTitle'}`}><Title theme={theme} neon={neon}>OdisseiaWiki</Title></Link>
            </Logo>
            <Options theme={theme} neon={neon}>
                <Link to="/" className='link'><SpanOption theme={theme} neon={neon}>INICIO</SpanOption></Link>
                <Link to="/" className='link'><SpanOption theme={theme} neon={neon}>SOBRE</SpanOption></Link>
                <Link to="/" className='link'><SpanOption theme={theme} neon={neon}>CAMPANHA</SpanOption></Link>
                <Link to="/wiki" className='link'><SpanOption theme={theme} neon={neon}>WIKI</SpanOption></Link>
                <Link to="/" className='link'><SpanOption theme={theme} neon={neon}>CONTATO</SpanOption></Link>
                <Link to="/login" className='link'><SpanOption theme={theme} neon={neon}>LOGIN</SpanOption></Link>
            </Options>
            <ContainerTheme>
                <OptionButton theme={theme} neon={neon} onClick={handleNeon}>
                    {neon === "off" && (<BsLightningCharge className={`${'icon'} ${'iconOff'}`} />)}
                    {neon === "on" && (<BsLightningChargeFill className={`${'icon'} ${'iconOn'}`} />)}
                </OptionButton>
                <OptionButton theme={theme} neon={neon} onClick={handleTheme}>
                    {theme === "dark" && (<BsLightbulbOffFill className={`${'icon'} ${'iconDark'}`} />)}
                    {theme === "light" && (<BsLightbulbFill className={`${'icon'} ${'iconLight'}`} />)}
                </OptionButton>
            </ContainerTheme>
        </ContainerNavbar>
    )
}

export default Navbar;
