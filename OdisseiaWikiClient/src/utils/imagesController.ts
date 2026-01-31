/**
 * Retorna caminho base (quando backend retornou apenas pasta)
 */
export function getFirstImageUrl(type: string, entityName: string, folderName?: string): string {
  const safeEntity = entityName.toLowerCase().replace(/\s+/g, '-');
  if (folderName) {
    return `/assets_dynamic/${type}/${safeEntity}/${folderName}/`;
  }
  return `/assets_dynamic/${type}/${safeEntity}/`;
}

/**
 * Recebe um path vindo do backend ou monta local.
 * Se `imagePath` for absoluta (http...), retorna direto.
 * Caso contrário, monta conforme padrão local.
 */
export function getImageUrl(type: string, entityName: string, imagePathOrName: string, folderName?: string): string {
  if (!imagePathOrName) return '';
  const isAbsolute = /^https?:\/\//i.test(imagePathOrName);
  if (isAbsolute) return imagePathOrName;

  const safeEntity = entityName.toLowerCase().replace(/\s+/g, '-');
  return folderName
    ? `/assets_dynamic/${type}/${safeEntity}/${folderName}/${imagePathOrName}`
    : `/assets_dynamic/${type}/${safeEntity}/${imagePathOrName}`;
}
