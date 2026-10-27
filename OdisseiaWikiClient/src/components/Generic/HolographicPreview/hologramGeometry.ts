export interface PreviewAnchor { left: number; top: number; width: number; height: number; }

export function hologramGeometry(anchor: PreviewAnchor, width: number, height: number, requestedSize = 360) {
  const maximum = Number.isFinite(requestedSize) && requestedSize > 0 ? requestedSize : 360;
  const size = Math.max(80, Math.min(maximum, width - 32, height - 80));
  const left = (width - size) / 2, top = (height - size) / 2;
  const right = left + size, bottom = top + size;
  const x = anchor.left + anchor.width / 2, y = anchor.top + anchor.height / 2;
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
  const side = Math.abs(x - width / 2) >= Math.abs(y - height / 2)
    ? x < width / 2 ? 'left' : 'right' : y < height / 2 ? 'top' : 'bottom';
  const endX = side === 'left' ? left : side === 'right' ? right : clamp(x, left + 12, right - 12);
  const endY = side === 'top' ? top : side === 'bottom' ? bottom : clamp(y, top + 12, bottom - 12);
  const corners = [[left + 10, top], [right - 10, top], [right, top + 10], [right, bottom - 10],
    [right - 10, bottom], [left + 10, bottom], [left, bottom - 10], [left, top + 10]];
  const first = { top: 1, right: 3, bottom: 5, left: 7 }[side];
  const outline = Array.from({ length: 8 }, (_, index) => corners[(first + index) % 8]);
  return { size, left, top, x, y, width, height,
    connector: `M ${x} ${y} L ${endX} ${y} L ${endX} ${endY}`,
    frame: `M ${endX} ${endY} ${outline.map(([px, py]) => `L ${px} ${py}`).join(' ')} L ${endX} ${endY}` };
}
