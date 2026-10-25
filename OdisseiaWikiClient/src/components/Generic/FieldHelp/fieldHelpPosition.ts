export const getFieldHelpPosition = (
  anchor: { top: number; bottom: number; right: number },
  viewport: { width: number; height: number },
  contentHeight = 200,
  preferredWidth = 390,
) => {
  const width = Math.max(1, Math.min(preferredWidth, viewport.width - 24));
  const height = Math.max(1, Math.min(440, viewport.height - 24));
  const measured = Math.min(contentHeight, height);
  const left = Math.max(12, Math.min(anchor.right - width, viewport.width - width - 12));
  const below = viewport.height - anchor.bottom - 20 >= measured;
  return { width, height, left, below,
    top: below ? anchor.bottom + 8 : Math.max(12, anchor.top - measured - 8),
    arrowLeft: Math.max(12, Math.min(width - 20, anchor.right - 20 - left)),
  };
};
