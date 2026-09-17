import styled, { css, keyframes } from 'styled-components';
import { ScrollRevealVariant } from './ScrollRevealBlock.types';

interface ScrollRevealSectionProps {
  $variant: ScrollRevealVariant;
}

const fadeSlideIn = keyframes`
  from { opacity: 0; transform: translateY(18px) scale(0.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const titleRevealIn = keyframes`
  from { opacity: 0; transform: translateY(10px); clip-path: inset(0 100% 0 0); }
  to { opacity: 1; transform: translateY(0); clip-path: inset(0 0 0 0); }
`;

const fadeSlideInDelay = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
`;

const zoomIn = keyframes`
  from { opacity: 0; transform: translateY(10px) scale(0.94); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const personagemCardFragments = css`
  &.sr-entered > * {
    animation: ${fadeSlideIn} 0.4s ease-out;
  }
`;

const titleFragment = css`
  &.sr-entered > * > h2 {
    opacity: 1;
    animation: ${titleRevealIn} 0.7s ease-out;
  }
`;

const infoBlockFragments = css`
  ${titleFragment}

  &.sr-entered > * > div > div {
    opacity: 1;
    animation: ${fadeSlideInDelay} 0.55s ease-out 0.3s backwards;
  }
`;

const infoCarouselFragments = css`
  ${titleFragment}

  &.sr-entered > * > div {
    opacity: 1;
    animation: ${fadeSlideInDelay} 0.55s ease-out 0.3s backwards;
  }
`;

const wikiBlockFragments = css`
  &.sr-entered :is(h1, h2, h3, h4) {
    opacity: 1;
    animation: ${titleRevealIn} 0.7s ease-out;
  }

  &.sr-entered :is(p, ul, ol, blockquote) {
    opacity: 1;
    animation: ${fadeSlideInDelay} 0.55s ease-out 0.3s backwards;
  }
`;

export const ScrollRevealSection = styled.section<ScrollRevealSectionProps>`
  width: 100%;
  min-width: 0;

  &.sr-pending > * {
    opacity: 0;
  }

  &.sr-entered > * {
    opacity: 1;
    animation: ${fadeSlideIn} 0.55s ease-out;
  }

  &.sr-entered img {
    opacity: 1;
    animation: ${zoomIn} 0.4s ease-out 0.6s backwards;
  }

  ${({ $variant }) => {
    if ($variant === 'infoBlock') return infoBlockFragments;
    if ($variant === 'infoCarousel') return infoCarouselFragments;
    if ($variant === 'personagemCard') return personagemCardFragments;
    return wikiBlockFragments;
  }}

  @media (max-width: 768px) {
    &.sr-entered > * {
      animation-duration: 0.48s;
    }

    &.sr-entered img {
      animation-duration: 0.36s;
      animation-delay: 0.48s;
    }

    &.sr-entered :is(h1, h2, h3, h4) {
      animation-duration: 0.58s;
    }

    &.sr-entered :is(p, ul, ol, blockquote),
    &.sr-entered > * > div,
    &.sr-entered > * > div > div {
      animation-duration: 0.48s;
      animation-delay: 0.24s;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &.sr-pending > *,
    &.sr-entered > *,
    &.sr-entered img,
    &.sr-entered :is(h1, h2, h3, h4, p, ul, ol, blockquote),
    &.sr-entered > * > div,
    &.sr-entered > * > div > div {
      opacity: 1;
      animation: none;
    }
  }

`;
