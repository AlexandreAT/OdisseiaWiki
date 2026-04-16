import styled from 'styled-components';
import { CropShape } from './types';

interface Props {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

interface CropAreaProps extends Props {
  shape: 'square' | 'circle' | 'rectangle';
  aspectRatio?: number;
}

export const ModalOverlay = styled.div<Props>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

export const ModalContainer = styled.div<Props>`
  background: ${({ theme }) =>
    theme === 'dark' ? 'var(--clearblack)' : 'var(--clearWhite)'};
  border: 2px solid ${({ theme, neon }) =>
    theme === 'dark'
      ? neon === 'on'
        ? 'var(--clearneonBlue)'
        : 'var(--lightGrey)'
      : neon === 'on'
        ? 'var(--neonViolet)'
        : 'var(--deepgrey)'};
  border-radius: 12px;
  padding: 20px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
`;

export const ModalHeader = styled.div<Props>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid ${({ theme, neon }) =>
    theme === 'dark'
      ? neon === 'on'
        ? 'var(--clearneonBlue)'
        : 'var(--lightGrey)'
      : neon === 'on'
        ? 'var(--neonViolet)'
        : 'var(--deepgrey)'};

  h2 {
    margin: 0;
    font-family: 'DO Futuristic', sans-serif;
    font-weight: 100;
    letter-spacing: 2px;
    font-size: 1.2rem;
    color: ${({ theme }) =>
      theme === 'dark' ? 'var(--clearWhite)' : 'var(--deepgrey)'};
  }
`;

export const CropContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  flex: 1;
  overflow-y: auto;
`;

export const CropAreaWrapper = styled.div<CropAreaProps>`
  position: relative;
  //width: 100%;  
  aspect-ratio: ${({ aspectRatio, shape }) => {
    if (shape === 'circle') return '1 / 1';
    if (aspectRatio) return aspectRatio;
    return '16 / 9';
  }};
  overflow: hidden;
  background: var(--black);
  border: 2px solid ${({ theme, neon }) =>
    theme === 'dark'
      ? neon === 'on'
        ? 'var(--clearneonBlue)'
        : 'var(--lightGrey)'
      : neon === 'on'
        ? 'var(--neonViolet)'
        : 'var(--deepgrey)'};
  border-radius: ${({ shape }) => (shape === 'circle' ? '50%' : '8px')};
`;

export const CropImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
`;

export const ControlsSection = styled.div<Props>`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const ZoomControl = styled.div<Props>`
  display: flex;
  align-items: center;
  gap: 10px;

  label {
    font-size: 0.9em;
    color: ${({ theme, neon }) =>
      theme === 'dark'
        ? neon === 'on'
          ? 'var(--clearneonBlue)'
          : 'var(--lightGrey)'
        : neon === 'on'
          ? 'var(--neonViolet)'
          : 'var(--deepgrey)'};
    font-family: 'DO Futuristic', sans-serif;
    font-weight: 100;
    letter-spacing: 1px;
    min-width: 50px;
  }

  input[type='range'] {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: ${({ theme }) =>
      theme === 'dark' ? 'var(--clearblack)' : 'var(--whitesmoke)'};
    outline: none;
    -webkit-appearance: none;
    appearance: none;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: ${({ neon }) =>
        neon === 'on' ? 'var(--neonBlue)' : 'var(--mediumgrey)'};
      cursor: pointer;
      box-shadow: ${({ neon }) =>
        neon === 'on' ? '0 0 8px var(--clearneonBlue)' : 'none'};
    }

    &::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: ${({ neon }) =>
        neon === 'on' ? 'var(--neonBlue)' : 'var(--mediumgrey)'};
      cursor: pointer;
      border: none;
      box-shadow: ${({ neon }) =>
        neon === 'on' ? '0 0 8px var(--clearneonBlue)' : 'none'};
    }
  }

  span {
    min-width: 30px;
    text-align: center;
    color: ${({ theme, neon }) =>
      theme === 'dark'
        ? neon === 'on'
          ? 'var(--clearneonBlue)'
          : 'var(--lightGrey)'
        : neon === 'on'
          ? 'var(--neonViolet)'
          : 'var(--deepgrey)'};
    font-size: 0.85em;
  }
`;

export const ButtonsContainer = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
`;

export const HiddenCanvas = styled.canvas`
  display: none;
`;

export const PreviewSection = styled.div<Props>`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background: ${({ theme }) =>
    theme === 'dark'
      ? 'rgba(0, 0, 0, 0.3)'
      : 'rgba(0, 0, 0, 0.05)'};
  border-radius: 8px;

  label {
    font-size: 0.85em;
    color: ${({ theme, neon }) =>
      theme === 'dark'
        ? neon === 'on'
          ? 'var(--clearneonBlue)'
          : 'var(--lightGrey)'
        : neon === 'on'
          ? 'var(--neonViolet)'
          : 'var(--deepgrey)'};
    font-family: 'DO Futuristic', sans-serif;
    font-weight: 100;
    letter-spacing: 1px;
  }
`;

export const PreviewImage = styled.img<{ shape: CropShape }>`
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: ${({ shape }) => {
    if (shape === 'circle') return '50%';
    return '4px';
  }};
  border: 1px solid var(--lightGrey);
`;
