export type ImageDisplayShape = 'circle' | 'square' | 'rectangle';

const RECTANGLE_RATIO_THRESHOLD = 1.2;
const SAMPLE_SIZE = 40;
const TRANSPARENT_ALPHA_THRESHOLD = 36;

const hasTransparentCorners = (image: HTMLImageElement): boolean => {
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return false;

  try {
    context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    const cornerSize = 7;
    const corners = [
      [0, 0],
      [SAMPLE_SIZE - cornerSize, 0],
      [0, SAMPLE_SIZE - cornerSize],
      [SAMPLE_SIZE - cornerSize, SAMPLE_SIZE - cornerSize],
    ];

    const transparentCorners = corners.filter(([x, y]) => {
      const pixels = context.getImageData(x, y, cornerSize, cornerSize).data;
      let transparentPixels = 0;

      for (let index = 3; index < pixels.length; index += 4) {
        if (pixels[index] <= TRANSPARENT_ALPHA_THRESHOLD) transparentPixels += 1;
      }

      return transparentPixels >= (pixels.length / 4) * 0.55;
    }).length;

    return transparentCorners >= 3;
  } catch {
    // Imagens externas sem CORS ainda podem ser classificadas pela proporção.
    return false;
  }
};

export const detectLoadedImageShape = (image: HTMLImageElement): ImageDisplayShape => {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (!width || !height) return 'square';

  const ratio = width / height;
  if (ratio >= RECTANGLE_RATIO_THRESHOLD || ratio <= 1 / RECTANGLE_RATIO_THRESHOLD) {
    return 'rectangle';
  }

  return hasTransparentCorners(image) ? 'circle' : 'square';
};

export const detectImageShapeFromUrl = (url: string): Promise<ImageDisplayShape> => (
  new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(detectLoadedImageShape(image));
    image.onerror = () => resolve('square');
    image.src = url;
  })
);
