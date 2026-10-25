import React, { memo, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { ButtonClipController, ButtonBoxShadow, ButtonClipBorder, ButtonContentContainer } from './HighlightButton.styles';
import { LoadingIndicator } from '../LoadingIndicator';
import { createButtonGeometry } from './buttonGeometry';

const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    width?: string;
    height?: string;
    theme?: 'light' | 'dark';
    neon?: 'on' | 'off';
    colorType?: 'primary' | 'secondary';
    text?: string;
    children?: React.ReactNode;
    onClick?: () => void;
    type?: "button" | "submit" | "reset";
    loading?: boolean;
}

const CyberButtonComponent = ({
  backgroundColor,
  textColor,
  borderColor,
  width,
  height,
  theme = 'light',
  neon = 'off',
  colorType = 'primary',
  text,
  children,
  onClick,
  type = "button",
  disabled = false,
  loading = false,
  ...rest
}: CyberButtonProps) => {
  const isDisabledState = disabled || loading;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const gradientId = `cyber-button-${useId().replace(/:/g, '')}`;
  const [geometry, setGeometry] = useState(() => createButtonGeometry(100, 50));

  useBrowserLayoutEffect(() => {
    const button = buttonRef.current;
    if (!button) return;
    const measure = () => {
      // Local layout pixels, not getBoundingClientRect's transformed/zoomed size.
      const { offsetWidth, offsetHeight } = button;
      if (!offsetWidth || !offsetHeight) return;
      setGeometry(previous => previous.width === offsetWidth && previous.height === offsetHeight
        ? previous : createButtonGeometry(offsetWidth, offsetHeight));
    };
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(button);
      return () => observer.disconnect();
    }
    if (typeof window === 'undefined') return;
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [width, height, text, children]);
  
  return (
    <ButtonClipController
      theme={theme}
      neon={neon}
      colorType={colorType}
      backgroundColor={backgroundColor}
      textColor={textColor}
      borderColor={borderColor}
      width={width}
      height={height}
      $disabled={isDisabledState}
    >
      <ButtonBoxShadow aria-hidden="true" focusable="false" theme={theme} neon={neon} colorType={colorType}
        viewBox={`0 0 ${geometry.width} ${geometry.height}`} preserveAspectRatio="none">
        <path d={geometry.border} vectorEffect="non-scaling-stroke" />
      </ButtonBoxShadow>
      <ButtonClipBorder aria-hidden="true" focusable="false" theme={theme} neon={neon} colorType={colorType}
        borderColor={borderColor} viewBox={`0 0 ${geometry.width} ${geometry.height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="var(--cyber-button-edge-start)" />
            <stop offset="1" stopColor="var(--cyber-button-edge-end)" />
          </linearGradient>
        </defs>
        <path d={geometry.border} stroke={borderColor || `url(#${gradientId})`} vectorEffect="non-scaling-stroke" />
      </ButtonClipBorder>
      <ButtonContentContainer
        ref={buttonRef}
        $facePath={geometry.face}
        theme={theme}
        neon={neon}
        colorType={colorType}
        backgroundColor={backgroundColor}
        borderColor={borderColor}
        textColor={textColor}
        width={width}
        height={height}
        onClick={onClick}
        type={type}
        disabled={isDisabledState}
        aria-busy={loading}
        {...rest}
      >
        {loading ? (
          <LoadingIndicator compact label={text || 'Processando'} />
        ) : (
          children || text
        )}
      </ButtonContentContainer>
    </ButtonClipController>
  );
};

export const CyberButton = memo(CyberButtonComponent);
