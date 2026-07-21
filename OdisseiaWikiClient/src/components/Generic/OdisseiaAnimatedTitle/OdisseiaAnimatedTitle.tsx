import { useId } from 'react';
import { AnimatedTitleSvg } from './OdisseiaAnimatedTitle.style';
import { OdisseiaAnimatedTitleProps } from './OdisseiaAnimatedTitle.type';

export const OdisseiaAnimatedTitle = ({ theme, neon, text = 'Odisseia' }: OdisseiaAnimatedTitleProps) => {
  const uniqueId = useId().replace(/:/g, '');
  const titleId = `odisseia-title-${uniqueId}`;
  const shadowFilterId = `odisseia-title-shadow-${uniqueId}`;
  const shadowColor = theme === 'light' ? 'var(--clearneonViolet)' : 'var(--clearneonPink)';
  const shadowOffset = neon === 'on' ? 1.5 : 0;
  const shadowBlur = neon === 'on' ? 2.5 : 3;
  const shadowOpacity = neon === 'on' ? 1 : 0.75;
  const isCustomTitle = text !== 'Odisseia';
  const viewBoxWidth = Math.max(240, text.length * 34 + 100);
  const titlePosition = isCustomTitle ? viewBoxWidth / 2 : 0;

  return (
    <AnimatedTitleSvg
      theme={theme}
      neon={neon}
      $wide={isCustomTitle}
      viewBox={`0 0 ${viewBoxWidth} 38`}
      role="img"
      aria-labelledby={titleId}
      preserveAspectRatio={isCustomTitle ? 'xMidYMid meet' : 'xMinYMid meet'}
    >
      <title id={titleId}>{text}</title>
      <defs>
        <filter
          id={shadowFilterId}
          filterUnits="userSpaceOnUse"
          x="-50"
          y="-30"
          width={viewBoxWidth + 100}
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
      <g>
        <text className="title-text title-outline" x={titlePosition} y="30">
          {text}
        </text>
        <text
          className="title-text title-fill"
          x={titlePosition}
          y="30"
          filter={`url(#${shadowFilterId})`}
        >
          {text}
        </text>
      </g>
    </AnimatedTitleSvg>
  );
};
