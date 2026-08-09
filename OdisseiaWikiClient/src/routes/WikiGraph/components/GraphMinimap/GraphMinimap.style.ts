import styled from 'styled-components';

export const MiniMapWrapper = styled.div`
  position: absolute;
  right: 18px;
  bottom: 18px;
  z-index: 8;
  width: 254px;
  height: 178px;
  padding: 32px 44px 13px 13px;
  box-sizing: border-box;

  > section {
    width: 100%;
    height: 100%;
  }

  @media (max-width: 1100px) {
    width: 208px;
    height: 146px;
    right: 12px;
    bottom: 12px;
    padding: 28px 40px 10px 10px;
  }

  @media (max-width: 768px) {
    width: 164px;
    height: 118px;
    right: 8px;
    bottom: 8px;
    padding: 24px 34px 8px 8px;
  }
`;

export const MiniMapTitle = styled.span`
  position: absolute;
  top: 9px;
  left: 12px;
  color: var(--clearneonBlue);
  font-family: 'DO Futuristic', sans-serif;
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;

  @media (max-width: 768px) {
    top: 7px;
    left: 9px;
    font-size: 8px;
  }
`;

export const MiniMapCanvas = styled.canvas`
  display: block;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(71, 214, 255, 0.34);
  border-radius: 2px;
  background-color: rgba(0, 4, 13, 0.96);
  background-image:
    linear-gradient(rgba(63, 164, 207, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(63, 164, 207, 0.07) 1px, transparent 1px),
    radial-gradient(circle at 50% 50%, rgba(0, 120, 190, 0.12), transparent 68%);
  background-size: 12px 12px, 12px 12px, 100% 100%;
  box-shadow:
    inset 0 0 14px rgba(0, 0, 0, 0.86),
    0 0 8px rgba(0, 174, 255, 0.08);
  cursor: grab;
  touch-action: none;
  user-select: none;

  &:active {
    cursor: grabbing;
  }
`;

export const MiniMapControls = styled.div`
  position: absolute;
  right: 7px;
  bottom: 9px;
  display: grid;
  gap: 5px;

  button {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid rgba(72, 219, 255, 0.45);
    border-radius: 3px;
    background: rgba(0, 7, 18, 0.9);
    color: var(--clearneonBlue) !important;
    fill: var(--clearneonBlue) !important;
    font-size: 15px;
    cursor: pointer;

    &:hover,
    &:focus-visible {
      outline: none;
      border-color: var(--clearneonBlue);
      background: rgba(0, 212, 255, 0.13);
    }
  }

  @media (max-width: 768px) {
    right: 5px;
    bottom: 6px;
    gap: 3px;

    button {
      width: 22px;
      height: 22px;
      font-size: 12px;
    }
  }
`;
