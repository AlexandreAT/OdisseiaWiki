import { Link } from 'react-router-dom';
import { colorCardsSchemes } from '../../../Global Styles/ColorCardsSchemes';
import { CardLinkWrapper } from './SpanLink.style'

interface CardLinkProps {
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
    colorScheme: keyof typeof colorCardsSchemes;
    children: React.ReactNode;
    className?: string;
    link: string;
    textSize?: string;
}

export const SpanLink = ({ theme, neon, colorScheme, children, className, link, textSize }: CardLinkProps) => {
    const scheme = colorCardsSchemes[colorScheme];

return (
  <CardLinkWrapper theme={theme} neon={neon} colorScheme={scheme} className={className} textSize={textSize}>
    <Link to={link} className='link'>{children}</Link>
  </CardLinkWrapper>
)};