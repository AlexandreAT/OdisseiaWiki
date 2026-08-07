import { LoadingIndicator } from '../LoadingIndicator';
import { LoadingWrapper } from './RouteLoading.style';

export const RouteLoading = () => (
  <LoadingWrapper role="status" aria-live="polite">
    <LoadingIndicator />
  </LoadingWrapper>
);
