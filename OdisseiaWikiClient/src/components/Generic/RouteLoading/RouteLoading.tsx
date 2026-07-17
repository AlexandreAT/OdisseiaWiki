import { LoadingDot, LoadingDots, LoadingWrapper } from './RouteLoading.style';

export const RouteLoading = () => (
  <LoadingWrapper role="status" aria-live="polite">
    <span>Carregando</span>
    <LoadingDots aria-hidden="true">
      <LoadingDot />
      <LoadingDot />
      <LoadingDot />
    </LoadingDots>
  </LoadingWrapper>
);
