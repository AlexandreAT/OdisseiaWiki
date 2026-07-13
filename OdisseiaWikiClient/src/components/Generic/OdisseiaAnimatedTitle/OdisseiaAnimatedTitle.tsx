import { useId } from 'react';
import { AnimatedTitleSvg } from './OdisseiaAnimatedTitle.style';
import { OdisseiaAnimatedTitleProps } from './OdisseiaAnimatedTitle.type';

export const OdisseiaAnimatedTitle = ({ theme, neon }: OdisseiaAnimatedTitleProps) => {
  const uniqueId = useId().replace(/:/g, '');
  const titleId = `odisseia-title-${uniqueId}`;
  const shadowFilterId = `odisseia-title-shadow-${uniqueId}`;
  const shadowColor = theme === 'light' ? 'var(--clearneonViolet)' : 'var(--clearneonPink)';
  const shadowOffset = neon === 'on' ? 1.5 : 0;
  const shadowBlur = neon === 'on' ? 2.5 : 3;
  const shadowOpacity = neon === 'on' ? 1 : 0.75;

  return (
    <AnimatedTitleSvg
      theme={theme}
      neon={neon}
      viewBox="0 0 240 38"
      role="img"
      aria-labelledby={titleId}
      preserveAspectRatio="xMinYMid meet"
    >
      <title id={titleId}>Odisseia</title>
      <defs>
        <filter
          id={shadowFilterId}
          filterUnits="userSpaceOnUse"
          x="-40"
          y="-30"
          width="320"
          height="100"
          colorInterpolationFilters="sRGB"
        >
          <feDropShadow
            dx={shadowOffset}
            dy={shadowOffset}
            stdDeviation={shadowBlur}
            floodColor={shadowColor}
            floodOpacity={shadowOpacity}
          />
        </filter>
      </defs>
      <g className="title-reveal">
        <text
          className="title-text title-fill"
          x="0"
          y="30"
          filter={`url(#${shadowFilterId})`}
        >
          Odisseia
        </text>
      </g>
    </AnimatedTitleSvg>
  );
};
