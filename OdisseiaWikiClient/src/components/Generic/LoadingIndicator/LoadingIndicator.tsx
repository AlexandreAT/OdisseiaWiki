import { BiLoaderAlt } from 'react-icons/bi';
import {
  AnimatedDots,
  LoadingIcon,
  LoadingLabel,
  LoadingLabelClip,
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
      <LoadingLabel title={label}><LoadingLabelClip>{label}</LoadingLabelClip></LoadingLabel>
      <AnimatedDots aria-hidden="true">
        <i />
        <i />
        <i />
      </AnimatedDots>
    </LoadingText>
  </LoadingWrapper>
);
