import styled from 'styled-components';

interface Props {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

interface ContainerProps extends Props {
  hasImage: boolean;
  width?: string;
  height?: string;
}

interface ErrorProps {
  visible: boolean;
}

const getNeon = (neon: 'on' | 'off') => neon === 'on' ? 'var(--neonBlue)' : 'var(--lightGrey)';
const getClearNeon = (neon: 'on' | 'off') => neon === 'on' ? 'var(--clearneonBlue)' : 'transparent';

export const ImageUploadController = styled.div<{ width?: string }>`
  display: flex;
  flex-direction: column;
  width: ${({ width }) => width || '100%'};
  gap: 10px;
`;

export const ImageLabel = styled.label<Props>`
  font-size: 0.9em;
  font-weight: 500;
  color: ${({ neon }) => getNeon(neon)};
  ${({ neon }) => neon === 'on' && `text-shadow: 0.5px 0.5px 1px ${getClearNeon(neon)};`}
  margin-bottom: 5px;
`;

export const ImageContainer = styled.div<ContainerProps>`
  width: ${({ width }) => width || '100%'};
  height: ${({ height }) => height || '300px'};
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--lightBlack);
  border: 2px dashed ${({ hasImage }) => 
    hasImage ? 'transparent' : 'var(--lightGrey)'};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${({ neon }) => neon === 'on' ? 'var(--neonBlue)' : 'var(--mediumgrey)'};
    ${({ neon }) => neon === 'on' && `
      box-shadow: 0 0 10px ${getClearNeon(neon)};
    `}
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
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

export const ErrorText = styled.span<ErrorProps>`
  font-size: 0.85em;
  color: var(--neonPink);
  opacity: ${({ visible }) => visible ? 1 : 0};
  transition: opacity 0.3s ease;
  min-height: 18px;
`;

export const RemoveImageButton = styled.button<Props>`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid ${({ neon }) => neon === 'on' ? 'var(--neonPink)' : 'var(--lightGrey)'};
  color: ${({ neon }) => neon === 'on' ? 'var(--neonPink)' : 'var(--lightGrey)'};
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 10;

  ${ImageContainer}:hover & {
    opacity: 1;
  }

  &:hover {
    background: ${({ neon }) => neon === 'on' ? 'var(--neonPink)' : 'var(--lightGrey)'};
    color: var(--lightBlack);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;
