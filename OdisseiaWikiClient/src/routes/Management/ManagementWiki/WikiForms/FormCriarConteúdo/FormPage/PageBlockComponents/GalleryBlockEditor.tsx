import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { PageBlock, GalleryBlockContent, ImageBlockContent } from '../../../../../../../models/Pages';
import { ImageUploader } from '../../../../../../../components/Generic/ImageUploader/ImageUploader';
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
  const [aspectRatio, setAspectRatio] = useState<'square' | 'rectangle'>('rectangle');

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
    try {
      const assetResult = await saveAsset({
        imageFile: result.file,
        type: "pages/gallery",
        entityName: `gallery_${Date.now()}`,
      });
      
      const novaImagem: ImageBlockContent = {
        url: assetResult.path,
      };

      const novasImagens = [...imagens, novaImagem];
      setImagens(novasImagens);
      onUpdate({ imagens: novasImagens });

      toast.success('Imagem adicionada com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar imagem');
      console.error(error);
    }
  };

  const handleLegendaChange = (index: number, newLegenda: string) => {
    const novasImagens = imagens.map((img, idx) =>
      idx === index ? { ...img, legenda: newLegenda || undefined } : img
    );
    setImagens(novasImagens);
    onUpdate({ imagens: novasImagens });
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
                <div style={{ padding: '4px 6px', flexShrink: 0 }}>
                  <input
                    type="text"
                    placeholder="Legenda (opcional)"
                    value={img.legenda || ''}
                    onChange={(e) => handleLegendaChange(idx, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '3px 6px',
                      fontSize: '11px',
                      border: '1px solid #555',
                      borderRadius: '4px',
                      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f0f0f0',
                      color: theme === 'dark' ? '#ccc' : '#333',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#00d4ff';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#555';
                    }}
                  />
                </div>
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
