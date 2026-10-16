import { RefObject, useLayoutEffect, useMemo, useState } from 'react';
import type { GameRunMap, GameRunModeConfig } from '../../../models/GameRun';
import { getVisibleRunMap } from '../RunMapCanvas/visibleRunMap';
import { RunPanelBackdrop } from './GameRunShell.style';

interface Props {
  map: GameRunMap;
  config: GameRunModeConfig;
  mapAreaRef: RefObject<HTMLDivElement>;
}

interface BackdropSegment {
  fase: number;
  image: string;
  top: number;
  height: number;
}

export const RunRegionBackdrops = ({ map, config, mapAreaRef }: Props) => {
  const { areas, height } = useMemo(() => getVisibleRunMap(map, config), [map, config]);
  const [segments, setSegments] = useState<BackdropSegment[]>([]);

  useLayoutEffect(() => {
    const mapArea = mapAreaRef.current;
    const drawing = mapArea?.querySelector('svg');
    const panel = mapArea?.parentElement;
    if (!mapArea || !drawing || !panel || !areas.length) return;

    const measure = () => {
      const panelRect = panel.getBoundingClientRect();
      const drawingRect = drawing.getBoundingClientRect();
      const starts = areas.map((area, index) => index === 0 ? 0 :
        Math.max(0, Math.min(panelRect.height,
          drawingRect.top - panelRect.top + area.start / height * drawingRect.height)));
      const next = areas.map((area, index) => ({
        fase: area.fase,
        image: area.image,
        top: starts[index],
        height: Math.max(0, (starts[index + 1] ?? panelRect.height) - starts[index]),
      }));
      setSegments((current) => current.length === next.length && current.every((segment, index) =>
        segment.fase === next[index].fase && segment.image === next[index].image &&
        segment.top === next[index].top && segment.height === next[index].height) ? current : next);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    observer.observe(mapArea);
    observer.observe(drawing);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [areas, height, mapAreaRef]);

  return <>{segments.map((segment) => <RunPanelBackdrop key={segment.fase}
    $top={segment.top} $height={segment.height} data-run-region-backdrop aria-hidden="true">
    {segment.image && <img src={segment.image} alt="" />}
  </RunPanelBackdrop>)}</>;
};
