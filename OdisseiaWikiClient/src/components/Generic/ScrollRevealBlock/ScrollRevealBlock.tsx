import { useScrollReveal } from '../../../hooks/useScrollReveal';
import { ScrollRevealSection } from './ScrollRevealBlock.style';
import { ScrollRevealBlockProps } from './ScrollRevealBlock.types';

export const ScrollRevealBlock = ({
  children,
  variant,
  threshold = 0.6,
  rootMargin,
}: ScrollRevealBlockProps) => {
  const isMobile = typeof window !== 'undefined'
    && window.matchMedia('(max-width: 768px)').matches;
  const mobileThreshold = Array.isArray(threshold)
    ? threshold.map((value) => value * 0.72)
    : threshold * 0.72;
  const resolvedThreshold = isMobile
    ? variant === 'wikiBlock' ? 0.15 : mobileThreshold
    : threshold;
  const resolvedRootMargin = rootMargin ?? (isMobile ? '0px 0px 4% 0px' : undefined);
  const revealRef = useScrollReveal<HTMLElement>({
    rootMargin: resolvedRootMargin,
    threshold: resolvedThreshold,
  });

  return (
    <ScrollRevealSection ref={revealRef} $variant={variant}>
      {children}
    </ScrollRevealSection>
  );
};
