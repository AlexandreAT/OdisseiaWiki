import api from '../axios/api';

export interface SaveAssetPayload {
    imageFile: File;
    type: string;
    entityName: string;
    folderName?: string;
}

export interface SaveAssetResult {
    path: string;
    url?: string;
    provider?: 'cloudinary' | 'local' | 'imgbb' | 'legacy';
    publicId?: string;
}

const uploadCache = new WeakMap<File, Map<string, Promise<SaveAssetResult>>>();

const getUploadKey = ({ type, entityName, folderName }: SaveAssetPayload) =>
    `${type.trim().toLowerCase()}|${entityName.trim()}|${folderName?.trim() ?? ''}`;

/**
 * Salva uma imagem e retorna uma URL absoluta em produção.
 */
export const saveAsset = (payload: SaveAssetPayload): Promise<SaveAssetResult> => {
    const key = getUploadKey(payload);
    const fileUploads = uploadCache.get(payload.imageFile) ?? new Map<string, Promise<SaveAssetResult>>();
    const cachedUpload = fileUploads.get(key);
    if (cachedUpload) return cachedUpload;

    const upload = (async () => {
        const formData = new FormData();
        formData.append('file', payload.imageFile);
        formData.append('type', payload.type);
        formData.append('entityName', payload.entityName);
        if (payload.folderName) formData.append('folderName', payload.folderName);

        const response = await api.postForm<SaveAssetResult>('/assets/upload', formData);
        return response.data;
    })();

    fileUploads.set(key, upload);
    uploadCache.set(payload.imageFile, fileUploads);

    upload.catch(() => {
        fileUploads.delete(key);
        if (fileUploads.size === 0) uploadCache.delete(payload.imageFile);
    });

    return upload;
};
