/**
 * Normaliza caminhos de imagem para garantir que sejam absolutos a partir da raiz
 * Ex: "assets_dynamic/pages/image.jpg" -> "/assets_dynamic/pages/image.jpg"
 * Ex: "/assets_dynamic/pages/image.jpg" -> "/assets_dynamic/pages/image.jpg"
 * Ex: "public/assets_dynamic/pages/image.jpg" -> "/assets_dynamic/pages/image.jpg"
 */
export const normalizeImagePath = (imagePath: string | undefined): string => {
  if (!imagePath) return '';

  const trimmedPath = imagePath.trim();

  if (/^(data:|blob:)/i.test(trimmedPath)) {
    return trimmedPath;
  }

  const normalizedSeparators = trimmedPath
    .replace(/assets\\_dynamic/gi, 'assets_dynamic')
    .replace(/\\/g, '/');

  // Preserva a origem de URLs externas após normalizar apenas seus separadores.
  if (/^https?:/i.test(normalizedSeparators)) {
    return normalizedSeparators;
  }

  // Se já começa com /, devolvemos como está
  if (normalizedSeparators.startsWith('/')) {
    return normalizedSeparators;
  }

  // Remove "public/" do início se existir
  let normalized = normalizedSeparators.replace(/^public\//, '');

  // Garante que comece com /
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }

  return normalized;
};
