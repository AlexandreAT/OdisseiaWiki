import styled from 'styled-components';
import { Link } from 'react-router-dom';

interface StyleProps {
    colorScheme: {
        primary: string;
        primaryClear: string;
        primaryDeep: string;
        secondary: string;
        secondaryClear: string;
        secondaryDeep: string;
    };
    imagePosition?: 'left' | 'right';
    imageStyleBottom?: 'circle' | 'rectangle';
    type?: 'simple' | 'city';
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
}

export const SectionContainer = styled.section<{ scheme: any }>`
  min-height: 100vh;
  padding: 4rem 2rem;
  background: ${({ scheme }) => scheme.background};
  color: ${({ scheme }) => scheme.text};
  transition: all 0.3s ease;
  width: 100vw;
  height: 100vh;
`;

export const Title = styled.h2<{ scheme: any }>`
  font-size: 3rem;
  margin-bottom: 1.5rem;
  color: ${({ scheme }) => scheme.primary};
  text-shadow: ${({ scheme }) => scheme.neon ? '0 0 8px currentColor' : 'none'};
`;

export const Subtitle = styled.h3`
  font-size: 1.5rem;
  opacity: 0.8;
  margin-bottom: 2rem;
`;

export const ContentWrapper = styled.div<{ variant: string }>`
  margin: 2rem 0;
  display: flex;
  ${({ variant }) => variant === 'carousel' ? 'flex-direction: column;' : ''}
`;

export const SeeAllLink = styled(Link)`
  display: inline-block;
  margin-top: 2rem;
  padding: 0.5rem 1rem;
  border: 2px solid currentColor;
  border-radius: 4px;
  transition: all 0.3s ease;

  &:hover {
    background: white;
    color: black;
  }
`;