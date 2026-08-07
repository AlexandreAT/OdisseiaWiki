import { BiLoaderAlt } from 'react-icons/bi';
import {
  AnimatedDots,
  LoadingIcon,
  LoadingText,
  LoadingWrapper,
} from './LoadingIndicator.style';

interface LoadingIndicatorProps {
  compact?: boolean;
  label?: string;
}

export const LoadingIndicator = ({
  compact = false,
  label = 'Carregando',
}: LoadingIndicatorProps) => (
  <LoadingWrapper $compact={compact} role="status" aria-live="polite">
    {!compact && (
      <LoadingIcon aria-hidden="true">
        <BiLoaderAlt />
      </LoadingIcon>
    )}
    <LoadingText $compact={compact}>
      {label}
      <AnimatedDots aria-hidden="true">
        <span />
        <span />
        <span />
      </AnimatedDots>
    </LoadingText>
  </LoadingWrapper>
);
