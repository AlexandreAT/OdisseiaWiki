import { BiLoaderAlt } from 'react-icons/bi';
import { WikiSearchLoadingProps } from './types';
import {
  AnimatedDots,
  LoadingIcon,
  LoadingText,
  WikiSearchLoadingWrapper,
} from './WikiSearchLoading.style';

export const WikiSearchLoading = ({
  compact = false,
  label = 'Buscando entidades',
}: WikiSearchLoadingProps) => (
  <WikiSearchLoadingWrapper $compact={compact} role="status" aria-live="polite">
    <LoadingIcon $compact={compact} aria-hidden="true">
      <BiLoaderAlt />
    </LoadingIcon>
    <LoadingText $compact={compact}>
      {label}
      <AnimatedDots aria-hidden="true" />
    </LoadingText>
  </WikiSearchLoadingWrapper>
);
