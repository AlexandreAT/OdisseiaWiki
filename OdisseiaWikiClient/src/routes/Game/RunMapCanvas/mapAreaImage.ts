import type { GameRunMap, GameRunModeConfig } from '../../../models/GameRun';
import { normalizeImagePath } from '../../Wiki/utils/imagePathHelper';

export const getRunAreaImage = (fase: number, map: GameRunMap, config: GameRunModeConfig): string =>
  normalizeImagePath(map.nodes.find((node) => node.fase === fase && node.areaImage)?.areaImage
    || (map.secretReturnNodeId ? undefined : config.areas?.filter((area) => !area.isSecret)[fase - 1]?.image)
    || undefined);
