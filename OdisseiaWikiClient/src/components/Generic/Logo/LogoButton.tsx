import { Logo, LogoImg, Title } from './LogoButton.style'
import { Link } from 'react-router-dom';
import LogoDado from '../../../assets/Logo Dado.png';

interface Props {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const LogoButton = ({ theme, neon }: Props) => {
  return (
    <Logo>
        <Link to="/" className='link'><LogoImg src={LogoDado} /></Link>
        <Link to="/" className={`${'link'} ${'linkTitle'}`}><Title theme={theme} neon={neon}>OdisseiaWiki</Title></Link>
    </Logo>
  )
}