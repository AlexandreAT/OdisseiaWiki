import React from 'react';
import { ButtonClipController, ButtonBoxShadow, ButtonClipBorder, ButtonContentContainer } from './HighlightButton.styles';

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
}

export const CyberButton = ({
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
  ...rest
}: CyberButtonProps) => {
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
      style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
    >
      <ButtonBoxShadow theme={theme} neon={neon} colorType={colorType} width={width} height={height} />
      <ButtonClipBorder theme={theme} neon={neon} colorType={colorType} width={width} height={height} />
      <ButtonContentContainer
        theme={theme}
        neon={neon}
        colorType={colorType}
        backgroundColor={backgroundColor}
        textColor={textColor}
        width={width}
        height={height}
        onClick={onClick}
        type={type}
        disabled={disabled}
        {...rest}
      >
        {children || text}
      </ButtonContentContainer>
    </ButtonClipController>
  );
};