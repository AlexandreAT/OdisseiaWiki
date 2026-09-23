import React, { memo } from 'react';
import { ButtonClipController, ButtonBoxShadow, ButtonClipBorder, ButtonContentContainer } from './HighlightButton.styles';
import { useApiRequestActivity } from '../../../services/apiRequestActivity';
import { LoadingIndicator } from '../LoadingIndicator';

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
  const hasActiveApiRequest = useApiRequestActivity();
  const isDisabledState = disabled || loading || hasActiveApiRequest;
  
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
        disabled={isDisabledState}
        aria-busy={loading || hasActiveApiRequest}
        {...rest}
      >
        {loading || hasActiveApiRequest ? (
          <LoadingIndicator compact label={text || 'Processando'} />
        ) : (
          children || text
        )}
      </ButtonContentContainer>
    </ButtonClipController>
  );
};

export const CyberButton = memo(CyberButtonComponent);
