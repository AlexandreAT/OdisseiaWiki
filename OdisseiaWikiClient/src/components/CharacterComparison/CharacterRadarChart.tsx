import React from 'react';
import { CharacterComparisonData } from './CharacterComparison.types';
import {
  formatComparisonDelta,
  formatNumber,
  getRadarScales,
  RADAR_AXES,
} from './characterComparison.utils';
import { RadarFigure, RadarSvg } from './CharacterComparison.style';

interface CharacterRadarChartProps {
  current: CharacterComparisonData;
  candidate?: CharacterComparisonData | null;
  focus: 'current' | 'candidate';
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

interface RadarPoint {
  x: number;
  y: number;
}

const CENTER_X = 260;
const CENTER_Y = 225;
const RADIUS = 170;
const LABEL_RADIUS = 200;
const LEVELS = 5;

const pointAt = (index: number, radius: number): RadarPoint => {
  const angle = (-90 + index * (360 / RADAR_AXES.length)) * (Math.PI / 180);
  return {
    x: CENTER_X + Math.cos(angle) * radius,
    y: CENTER_Y + Math.sin(angle) * radius,
  };
};

const pointsFor = (
  character: CharacterComparisonData,
  scales: ReturnType<typeof getRadarScales>,
) => RADAR_AXES.map((axis, index) => {
  const maximum = Math.max(1, scales[axis.key]);
  const normalized = Math.max(0, Math.min(1, character.status[axis.key] / maximum));
  return pointAt(index, RADIUS * normalized);
});

const serializePoints = (points: RadarPoint[]) => points
  .map((point) => `${point.x},${point.y}`)
  .join(' ');

const RadarArea = ({
  points,
  kind,
  primary,
}: {
  points: RadarPoint[];
  kind: 'current' | 'candidate';
  primary: boolean;
}) => (
  <g>
    <polygon
      className={`radar-area ${kind} ${primary ? 'primary' : 'secondary'}`}
      points={serializePoints(points)}
    />
    {points.map((point, index) => (
      <circle
        key={`${kind}-${RADAR_AXES[index].key}`}
        className={`radar-dot ${kind} ${primary ? 'primary' : 'secondary'}`}
        cx={point.x}
        cy={point.y}
        r={primary ? 3.2 : 2.6}
      />
    ))}
  </g>
);

export const CharacterRadarChart = ({
  current,
  candidate,
  focus,
  theme,
  neon,
}: CharacterRadarChartProps) => {
  const scales = React.useMemo(() => getRadarScales(current, candidate), [candidate, current]);
  const currentPoints = React.useMemo(() => pointsFor(current, scales), [current, scales]);
  const candidatePoints = React.useMemo(
    () => candidate ? pointsFor(candidate, scales) : null,
    [candidate, scales],
  );
  const focused = focus === 'candidate' && candidate ? candidate : current;
  const compared = focused === current ? candidate : current;

  return (
    <RadarFigure aria-label={`Gráfico comparativo de ${focused.nome}`}>
      <RadarSvg $theme={theme} $neon={neon === 'on'} viewBox="0 0 520 450" role="img">
        {Array.from({ length: LEVELS }, (_, level) => {
          const fraction = (level + 1) / LEVELS;
          const points = RADAR_AXES.map((_, index) => pointAt(index, RADIUS * fraction));
          const marker = pointAt(0, RADIUS * fraction);
          return (
            <React.Fragment key={fraction}>
              <polygon className="radar-grid" points={serializePoints(points)} />
              <text className="radar-scale" x={CENTER_X + 5} y={marker.y + 3}>{(level + 1) * 20}</text>
            </React.Fragment>
          );
        })}

        {RADAR_AXES.map((axis, index) => {
          const edge = pointAt(index, RADIUS);
          const label = pointAt(index, index === 2 || index === 6 ? 185 : LABEL_RADIUS);
          const value = focused.status[axis.key];
          const delta = formatComparisonDelta(value, compared?.status[axis.key]);
          const anchor = label.x < CENTER_X - 15 ? 'end' : label.x > CENTER_X + 15 ? 'start' : 'middle';
          const labelOffset = index === 0 ? -3 : index === 4 ? -2 : -5;
          return (
            <g key={axis.key}>
              <line className="radar-axis" x1={CENTER_X} y1={CENTER_Y} x2={edge.x} y2={edge.y} />
              <text className="radar-label" x={label.x} y={label.y + labelOffset} textAnchor={anchor}>
                <tspan>{axis.label}</tspan>
                <tspan x={label.x} dy="17" className="radar-value">{formatNumber(value)}</tspan>
                {delta && (
                  <tspan dx="5" className={`radar-delta ${delta.kind}`}>{delta.label}</tspan>
                )}
              </text>
            </g>
          );
        })}

        {focus === 'candidate' ? (
          <>
            <RadarArea points={currentPoints} kind="current" primary={false} />
            {candidatePoints && <RadarArea points={candidatePoints} kind="candidate" primary />}
          </>
        ) : (
          <>
            {candidatePoints && <RadarArea points={candidatePoints} kind="candidate" primary={false} />}
            <RadarArea points={currentPoints} kind="current" primary />
          </>
        )}
      </RadarSvg>
    </RadarFigure>
  );
};
