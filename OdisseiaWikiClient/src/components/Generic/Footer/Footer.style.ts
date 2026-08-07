import { Link, NavLink } from 'react-router-dom';
import styled, { css, keyframes } from 'styled-components';

interface ThemeProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

const footerEntrance = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const interactiveState = css<ThemeProps>`
  color: ${({ theme }) => theme === 'dark'
    ? 'rgba(229, 229, 229, 0.82)'
    : 'rgba(30, 30, 30, 0.82)'};

  svg {
    color: ${({ theme }) => theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--deepneonViolet)'};
    fill: currentColor;
    transition: transform 200ms ease, filter 200ms ease;
  }

  &:hover,
  &:focus-visible {
    color: ${({ theme }) => theme === 'dark' ? 'var(--whitesmoke)' : 'var(--black)'};
    background: ${({ theme }) => theme === 'dark'
      ? 'rgba(77, 238, 234, 0.06)'
      : 'rgba(75, 0, 130, 0.07)'};
    outline: 1px solid ${({ theme }) => theme === 'dark'
      ? 'rgba(77, 238, 234, 0.62)'
      : 'rgba(75, 0, 130, 0.5)'};
    outline-offset: 2px;

    svg {
      transform: translateY(-2px);
      filter: ${({ neon, theme }) => neon === 'on'
        ? theme === 'dark'
          ? 'drop-shadow(0 0 4px var(--clearneonBlue))'
          : 'drop-shadow(0 0 4px var(--clearneonViolet))'
        : 'none'};
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    svg {
      transition: none;
    }

    &:hover,
    &:focus-visible {
      svg {
        transform: none;
      }
    }
  }
`;

export const FooterContainer = styled.footer<ThemeProps>`
  position: relative;
  z-index: 2;
  width: 100%;
  margin-top: auto;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme === 'dark'
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(0, 0, 0, 0.12)'};
  border-radius: 8px 8px 0 0;
  background-color: ${({ theme }) => theme === 'dark'
    ? '#03060d'
    : '#d9dde4'};
  animation: ${footerEntrance} 360ms ease-out both;

  @supports ((backdrop-filter: blur(12px)) or (-webkit-backdrop-filter: blur(12px))) {
    background-color: ${({ theme }) => theme === 'dark'
      ? 'rgba(3, 6, 13, 0.94)'
      : 'rgba(217, 221, 228, 0.94)'};
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    z-index: 1;
    height: 2px;
    background: linear-gradient(90deg, var(--clearneonPink), var(--clearneonViolet), var(--clearneonBlue));
    box-shadow: ${({ neon }) => neon === 'on'
      ? '0 0 7px rgba(77, 238, 234, 0.45), 0 0 5px rgba(255, 0, 184, 0.36)'
      : 'none'};
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const FooterContent = styled.div`
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto minmax(290px, 1fr);
  grid-template-areas: 'brand navigation contacts';
  align-items: center;
  gap: clamp(18px, 3vw, 54px);
  width: min(100%, 1500px);
  margin-inline: auto;
  padding: 24px clamp(24px, 4vw, 64px) 20px;
  box-sizing: border-box;

  @media (max-width: 1100px) {
    grid-template-columns: minmax(210px, auto) minmax(0, 1fr);
    grid-template-areas:
      'brand navigation'
      'contacts contacts';
    gap: 12px 24px;
    padding-block: 20px 16px;
  }

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
    grid-template-areas:
      'brand'
      'navigation'
      'contacts';
    justify-items: center;
    gap: 10px;
    padding: 18px 12px 14px;
  }
`;

export const Brand = styled(Link)`
  grid-area: brand;
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: 10px;
  min-height: 42px;
  padding: 3px 5px;
  border-radius: 5px;
  text-decoration: none;

  &:focus-visible {
    outline: 1px solid var(--clearneonPink);
    outline-offset: 3px;
  }

  @media (max-width: 700px) {
    justify-self: center;
  }
`;

export const BrandLogo = styled.img`
  width: 38px;
  height: 38px;
  object-fit: contain;

  @media (max-width: 700px) {
    width: 34px;
    height: 34px;
  }
`;

export const BrandName = styled.span<ThemeProps>`
  color: ${({ theme }) => theme === 'dark' ? 'var(--whitesmoke)' : 'var(--deepgray)'} !important;
  font-family: 'DO Futuristic', sans-serif;
  font-size: clamp(1rem, 1.35vw, 1.3rem);
  letter-spacing: 1px;
  text-shadow: ${({ neon }) => neon === 'on' ? '0 0 5px var(--clearneonPink)' : 'none'};
`;

export const FooterNav = styled.nav`
  grid-area: navigation;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;

  > a + a::before {
    content: '';
    position: absolute;
    left: -1px;
    width: 1px;
    height: 22px;
    background: rgba(145, 151, 163, 0.2);
  }

  @media (max-width: 700px) {
    width: 100%;
    flex-wrap: wrap;

    > a + a::before {
      display: none;
    }
  }
`;

export const FooterNavLink = styled(NavLink)<ThemeProps>`
  ${interactiveState}

  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 42px;
  padding: 6px clamp(12px, 1.5vw, 20px);
  border-radius: 4px;
  font-family: 'Cyberpunk Is Not Dead', sans-serif;
  font-size: 0.72rem;
  letter-spacing: 0.45px;
  text-decoration: none;
  text-transform: uppercase;
  transition: color 200ms ease, background-color 200ms ease, outline-color 200ms ease;

  svg {
    width: 20px;
    height: 20px;
  }

  &.active {
    color: ${({ theme }) => theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--deepneonViolet)'};
  }

  @media (max-width: 700px) {
    flex: 1 1 118px;
    max-width: 150px;
    padding-inline: 9px;
  }
`;

export const ContactItems = styled.address`
  grid-area: contacts;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  min-width: 0;
  font-style: normal;

  @media (max-width: 1100px) {
    justify-self: end;
  }

  @media (max-width: 700px) {
    justify-self: center;
    justify-content: center;
    width: 100%;
  }

  @media (max-width: 390px) {
    flex-direction: column;
    gap: 4px;
  }
`;

export const ContactItem = styled.a<ThemeProps>`
  ${interactiveState}

  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  min-height: 42px;
  padding: 5px 10px;
  border-radius: 4px;
  text-decoration: none;
  transition: color 200ms ease, background-color 200ms ease, outline-color 200ms ease;

  > svg {
    flex: 0 0 auto;
    width: 23px;
    height: 23px;
  }

  @media (max-width: 700px) {
    flex: 1 1 0;
    max-width: 260px;
  }

  @media (max-width: 390px) {
    width: min(100%, 270px);
    max-width: none;
  }
`;

export const ContactText = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.25;

  strong {
    font-size: 0.72rem;
    font-style: normal;
    font-weight: 600;
  }

  span {
    overflow: hidden;
    color: var(--lightGrey);
    font-size: 0.62rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const FooterBottom = styled.div<Pick<ThemeProps, 'theme'>>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 42px;
  padding: 8px 16px;
  border-top: 1px solid ${({ theme }) => theme === 'dark'
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(0, 0, 0, 0.1)'};
  box-sizing: border-box;
  color: ${({ theme }) => theme === 'dark'
    ? 'rgba(189, 189, 189, 0.72)'
    : 'rgba(44, 44, 44, 0.7)'};
  font-size: 0.65rem;
  text-align: center;

  span {
    color: inherit !important;
  }

  @media (max-width: 520px) {
    flex-wrap: wrap;
    gap: 3px 8px;
    padding-block: 9px;
    line-height: 1.35;
  }
`;

export const FooterSeparator = styled.span`
  color: var(--clearneonBlue) !important;
  font-size: 0.75rem;
`;
