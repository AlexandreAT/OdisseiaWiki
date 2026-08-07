import { BiBookOpen, BiEnvelope, BiHome, BiMessageDetail } from 'react-icons/bi';
import { FaGithub } from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';
import { useLocation } from 'react-router-dom';
import LogoDado from '../../../assets/Logo Dado.png';
import { SITE_CONTACT } from '../../../config/siteContact';
import {
  Brand,
  BrandLogo,
  BrandName,
  ContactItem,
  ContactItems,
  ContactText,
  FooterBottom,
  FooterContainer,
  FooterContent,
  FooterNav,
  FooterNavLink,
  FooterSeparator,
} from './Footer.style';

interface FooterProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

const navigationItems = [
  { label: 'Início', to: '/', icon: BiHome, end: true },
  { label: 'Wiki', to: '/wiki', icon: BiBookOpen },
  { label: 'Campanha', to: '/#campanha', icon: GiCrossedSwords },
  { label: 'Contato', to: '/#contato', icon: BiMessageDetail },
];

export const Footer = ({ theme, neon }: FooterProps) => {
  const currentYear = new Date().getFullYear();
  const location = useLocation();

  return (
    <FooterContainer id="contato" theme={theme} neon={neon}>
      <FooterContent>
        <Brand to="/" aria-label="Ir para o início">
          <BrandLogo src={LogoDado} alt="" aria-hidden="true" />
          <BrandName theme={theme} neon={neon}>OdisseiaWiki</BrandName>
        </Brand>

        <FooterNav aria-label="Navegação do rodapé">
          {navigationItems.map(({ label, to, icon: Icon, end }) => (
            <FooterNavLink
              key={label}
              to={to}
              end={end}
              className={({ isActive }) => {
                const hash = to.includes('#') ? to.slice(to.indexOf('#')) : '';
                const active = hash
                  ? location.pathname === '/' && location.hash === hash
                  : isActive;

                return active ? 'active' : undefined;
              }}
              theme={theme}
              neon={neon}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </FooterNavLink>
          ))}
        </FooterNav>

        <ContactItems aria-label="Contatos do OdisseiaWiki">
          <ContactItem href={`mailto:${SITE_CONTACT.email}`} theme={theme} neon={neon}>
            <BiEnvelope aria-hidden="true" />
            <ContactText>
              <strong>Email</strong>
              <span>{SITE_CONTACT.email}</span>
            </ContactText>
          </ContactItem>

          <ContactItem
            href={SITE_CONTACT.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub do OdisseiaWiki (abre em uma nova aba)"
            theme={theme}
            neon={neon}
          >
            <FaGithub aria-hidden="true" />
            <ContactText>
              <strong>GitHub</strong>
              <span>{SITE_CONTACT.githubLabel}</span>
            </ContactText>
          </ContactItem>
        </ContactItems>
      </FooterContent>

      <FooterBottom theme={theme}>
        <span>© {currentYear} OdisseiaWiki.</span>
        <FooterSeparator aria-hidden="true">✦</FooterSeparator>
        <span>Projeto independente</span>
      </FooterBottom>
    </FooterContainer>
  );
};
