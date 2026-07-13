import { useScrollReveal } from '../../../hooks/useScrollReveal';
import { ScrollRevealSection } from './ScrollRevealBlock.style';
import { ScrollRevealBlockProps } from './ScrollRevealBlock.types';

export const ScrollRevealBlock = ({
  children,
  variant,
  threshold = 0.6,
  rootMargin,
}: ScrollRevealBlockProps) => {
  const revealRef = useScrollReveal<HTMLElement>({ rootMargin, threshold });

  return (
    <ScrollRevealSection ref={revealRef} $variant={variant}>
      {children}
    </ScrollRevealSection>
  );
};
