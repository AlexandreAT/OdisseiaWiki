import styled from 'styled-components';

export const GraphPageRoot = styled.main`
  position: relative;
  z-index: 0;
  width: 100%;
  min-width: 0;
  min-height: calc(100svh - var(--main-header-height, 85px));
  padding-bottom: 28px;
  overflow-x: clip;
  color: var(--whitesmoke);
  isolation: isolate;

  @media (max-width: 768px) {
    padding-bottom: 14px;
  }
`;

export const GraphBackground = styled.div`
  position: fixed;
  inset: 0;
  z-index: -2;
  overflow: hidden;
  pointer-events: none;

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 52% 40%, rgba(0, 98, 168, 0.08), transparent 48%),
      rgba(0, 3, 13, 0.83);
  }
`;

export const GraphBody = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  gap: 14px;
  width: 100%;
  min-width: 0;
  padding-top: 14px;
`;

export const GraphStage = styled.section`
  position: relative;
  width: min(1700px, calc(100% - 36px));
  min-width: 0;
  margin: 0 auto;

  @media (max-width: 1100px) {
    width: calc(100% - 24px);
  }

  @media (max-width: 768px) {
    width: calc(100% - 16px);
  }
`;

export const GraphState = styled.section`
  display: grid;
  place-items: center;
  min-height: 480px;
  padding: 30px 18px;
  border: 1px solid rgba(71, 219, 255, 0.3);
  border-radius: 5px;
  background: rgba(0, 5, 14, 0.72);
  box-sizing: border-box;
  text-align: center;

  p {
    max-width: 580px;
    margin: 0;
    color: rgba(245, 245, 245, 0.76);
    font-size: 14px;
    line-height: 1.6;
  }

  button {
    margin-top: 18px;
    padding: 10px 18px;
    border: 1px solid var(--clearneonBlue);
    border-radius: 3px;
    background: rgba(0, 212, 255, 0.08);
    color: var(--clearneonBlue);
    font-family: 'Orbitron', sans-serif;
    font-size: 10px;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }

  button:hover,
  button:focus-visible {
    outline: none;
    background: rgba(0, 212, 255, 0.16);
  }

  @media (max-width: 768px) {
    min-height: 420px;
    p { font-size: 13px; }
  }
`;

export const AssistiveInstructions = styled.p`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
