import { LoadingIndicator } from '../../../../components/Generic/LoadingIndicator';
import { WikiSearchLoadingProps } from './types';
import { WikiSearchLoadingWrapper } from './WikiSearchLoading.style';

export const WikiSearchLoading = ({
  compact = false,
  label = 'Buscando entidades',
}: WikiSearchLoadingProps) => (
  <WikiSearchLoadingWrapper $compact={compact} role="status" aria-live="polite">
    <LoadingIndicator compact={compact} label={label} />
  </WikiSearchLoadingWrapper>
);
