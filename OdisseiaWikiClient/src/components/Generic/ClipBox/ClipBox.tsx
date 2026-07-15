import { ReactNode } from "react";
import { ClipController, BoxShadow, ClipBorder, ContentContainer, ClipBorderTop } from "./ClipBox.style";

interface ClipBoxProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  children: ReactNode;
  width?: string;
  height?: string;
  borderRadius?: string;
  type?: 'primary' | 'secondary';
  innerOffset?: string;
  doubleCut?: boolean;
  zIndex?: number;
  backgroundColor?: string;
  autoSize?: boolean;
  useClip?: boolean;
  maxHeight?: string;
  maxWidth?: string;
  mobileAutoHeight?: boolean;
}

export const ClipBox = ({ theme, neon, children, width, height, maxHeight, maxWidth, borderRadius, type, innerOffset, doubleCut, zIndex, autoSize, backgroundColor, useClip = true, mobileAutoHeight = false }: ClipBoxProps) => {
  if (!useClip) {
    return (
      <ClipController $mobileAutoHeight={mobileAutoHeight} maxWidth={maxWidth} maxHeight={maxHeight} autoSize={autoSize} zIndex={zIndex} theme={theme} neon={neon} width={width} height={height} borderRadius={borderRadius} type={type} doubleCut={doubleCut} enableClip={false}>
        <ContentContainer $mobileAutoHeight={mobileAutoHeight} autoSize={autoSize} theme={theme} neon={neon} width={width} height={height} borderRadius={borderRadius} type={type} innerOffset={innerOffset} doubleCut={doubleCut} enableClip={false} backgroundColor={backgroundColor}>
          {children}
        </ContentContainer>
      </ClipController>
    );
  }

  return (
    <ClipController $mobileAutoHeight={mobileAutoHeight} maxWidth={maxWidth} maxHeight={maxHeight} autoSize={autoSize} zIndex={zIndex} theme={theme} neon={neon} width={width} height={height} borderRadius={borderRadius} type={type} doubleCut={doubleCut} enableClip>
      <BoxShadow $mobileAutoHeight={mobileAutoHeight} autoSize={autoSize} theme={theme} neon={neon} width={width} height={height} borderRadius={borderRadius} type={type} innerOffset={innerOffset} doubleCut={doubleCut}/>
      <ClipBorder $mobileAutoHeight={mobileAutoHeight} autoSize={autoSize} theme={theme} neon={neon} width={width} height={height} borderRadius={borderRadius} type={type} innerOffset={innerOffset} doubleCut={doubleCut}/>
      {doubleCut && (
        <ClipBorderTop autoSize={autoSize} theme={theme} neon={neon} width={width} height={height} borderRadius={borderRadius} type={type} innerOffset={innerOffset} />
      )}
      <ContentContainer $mobileAutoHeight={mobileAutoHeight} autoSize={autoSize} theme={theme} neon={neon} width={width} height={height} borderRadius={borderRadius} type={type} innerOffset={innerOffset} doubleCut={doubleCut} enableClip backgroundColor={backgroundColor}>
        {children}
      </ContentContainer>
    </ClipController>
  );
};
