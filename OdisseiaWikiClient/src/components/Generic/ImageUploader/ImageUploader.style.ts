import styled from 'styled-components';

interface Props {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

interface ContainerProps extends Props {
  hasImage: boolean;
  width?: string;
  height?: string;
  aspectRatio?: number;
  shape?: 'square' | 'circle' | 'rectangle';
  $mobileSize?: 'main' | 'compact';
}

interface LabelProps {
  visible: boolean;
}

const getNeon = (neon: 'on' | 'off') =>
  neon === 'on' ? 'var(--neonBlue)' : 'var(--lightGrey)';
const getClearNeon = (neon: 'on' | 'off') =>
  neon === 'on' ? 'var(--clearneonBlue)' : 'transparent';

export const UploaderController = styled.div<{ width?: string }>`
  display: flex;
  flex-direction: column;
  width: ${({ width }) => width || '100%'};
  gap: 10px;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    width: 100%;
    gap: 6px;
  }
`;

export const UploaderLabel = styled.label<Props>`
  font-size: 0.9em;
  font-weight: 500;
  color: ${({ neon }) => getNeon(neon)};
  ${({ neon }) =>
    neon === 'on' && `text-shadow: 0.5px 0.5px 1px ${getClearNeon(neon)};`}
  margin-bottom: 5px;
`;

export const ImageContainer = styled.div<ContainerProps>`
  width: 100%;
  max-width: 500px;
  aspect-ratio: ${({ aspectRatio }) => aspectRatio || 1};
  margin: 0 auto;
  border-radius: ${({ shape }) => (shape === 'circle' ? '50%' : '10px')};
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--lightBlack);
  border: 2px ${({ hasImage }) => hasImage ? 'solid' : 'dashed'} ${({ hasImage }) =>
    hasImage ? 'transparent' : 'var(--lightGrey)'};
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 0;
  box-sizing: border-box;

  @media (max-width: 768px) {
    width: ${({ $mobileSize }) => $mobileSize === 'main'
      ? 'min(68vw, 240px)'
      : 'min(36vw, 130px)'};
    max-width: ${({ $mobileSize }) => $mobileSize === 'main' ? '240px' : '130px'};
    height: auto;
    max-height: ${({ $mobileSize }) => $mobileSize === 'main' ? '240px' : '150px'};

    img {
      object-fit: cover;
    }
  }

  &:hover,
  &:focus-within {
    border-color: ${({ neon }) =>
      neon === 'on' ? 'var(--neonBlue)' : 'var(--mediumgrey)'};
    ${({ neon }) =>
      neon === 'on' &&
      `
      box-shadow: 0 0 10px ${getClearNeon(neon)};
    `}
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
  }

  @media (max-width: 768px) {
    img {
      object-fit: cover;
    }
  }
`;

export const ImagePlaceholder = styled.div<Props>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  color: ${({ theme }) =>
    theme === 'dark' ? 'var(--lightGrey)' : 'var(--deepgrey)'};

  svg {
    width: 48px;
    height: 48px;
    opacity: 0.5;
    transition: opacity 0.3s ease;
  }

  p {
    font-size: 14px;
    text-align: center;
    margin: 0;
    opacity: 0.7;
  }

  @media (max-width: 768px) {
    gap: 6px;
    padding: 10px;

    svg {
      width: 34px;
      height: 34px;
    }

    p {
      max-width: 100%;
      font-size: 11px;
      line-height: 1.3;
      overflow-wrap: anywhere;
    }
  }

  ${ImageContainer}:hover & {
    svg {
      opacity: 0.8;
    }
    p {
      opacity: 1;
    }
  }
`;

export const HiddenInput = styled.input`
  display: none;
`;

export const ErrorText = styled.span<LabelProps>`
  font-size: 0.85em;
  color: var(--neonPink);
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  transition: opacity 0.3s ease;
  min-height: 18px;
`;

export const RemoveImageButton = styled.button<Props>`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid ${({ neon }) =>
    neon === 'on' ? 'var(--neonPink)' : 'var(--lightGrey)'};
  color: ${({ neon }) =>
    neon === 'on' ? 'var(--neonPink)' : 'var(--lightGrey)'};
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 10;

  ${ImageContainer}:hover &,
  ${ImageContainer}:focus-within & {
    opacity: 1;
  }

  @media (max-width: 768px) {
    top: 5px;
    right: 5px;
    opacity: 1;
  }

  &:hover {
    background: ${({ neon }) =>
      neon === 'on' ? 'var(--neonPink)' : 'var(--lightGrey)'};
    color: var(--lightBlack);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }

  .icon {
    width: 100%;
    height: 100%;
  }
`;

export const EditButton = styled.button<Props>`
  position: absolute;
  bottom: 10px;
  right: 10px;
  padding: 6px 12px;
  background: ${({ theme }) =>
    theme === 'dark' ? 'var(--clearblack)' : 'var(--clearWhite)'};
  border: 1px solid ${({ neon }) =>
    neon === 'on' ? 'var(--clearneonBlue)' : 'var(--lightGrey)'};
  color: ${({ neon }) =>
    neon === 'on' ? 'var(--neonBlue)' : 'var(--mediumgrey)'};
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
  z-index: 10;
  opacity: 0;

  ${ImageContainer}:hover &,
  ${ImageContainer}:focus-within & {
    opacity: 1;
  }

  @media (max-width: 768px) {
    right: 5px;
    bottom: 5px;
    padding: 4px 7px;
    opacity: 1;
  }

  &:hover {
    background: ${({ neon }) =>
      neon === 'on' ? 'var(--clearneonBlue)' : 'var(--lightGrey)'};
    color: var(--lightBlack);
  }
`;
