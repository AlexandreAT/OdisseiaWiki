// src/services/assetsService.ts
import api from '../axios/api';

export interface SaveAssetPayload {
    imageFile: File; // arquivo da imagem
    type: string; // 'racas', 'personagens', etc
    entityName: string; // 'orc', 'elf', 'nome do personagem', etc
    folderName?: string; // opcional, ex: 'galeria'
}

export interface SaveAssetResult {
    path: string; // caminho relativo retornado pelo backend
}

/**
 * Salva uma imagem no backend e retorna o caminho relativo
 */
export const saveAsset = async (payload: SaveAssetPayload): Promise<SaveAssetResult> => {
    const formData = new FormData();
    formData.append('file', payload.imageFile);
    formData.append('type', payload.type);
    formData.append('entityName', payload.entityName);
    if (payload.folderName) formData.append('folderName', payload.folderName);
    console.log("🚀 ~ saveAsset ~ formData:", formData)

    const response = await api.postForm('/assets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
};