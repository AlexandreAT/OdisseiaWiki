export interface GalleryImage {
  url: string;
  legenda?: string;
}

export type GalleryImageInput = string | GalleryImage | { src?: string; caption?: string };

export const normalizeGalleryImage = (value: GalleryImageInput): GalleryImage => {
  if (typeof value === 'string') return { url: value };

  const candidate = value as GalleryImage & { src?: string; caption?: string };
  return {
    url: candidate.url || candidate.src || '',
    legenda: candidate.legenda || candidate.caption || undefined,
  };
};

export const normalizeGalleryImages = (value: unknown): GalleryImage[] => {
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      parsed = value ? [value] : [];
    }
  }

  if (!Array.isArray(parsed)) return [];
  return parsed
    .map(item => normalizeGalleryImage(item as GalleryImageInput))
    .filter(item => item.url.trim().length > 0);
};
