import styled, { css, keyframes } from 'styled-components';
import { Link } from 'react-router-dom';
import { HudFrame } from '../../components/Generic/HudFrame';

const gameFrameReveal = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const gameLineHorizontal = keyframes`
  from { opacity: 0; transform: scaleX(0); }
  to { opacity: 1; transform: scaleX(1); }
`;

const gameLineVertical = keyframes`
  from { opacity: 0; transform: scaleY(0); }
  to { opacity: 1; transform: scaleY(1); }
`;

const gameCornerReveal = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const GamePage = styled.main`
  width: min(1240px, calc(100% - 40px));
  margin: 0 auto;
  padding: clamp(24px, 4vw, 48px) 0 30px;
  display: grid;
  gap: 24px;
  color: var(--whitesmoke);

  @media (max-width: 600px) {
    width: calc(100% - 24px);
    gap: 16px;
    padding-top: 20px;
  }
`;

export const GameFrame = styled(HudFrame)`
  width: 100%;
  padding: clamp(20px, 3vw, 34px);

  > span:nth-of-type(1) { top: 0; left: 0; }
  > span:nth-of-type(2) { top: 0; right: 0; }
  > span:nth-of-type(3) { bottom: 0; left: 0; }
  > span:nth-of-type(4) { right: 0; bottom: 0; }

  > span:nth-of-type(5) { top: 0; }
  > span:nth-of-type(6) { right: 0; }
  > span:nth-of-type(7) { bottom: 0; }
  > span:nth-of-type(8) { left: 0; }

  ${({ neon }) => neon && css`
    animation: ${gameFrameReveal} 320ms ease-out both;

    > span:nth-of-type(-n + 4) {
      animation: ${gameCornerReveal} 160ms ease-out 430ms both;
    }

    > span:nth-of-type(5),
    > span:nth-of-type(7) {
      animation: ${gameLineHorizontal} 500ms ease-out both;
    }

    > span:nth-of-type(6),
    > span:nth-of-type(8) {
      animation: ${gameLineVertical} 500ms ease-out 250ms both;
    }
  `}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    > span { animation: none; }
  }

  @media (max-width: 600px) {
    padding: 20px 16px;
  }
`;

export const GameEyebrow = styled.p`
  margin: 0 0 8px;
  color: var(--clearneonBlue);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
`;

export const GameTitle = styled.h1`
  margin: 0;
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(1.75rem, 4vw, 3.4rem);
  line-height: 1.1;
  letter-spacing: 0.03em;
`;

export const GameLead = styled.p`
  max-width: 70ch;
  color: #b8c8d7;
  line-height: 1.65;
`;

export const GameSectionTitle = styled.h2`
  margin: 0;
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(1.1rem, 2vw, 1.45rem);
  line-height: 1.3;
  letter-spacing: 0.04em;
`;

export const GameHint = styled.p`
  color: #b8c8d7;
  line-height: 1.55;
`;

export const GameNotice = styled.div<{ $danger?: boolean }>`
  padding: 12px 15px;
  border: 1px solid ${({ $danger }) => $danger ? 'rgba(255, 120, 120, .55)' : 'rgba(77, 238, 234, .4)'};
  border-radius: 8px;
  background: ${({ $danger }) => $danger ? 'rgba(100, 20, 25, .25)' : 'rgba(0, 140, 160, .12)'};
  color: ${({ $danger }) => $danger ? '#ffd2d2' : '#d7f8f7'};
  line-height: 1.5;
  &[data-npc-rescued='true'] {
    border-color: var(--clearneonYellow);
    color: var(--clearneonYellow);
    animation: ${gameFrameReveal} 350ms ease-out both;
  }
  @media (prefers-reduced-motion: reduce) { &[data-npc-rescued='true'] { animation: none; } }
`;

export const GameTextLink = styled(Link)`
  color: var(--clearneonBlue);
  text-decoration: underline;
  text-underline-offset: 3px;
  &:focus-visible {
    outline: 2px solid var(--clearneonBlue);
    outline-offset: 3px;
  }
`;
