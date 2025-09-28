/**
 * Aqui eu monto a URL padrão
 * @param type tipo da entidade ('racas', 'personagens', etc)
 * @param entityName nome da entidade ('orc', 'elf', etc)
 * @param folderName opcional, ex: 'galeria'
 */
export function getFirstImageUrl(type: string, entityName: string, folderName?: string): string {
  const safeEntity = entityName.toLowerCase().replace(/\s+/g, '-');
  if (folderName) {
    return `/assets_dynamic/${type}/${safeEntity}/${folderName}/`; 
  }
  return `/assets_dynamic/${type}/${safeEntity}/`; 
}

/**
 * Aqui eu monto a URL completa de uma imagem específica
 */
export function getImageUrl(type: string, entityName: string, imageName: string, folderName?: string): string {
  const safeEntity = entityName.toLowerCase().replace(/\s+/g, '-');
  return folderName
    ? `/assets_dynamic/${type}/${safeEntity}/${folderName}/${imageName}`
    : `/assets_dynamic/${type}/${safeEntity}/${imageName}`;
}
