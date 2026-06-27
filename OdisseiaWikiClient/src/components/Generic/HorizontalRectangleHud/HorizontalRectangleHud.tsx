import React, { ReactNode } from 'react';
import {
  HorizontalRectangleHudWrapper,
  HorizontalRectangleBackground,
  HorizontalRectangleContent,
  HorizontalRectangleBorder,
} from './HorizontalRectangleHud.style';

export interface HorizontalRectangleHudProps {
  children: ReactNode;
  neon?: boolean;
}

export const HorizontalRectangleHud: React.FC<HorizontalRectangleHudProps> = ({ children, neon = false }) => {
  return (
    <HorizontalRectangleHudWrapper>
      <HorizontalRectangleBackground />
      <HorizontalRectangleContent>
        {children}
      </HorizontalRectangleContent>
      <HorizontalRectangleBorder $neon={neon} />
    </HorizontalRectangleHudWrapper>
  );
};

export default HorizontalRectangleHud;
