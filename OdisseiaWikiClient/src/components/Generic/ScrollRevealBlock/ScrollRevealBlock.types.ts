import { ReactNode } from 'react';

export type ScrollRevealVariant = 'infoBlock' | 'infoCarousel' | 'wikiBlock';

export interface ScrollRevealBlockProps {
  children: ReactNode;
  variant: ScrollRevealVariant;
  threshold?: number | number[];
  rootMargin?: string;
}
