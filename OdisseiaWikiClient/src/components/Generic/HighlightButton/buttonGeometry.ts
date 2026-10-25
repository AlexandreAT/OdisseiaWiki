/** One silhouette for the face, closed border and neon, in CSS pixels. */
export function createButtonGeometry(width: number, height: number) {
  const w = Math.max(4, Number.isFinite(width) ? width : 100);
  const h = Math.max(4, Number.isFinite(height) ? height : 50);
  const cutWidth = Math.min(18, w / 3);
  const cutHeight = Math.min(12, h / 3);
  const radius = Math.min(8, w / 4, h / 4);
  const diagonalLength = Math.hypot(cutWidth, cutHeight);
  const path = (inset: number) => {
    const right = w - inset;
    const bottom = h - inset;
    const r = Math.max(0, radius - inset);
    // Offset the diagonal along its normal, so the whole 2px stroke stays inside
    // the silhouette and joins the left/bottom edges without protruding ends.
    const diagonalX = cutWidth + inset * (diagonalLength - cutWidth) / cutHeight;
    const diagonalY = h - cutHeight + inset * (cutHeight - diagonalLength) / cutWidth;
    return `M ${inset + r} ${inset} H ${right - r} A ${r} ${r} 0 0 1 ${right} ${inset + r}` +
      ` V ${bottom - r} A ${r} ${r} 0 0 1 ${right - r} ${bottom}` +
      ` H ${diagonalX} L ${inset} ${diagonalY} V ${inset + r}` +
      ` A ${r} ${r} 0 0 1 ${inset + r} ${inset} Z`;
  };
  return { width: w, height: h, face: path(0), border: path(1) };
}
