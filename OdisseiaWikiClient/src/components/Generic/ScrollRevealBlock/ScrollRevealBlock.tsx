import { useScrollReveal } from '../../../hooks/useScrollReveal';
import { ScrollRevealSection } from './ScrollRevealBlock.style';
import { ScrollRevealBlockProps } from './ScrollRevealBlock.types';

export const ScrollRevealBlock = ({
  children,
  variant,
  threshold = 0.6,
  rootMargin,
}: ScrollRevealBlockProps) => {
  const resolvedThreshold = variant === 'wikiBlock'
    && typeof window !== 'undefined'
    && window.matchMedia('(max-width: 768px)').matches
    ? 0.15
    : threshold;
  const revealRef = useScrollReveal<HTMLElement>({ rootMargin, threshold: resolvedThreshold });

  return (
    <ScrollRevealSection ref={revealRef} $variant={variant}>
      {children}
    </ScrollRevealSection>
  );
};
