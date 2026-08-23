import { saveAsset } from './assetsService';

export type CharacterEntryImage = {
  imagem?: string;
  imagemArquivo?: File;
};

type PersistCharacterEntryImagesOptions<T extends CharacterEntryImage> = {
  assetType: 'personagens' | 'personagemjogador';
  entityName: string;
  resolveFolderName: (entry: T) => 'inventario' | 'proteses' | 'skills' | 'magias';
};

/**
 * Persiste apenas as imagens temporárias editadas dentro da ficha. A imagem
 * resultante fica no JSON pessoal da personagem e não altera a entidade-base.
 */
export const persistCharacterEntryImages = async <T extends CharacterEntryImage>(
  entries: T[],
  { assetType, entityName, resolveFolderName }: PersistCharacterEntryImagesOptions<T>,
): Promise<T[]> => Promise.all(entries.map(async (entry) => {
  const { imagemArquivo, ...entryWithoutTransientFile } = entry;

  if (!imagemArquivo) {
    return entryWithoutTransientFile as T;
  }

  const uploadedImage = await saveAsset({
    imageFile: imagemArquivo,
    type: assetType,
    entityName,
    folderName: resolveFolderName(entry),
  });

  return {
    ...entryWithoutTransientFile,
    imagem: uploadedImage.path,
  } as T;
}));
