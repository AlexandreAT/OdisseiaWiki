/**
 * Normaliza caminhos de imagem para garantir que sejam absolutos a partir da raiz
 * Ex: "assets_dynamic/pages/image.jpg" -> "/assets_dynamic/pages/image.jpg"
 * Ex: "/assets_dynamic/pages/image.jpg" -> "/assets_dynamic/pages/image.jpg"
 * Ex: "public/assets_dynamic/pages/image.jpg" -> "/assets_dynamic/pages/image.jpg"
 */
export const normalizeImagePath = (imagePath: string | undefined): string => {
  if (!imagePath) return '';

  // Se já começa com /, devolvemos como está
  if (imagePath.startsWith('/')) {
    return imagePath;
  }

  // Remove "public/" do início se existir
  let normalized = imagePath.replace(/^public\//, '');

  // Garante que comece com /
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }

  return normalized;
};
