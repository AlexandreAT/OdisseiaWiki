import { ReactNode } from 'react';

export type ScrollRevealVariant = 'infoBlock' | 'infoCarousel' | 'wikiBlock' | 'personagemCard';

export interface ScrollRevealBlockProps {
  children: ReactNode;
  variant: ScrollRevealVariant;
  threshold?: number | number[];
  rootMargin?: string;
  className?: string;
}
