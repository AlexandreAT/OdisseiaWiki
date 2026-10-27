export interface MapPoint { x: number; y: number; }

function bezierLength(points: MapPoint[]) {
  let length = 0, previous = points[0];
  for (let step = 1; step <= 64; step++) {
    const t = step / 64;
    let level = points;
    while (level.length > 1) level = level.slice(1).map((point, index) => ({
      x: level[index].x * (1 - t) + point.x * t,
      y: level[index].y * (1 - t) + point.y * t,
    }));
    length += Math.hypot(level[0].x - previous.x, level[0].y - previous.y);
    previous = level[0];
  }
  return length;
}

/** Matches the quadratic corners used by the actual map rectangles. */
export function mapRoundedBorderLength(width: number, height: number, radius: number) {
  return 2 * (width + height - 4 * radius) + 4 * bezierLength([
    { x: 0, y: radius }, { x: 0, y: 0 }, { x: radius, y: 0 },
  ]);
}

/** A single geometric source for both the visible rail and its travelling light. */
export function mapConnectionRoute(from: MapPoint, to: MapPoint) {
  const startY = from.y + 35;
  const endY = to.y - 35;
  const control = (endY - startY) * .42;
  const forwardCurve = `C ${from.x} ${startY + control} ${to.x} ${endY - control} ${to.x} ${endY}`;
  const reverseCurve = `C ${to.x} ${endY - control} ${from.x} ${startY + control} ${from.x} ${startY}`;
  return {
    start: { x: from.x, y: startY }, end: { x: to.x, y: endY },
    get length() { return bezierLength([{ x: from.x, y: startY }, { x: from.x, y: startY + control },
      { x: to.x, y: endY - control }, { x: to.x, y: endY }]); },
    forwardCurve, reverseCurve,
    forward: `M ${from.x} ${startY} ${forwardCurve}`,
    reverse: `M ${to.x} ${endY} ${reverseCurve}`,
  };
}

interface BorderRoute { x: number; anchorY: number; outline: string; length: number; }

/** One continuous walk per branch; common phase boundaries make the beams split/rejoin together. */
export function mapLaserBranch(from: BorderRoute, { border, connection }: {
  border: BorderRoute; connection: ReturnType<typeof mapConnectionRoute>;
}) {
  const linkLength = Math.hypot(from.x - connection.start.x, from.anchorY - connection.start.y) +
    connection.length + Math.hypot(border.x - connection.end.x, border.anchorY - connection.end.y);
  const length = from.length + linkLength * 2 + border.length;
  const offset = (distance: number) => 100 * (1 - distance / length);
  return {
    route: `M ${from.x} ${from.anchorY} ${from.outline} L ${connection.start.x} ${connection.start.y} ${connection.forwardCurve}` +
    ` L ${border.x} ${border.anchorY} ${border.outline}` +
    ` L ${connection.end.x} ${connection.end.y} ${connection.reverseCurve} L ${from.x} ${from.anchorY}`,
    dash: 24 / length * 100,
    sourceEnd: offset(from.length), targetStart: offset(from.length + linkLength),
    targetEnd: offset(from.length + linkLength + border.length),
  };
}
