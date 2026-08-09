import styled, { keyframes } from 'styled-components';

const drawCanvasBorder = keyframes`
  0% {
    -webkit-mask-size: 0 2px, 0 2px, 2px 0, 2px 0;
    mask-size: 0 2px, 0 2px, 2px 0, 2px 0;
    opacity: 0;
  }
  48% {
    -webkit-mask-size: 100% 2px, 100% 2px, 2px 0, 2px 0;
    mask-size: 100% 2px, 100% 2px, 2px 0, 2px 0;
    opacity: 1;
  }
  100% {
    -webkit-mask-size: 100% 2px, 100% 2px, 2px 100%, 2px 100%;
    mask-size: 100% 2px, 100% 2px, 2px 100%, 2px 100%;
    opacity: 1;
  }
`;

export const CanvasShell = styled.section<{ $neon: boolean }>`
  position: relative;
  min-width: 0;
  min-height: 590px;
  height: clamp(620px, calc(100dvh - 235px), 940px);
  overflow: hidden;
  border: 1px solid rgba(71, 219, 255, 0.26);
  border-radius: 5px;
  background:
    radial-gradient(circle at 50% 46%, rgba(0, 153, 255, 0.08), transparent 42%),
    rgba(0, 3, 12, 0.66);
  box-shadow: ${({ $neon }) => $neon
    ? 'inset 0 0 32px rgba(0, 207, 255, 0.075), 0 0 9px rgba(0, 207, 255, 0.16)'
    : 'inset 0 0 24px rgba(0, 178, 255, 0.025)'};
  isolation: isolate;
  transition: box-shadow 240ms ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(0, 183, 255, 0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 183, 255, 0.025) 1px, transparent 1px);
    background-size: 42px 42px;
    mask-image: radial-gradient(circle at center, black, transparent 88%);
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 18;
    pointer-events: none;
    background: var(--clearneonBlue);
    opacity: ${({ $neon }) => ($neon ? 1 : 0)};
    filter: drop-shadow(0 0 4px rgba(71, 219, 255, 0.74));
    -webkit-mask:
      linear-gradient(#000 0 0) top left / 0 2px no-repeat,
      linear-gradient(#000 0 0) bottom right / 0 2px no-repeat,
      linear-gradient(#000 0 0) top left / 2px 0 no-repeat,
      linear-gradient(#000 0 0) bottom right / 2px 0 no-repeat;
    mask:
      linear-gradient(#000 0 0) top left / 0 2px no-repeat,
      linear-gradient(#000 0 0) bottom right / 0 2px no-repeat,
      linear-gradient(#000 0 0) top left / 2px 0 no-repeat,
      linear-gradient(#000 0 0) bottom right / 2px 0 no-repeat;
    animation: ${({ $neon }) => ($neon ? drawCanvasBorder : 'none')} 720ms ease-out both;
  }

  @media (prefers-reduced-motion: reduce) {
    &::after {
      animation: none;
      -webkit-mask-size: 100% 2px, 100% 2px, 2px 100%, 2px 100%;
      mask-size: 100% 2px, 100% 2px, 2px 100%, 2px 100%;
    }
  }

  @media (max-width: 1100px) {
    height: clamp(610px, calc(100dvh - 280px), 860px);
  }

  @media (max-width: 768px) {
    min-height: 620px;
    height: calc(100dvh - 225px);
    max-height: 820px;
  }
`;

export const CanvasHost = styled.div`
  position: absolute;
  inset: 0;
  min-width: 0;
  touch-action: none;
  overscroll-behavior: contain;
`;

export const AccessibleNodeNavigation = styled.nav`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 20;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;

  &:focus-within {
    width: min(360px, calc(100% - 20px));
    height: auto;
    max-height: min(70vh, 520px);
    margin: 0;
    overflow: auto;
    clip: auto;
    white-space: normal;
    padding: 12px;
    border: 1px solid var(--clearneonBlue);
    border-radius: 4px;
    background: rgba(0, 7, 18, 0.98);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.64);
  }

  summary {
    margin: 0 0 8px;
    color: var(--clearneonBlue);
    font-family: 'DO Futuristic', sans-serif;
    cursor: pointer;
  }

  ul {
    display: grid;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  a {
    display: block;
    padding: 7px 8px;
    border-left: 2px solid rgba(71, 219, 255, 0.7);
    color: var(--whitesmoke);
    text-decoration: none;
  }

  a:hover,
  a:focus-visible {
    outline: none;
    background: rgba(71, 219, 255, 0.12);
    color: var(--clearneonBlue);
  }
`;

export const ProcessingOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 12;
  display: grid;
  place-items: center;
  pointer-events: none;
  background: rgba(0, 4, 12, 0.5);
  backdrop-filter: blur(2px);
`;
