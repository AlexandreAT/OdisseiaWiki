import { HTMLAttributes, PropsWithChildren } from 'react';
import { AnimatedLine, Corner, Frame } from './HudFrame.style';

export interface HudFrameProps extends HTMLAttributes<HTMLElement> {
  neon: boolean;
  color?: string;
}

const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;
const lines = ['top', 'right', 'bottom', 'left'] as const;

export const HudFrame = ({
  neon,
  color = 'var(--clearneonBlue)',
  children,
  ...props
}: PropsWithChildren<HudFrameProps>) => (
  <Frame $neon={neon} $color={color} {...props}>
    {positions.map((position) => (
      <Corner key={position} $position={position} $neon={neon} $color={color} aria-hidden="true" />
    ))}
    {lines.map((position) => (
      <AnimatedLine key={position} $position={position} $neon={neon} $color={color} aria-hidden="true" />
    ))}
    {children}
  </Frame>
);
