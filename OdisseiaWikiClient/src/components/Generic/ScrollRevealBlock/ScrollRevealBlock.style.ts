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

const fadeSlideOut = keyframes`
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(14px) scale(0.985); }
`;

const titleRevealOut = keyframes`
  from { opacity: 1; transform: translateY(0); clip-path: inset(0 0 0 0); }
  to { opacity: 0; transform: translateY(8px); clip-path: inset(0 100% 0 0); }
`;

const fadeBodyOut = keyframes`
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(10px); }
`;

const zoomOut = keyframes`
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(8px) scale(0.96); }
`;

const personagemCardFragments = css`
  &.sr-entered > * {
    animation: ${fadeSlideIn} 0.4s ease-out;
  }

  &.sr-exited > * {
    animation: ${fadeSlideOut} 0.4s ease-in both;
  }
`;

const titleFragment = css`
  & > * > h2 {
    opacity: 0;
  }

  &.sr-entered > * > h2 {
    opacity: 1;
    animation: ${titleRevealIn} 0.7s ease-out;
  }

  &.sr-exited > * > h2 {
    animation: ${titleRevealOut} 0.35s ease-in 0.3s both;
  }
`;

const infoBlockFragments = css`
  ${titleFragment}

  & > * > div > div {
    opacity: 0;
  }

  &.sr-entered > * > div > div {
    opacity: 1;
    animation: ${fadeSlideInDelay} 0.55s ease-out 0.3s backwards;
  }

  &.sr-exited > * > div > div {
    animation: ${fadeBodyOut} 0.35s ease-in 0.15s both;
  }
`;

const infoCarouselFragments = css`
  ${titleFragment}

  & > * > div {
    opacity: 0;
  }

  &.sr-entered > * > div {
    opacity: 1;
    animation: ${fadeSlideInDelay} 0.55s ease-out 0.3s backwards;
  }

  &.sr-exited > * > div {
    animation: ${fadeBodyOut} 0.35s ease-in 0.15s both;
  }
`;

const wikiBlockFragments = css`
  & :is(h1, h2, h3, h4),
  & :is(p, ul, ol, blockquote) {
    opacity: 0;
  }

  &.sr-entered :is(h1, h2, h3, h4) {
    opacity: 1;
    animation: ${titleRevealIn} 0.7s ease-out;
  }

  &.sr-entered :is(p, ul, ol, blockquote) {
    opacity: 1;
    animation: ${fadeSlideInDelay} 0.55s ease-out 0.3s backwards;
  }

  &.sr-exited :is(h1, h2, h3, h4) {
    animation: ${titleRevealOut} 0.35s ease-in 0.3s both;
  }

  &.sr-exited :is(p, ul, ol, blockquote) {
    animation: ${fadeBodyOut} 0.35s ease-in 0.15s both;
  }
`;

export const ScrollRevealSection = styled.section<ScrollRevealSectionProps>`
  width: 100%;
  min-width: 0;

  & > * {
    opacity: 0;
  }

  & img {
    opacity: 0;
  }

  &.sr-initial-visible,
  &.sr-initial-visible > *,
  &.sr-initial-visible img,
  &.sr-initial-visible * {
    opacity: 1;
    animation: none !important;
  }

  &.sr-entered > * {
    opacity: 1;
    animation: ${fadeSlideIn} 0.55s ease-out;
  }

  &.sr-entered img {
    opacity: 1;
    animation: ${zoomIn} 0.4s ease-out 0.6s backwards;
  }

  &.sr-exited > * {
    animation: ${fadeSlideOut} 0.3s ease-in 0.35s both;
  }

  &.sr-exited img {
    animation: ${zoomOut} 0.25s ease-in both;
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
    & *,
    & > * {
      opacity: 1;
      transform: none;
      clip-path: none;
      animation: none;
    }
  }
`;
