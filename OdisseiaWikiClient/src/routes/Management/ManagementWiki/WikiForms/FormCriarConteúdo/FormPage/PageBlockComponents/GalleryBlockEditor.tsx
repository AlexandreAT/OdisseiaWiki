import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { PageBlock, GalleryBlockContent, ImageBlockContent } from '../../../../../../../models/Pages';
import { ImageUploader } from '../../../../../../../components/Generic/ImageUploader/ImageUploader';
import { InputText } from '../../../../../../../components/Generic/InputText/InputText';
import { saveAsset } from '../../../../../../../services/assetsService';
import type { CropPreset } from '../../../../../../../components/Generic/ImageUploader/types';
import {
  Container,
  GalleryContainer,
  GalleryGrid,
  ImageItem,
  ImageThumb,
  DeleteButton,
  GalleryLabel,
  AspectRatioSelector,
  AspectButton,
} from './GalleryBlockEditor.style';

interface GalleryBlockEditorProps {
  block: PageBlock;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  onUpdate: (content: GalleryBlockContent) => void;
}

export const GalleryBlockEditor: React.FC<GalleryBlockEditorProps> = ({
  block,
  theme,
  neon,
  onUpdate,
}) => {
  const content = (block.conteudo as GalleryBlockContent) || { imagens: [] };
  const [imagens, setImagens] = useState<ImageBlockContent[]>(content.imagens || []);
  const [newLegenda, setNewLegenda] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'square' | 'rectangle'>('rectangle');
  const [uploadingImage, setUploadingImage] = useState(false);

  const getCropPreset = (): CropPreset => {
    if (aspectRatio === 'square') {
      return {
        mode: 'single',
        aspectRatio: 1,
        shape: 'rectangle',
        displayShape: 'rectangle',
        label: 'Quadrado (1:1)',
      };
    }
    return {
      mode: 'single',
      aspectRatio: 16 / 9,
      shape: 'rectangle',
      displayShape: 'rectangle',
      label: 'Retângulo (16:9)',
    };
  };

  const handleImageUpload = async (result: any) => {
    setUploadingImage(true);
    try {
      const assetResult = await saveAsset({
        imageFile: result.file,
        type: "pages/gallery",
        entityName: `gallery_${Date.now()}`,
      });
      
      const novaImagem: ImageBlockContent = {
        url: assetResult.path,
        legenda: newLegenda,
      };

      const novasImagens = [...imagens, novaImagem];
      setImagens(novasImagens);
      onUpdate({ imagens: novasImagens });

      setNewLegenda('');
      toast.success('Imagem adicionada com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar imagem');
      console.error(error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const novasImagens = imagens.filter((_, i) => i !== index);
    setImagens(novasImagens);
    onUpdate({ imagens: novasImagens });
  };

  return (
    <GalleryContainer $isDark={theme === 'dark'}>
      <Container>
        <AspectRatioSelector>
          <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
            Proporção:
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <AspectButton
              $isActive={aspectRatio === 'square'}
              onClick={() => setAspectRatio('square')}
              type="button"
            >
              Quadrado (1:1)
            </AspectButton>
            <AspectButton
              $isActive={aspectRatio === 'rectangle'}
              onClick={() => setAspectRatio('rectangle')}
              type="button"
            >
              Retângulo (16:9)
            </AspectButton>
          </div>
        </AspectRatioSelector>

        <ImageUploader
          theme={theme}
          neon={neon}
          label="Adicionar Imagem"
          onImageCropped={handleImageUpload}
          cropPreset={getCropPreset()}
        />

        <InputText
          theme={theme}
          neon={neon}
          label="Legenda (opcional)"
          value={newLegenda}
          onChange={(e) => setNewLegenda(e.target.value)}
          width="100%"
        />
      </Container>

      {imagens.length > 0 && (
        <>
          <GalleryLabel>
            Imagens adicionadas ({imagens.length}):
          </GalleryLabel>
          <GalleryGrid>
            {imagens.map((img, idx) => (
              <ImageItem key={idx} $isDark={theme === 'dark'}>
                <ImageThumb src={img.url} alt={img.legenda || `Imagem ${idx + 1}`} />
                {img.legenda && (
                  <div style={{ fontSize: '10px', padding: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fff' }}>
                    {img.legenda}
                  </div>
                )}
                <DeleteButton onClick={() => handleRemoveImage(idx)}>
                  ✕
                </DeleteButton>
              </ImageItem>
            ))}
          </GalleryGrid>
        </>
      )}
    </GalleryContainer>
  );
};
