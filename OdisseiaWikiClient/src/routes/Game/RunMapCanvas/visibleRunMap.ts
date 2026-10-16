import type { GameRunMap, GameRunModeConfig } from '../../../models/GameRun';
import { getRunAreaImage } from './mapAreaImage';

export const getVisibleRunMap = (map: GameRunMap, config: GameRunModeConfig) => {
  const unlockedArea = Math.max(1, ...map.nodes.filter((node) =>
    node.state === 'DISPONIVEL' || node.state === 'SELECIONADO' || node.state === 'CONCLUIDO')
    .map((node) => node.fase));
  const nodes = map.nodes.filter((node) =>
    node.fase <= unlockedArea && (map.schemaVersion >= 3 || node.revealed));
  const height = Math.max(190, 145 + Math.max(...nodes.map((node) => node.layer), 0) * 130);
  const areas = [...new Set(nodes.filter((node) => node.areaName).map((node) => node.fase))]
    .map((fase) => {
      const areaNodes = nodes.filter((node) => node.fase === fase && node.areaName);
      const nextLayer = Math.min(...nodes.filter((node) => node.fase > fase).map((node) => node.layer));
      const lastLayer = Math.max(...areaNodes.map((node) => node.layer));
      const start = fase === 1 ? 0 : 72 + (Math.min(...areaNodes.map((node) => node.layer)) - .5) * 130;
      const end = Number.isFinite(nextLayer) ? 72 + (lastLayer + nextLayer) * 65 : height;
      return { fase, name: areaNodes[0].areaName, image: getRunAreaImage(fase, map, config), start, end };
    }).sort((left, right) => left.start - right.start);

  return { nodes, height, areas };
};
